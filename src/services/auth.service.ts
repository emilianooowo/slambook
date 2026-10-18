import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { AuthUser, UserProfile } from '@/types/slambook.types';
import { sanitizeInput, isValidUsername, MAX_LENGTHS } from '@/lib/security';
import { rankingsService } from '@/services/rankings.service';

const MOCK_STORAGE_KEY = 'slambook_mock_user_v3';
const MOCK_PROFILES_KEY = 'slambook_mock_profiles_v3';

type AuthListener = (user: AuthUser | null) => void;

class AuthService {
  private listeners: Set<AuthListener> = new Set();

  constructor() {
    if (typeof window !== 'undefined' && isSupabaseConfigured()) {
      const supabase = createClient();
      supabase?.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          const profile = await this.getProfile(session.user.id);
          const user: AuthUser = {
            id: session.user.id,
            email: session.user.email || '',
            name: profile?.username || session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
            username: profile?.username || session.user.email?.split('@')[0],
            avatarUrl: '',
            isMock: false,
          };
          this.notify(user);
        } else {
          this.notify(null);
        }
      });
    }
  }

  isMockMode(): boolean {
    return !isSupabaseConfigured();
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    if (this.isMockMode()) {
      if (typeof window === 'undefined') return null;
      try {
        const stored = localStorage.getItem(MOCK_STORAGE_KEY);
        if (!stored) return null;
        const user = JSON.parse(stored) as AuthUser;
        const profile = await this.getProfile(user.id);
        if (profile) {
          user.username = profile.username;
        }
        user.avatarUrl = '';
        return user;
      } catch {
        return null;
      }
    }

    const supabase = createClient();
    if (!supabase) return null;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const profile = await this.getProfile(user.id);

      return {
        id: user.id,
        email: user.email || '',
        name: profile?.username || user.user_metadata?.full_name || user.email?.split('@')[0],
        username: profile?.username || user.email?.split('@')[0],
        avatarUrl: '',
        isMock: false,
      };
    } catch (err) {
      console.error('Error fetching Supabase user:', err);
      return null;
    }
  }

  async getProfile(userId: string): Promise<UserProfile | null> {
    if (!userId) return null;

    if (this.isMockMode()) {
      if (typeof window === 'undefined') return null;
      try {
        const stored = localStorage.getItem(MOCK_PROFILES_KEY);
        if (!stored) return null;
        const profiles = JSON.parse(stored);
        return profiles[userId] || null;
      } catch {
        return null;
      }
    }

    const supabase = createClient();
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error || !data) return null;

      return {
        id: data.id,
        email: data.email,
        username: data.username,
        avatarUrl: '',
      };
    } catch {
      return null;
    }
  }

  async updateProfile(
    userId: string,
    data: { username: string; avatarUrl?: string }
  ): Promise<UserProfile> {
    if (!userId) {
      throw new Error('ID de usuario requerido.');
    }

    const cleanUsername = sanitizeInput(data.username, MAX_LENGTHS.USERNAME);
    if (!cleanUsername || cleanUsername.length < 3) {
      throw new Error('El nombre de usuario debe tener al menos 3 caracteres.');
    }
    if (!isValidUsername(cleanUsername)) {
      throw new Error('El nombre de usuario solo puede contener letras, números, puntos o guiones.');
    }

    const currentUser = await this.getCurrentUser();
    const email = currentUser?.email || '';

    const updatedProfile: UserProfile = {
      id: userId,
      email,
      username: cleanUsername,
      avatarUrl: '',
    };

    if (this.isMockMode()) {
      if (typeof window !== 'undefined') {
        let profiles: Record<string, UserProfile> = {};
        try {
          const stored = localStorage.getItem(MOCK_PROFILES_KEY);
          if (stored) profiles = JSON.parse(stored);
        } catch {
          // Reset
        }
        profiles[userId] = updatedProfile;
        localStorage.setItem(MOCK_PROFILES_KEY, JSON.stringify(profiles));

        if (currentUser) {
          currentUser.username = cleanUsername;
          currentUser.avatarUrl = '';
          localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(currentUser));
          this.notify(currentUser);
        }
      }
      return updatedProfile;
    }

    const supabase = createClient();
    if (!supabase) throw new Error('Supabase no inicializado');

    const { error } = await supabase.from('profiles').upsert({
      id: userId,
      email,
      username: cleanUsername,
      avatar_url: '',
      updated_at: new Date().toISOString(),
    });

    if (error) {
      throw new Error(error.message || 'Error al actualizar perfil');
    }

    if (currentUser) {
      currentUser.username = cleanUsername;
      currentUser.avatarUrl = '';
      this.notify(currentUser);
    }

    return updatedProfile;
  }

  async signInWithGoogle(allowedDomain: string, redirectTo?: string): Promise<void> {
    if (this.isMockMode()) {
      const mockEmail = `estudiante@${allowedDomain}`;
      const mockUser: AuthUser = {
        id: 'mock-user-1',
        email: mockEmail,
        name: 'estudiante.unach',
        username: 'estudiante.unach',
        avatarUrl: '',
        isMock: true,
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(mockUser));
      }
      this.notify(mockUser);
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const targetUrl = redirectTo || (typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : '');

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: targetUrl,
        queryParams: {
          hd: allowedDomain,
          prompt: 'select_account',
        },
      },
    });

    if (error) throw error;
  }

  async signOut(): Promise<void> {
    if (this.isMockMode()) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(MOCK_STORAGE_KEY);
      }
      this.notify(null);
      return;
    }

    const supabase = createClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    this.notify(null);
  }

  async deleteAccount(userId: string): Promise<void> {
    if (!userId) return;

    // 1. Eliminar votos asociados al usuario
    await rankingsService.deleteUserData(userId);

    // 2. Eliminar perfil y sesión en modo Mock o Supabase
    if (this.isMockMode()) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(MOCK_STORAGE_KEY);
        try {
          const stored = localStorage.getItem(MOCK_PROFILES_KEY);
          if (stored) {
            const profiles = JSON.parse(stored);
            delete profiles[userId];
            localStorage.setItem(MOCK_PROFILES_KEY, JSON.stringify(profiles));
          }
        } catch {
          // Reset
        }
      }
      this.notify(null);
      return;
    }

    const supabase = createClient();
    if (supabase) {
      await supabase.from('profiles').delete().eq('id', userId);
      await supabase.auth.signOut();
    }
    this.notify(null);
  }

  createTestAccount(email: string, customUsername?: string): AuthUser {
    const cleanEmail = sanitizeInput(email, MAX_LENGTHS.EMAIL).toLowerCase().trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Ingresa un correo institucional válido (ej. estudiante@unach.mx)');
    }

    const rawUsername = cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9._-]/g, '_');
    const cleanUsername = customUsername
      ? sanitizeInput(customUsername, MAX_LENGTHS.USERNAME)
      : rawUsername;

    const mockUser: AuthUser = {
      id: `usr-${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
      email: cleanEmail,
      name: cleanUsername,
      username: cleanUsername,
      avatarUrl: '',
      isMock: true,
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(mockUser));
      try {
        let profiles: Record<string, UserProfile> = {};
        const stored = localStorage.getItem(MOCK_PROFILES_KEY);
        if (stored) profiles = JSON.parse(stored);
        profiles[mockUser.id] = {
          id: mockUser.id,
          email: cleanEmail,
          username: cleanUsername,
          avatarUrl: '',
        };
        localStorage.setItem(MOCK_PROFILES_KEY, JSON.stringify(profiles));
      } catch {
        // ignore
      }
    }

    this.notify(mockUser);
    return mockUser;
  }

  simulateMockLogin(email: string): AuthUser {
    return this.createTestAccount(email);
  }

  onAuthStateChange(callback: AuthListener): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notify(user: AuthUser | null) {
    this.listeners.forEach((listener) => {
      try {
        listener(user);
      } catch (e) {
        console.error('Auth listener error:', e);
      }
    });
  }
}

export const authService = new AuthService();
