import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { AuthUser } from '@/types/slambook.types';

const MOCK_STORAGE_KEY = 'slambook_mock_user';

type AuthListener = (user: AuthUser | null) => void;

class AuthService {
  private listeners: Set<AuthListener> = new Set();

  constructor() {
    if (typeof window !== 'undefined' && isSupabaseConfigured()) {
      const supabase = createClient();
      supabase?.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          const user: AuthUser = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
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
        return JSON.parse(stored) as AuthUser;
      } catch {
        return null;
      }
    }

    const supabase = createClient();
    if (!supabase) return null;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      return {
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.full_name || user.email?.split('@')[0],
        isMock: false,
      };
    } catch (err) {
      console.error('Error fetching Supabase user:', err);
      return null;
    }
  }

  async signInWithGoogle(allowedDomain: string, redirectTo?: string): Promise<void> {
    if (this.isMockMode()) {
      // Simulación inmediata para modo local/demo
      const mockEmail = `estudiante@${allowedDomain}`;
      const mockUser: AuthUser = {
        id: 'mock-user-1',
        email: mockEmail,
        name: 'Estudiante UNACH',
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

    if (error) {
      throw error;
    }
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

  // Permite simular inicio de sesión en modo local con correo específico
  simulateMockLogin(email: string): AuthUser {
    const mockUser: AuthUser = {
      id: `mock-${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
      email,
      name: email.split('@')[0],
      isMock: true,
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(mockUser));
    }
    this.notify(mockUser);
    return mockUser;
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

  validateDomain(email: string, allowedDomain: string): boolean {
    if (!email) return false;
    const domain = email.split('@')[1]?.toLowerCase();
    return domain === allowedDomain.toLowerCase();
  }
}

export const authService = new AuthService();
