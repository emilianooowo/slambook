import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/common/Toast';

export const metadata: Metadata = {
  title: 'Slambook · Rankings Universitarios',
  description: 'Ranking de intereses y votación diaria por facultad',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('slambook-theme');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var isDark = saved === 'dark' || (!saved && prefersDark);
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                    document.documentElement.setAttribute('data-theme', 'dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.setAttribute('data-theme', 'light');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="h-screen w-screen overflow-hidden bg-[#F5F4F0] dark:bg-[#121214] text-neutral-900 dark:text-neutral-100 m-0 p-0 antialiased selection:bg-[#94421A]/20 selection:text-[#94421A]">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
