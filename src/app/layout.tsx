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
    <html lang="es">
      <body className="h-screen w-screen overflow-hidden bg-[#F5F4F0] text-neutral-900 m-0 p-0 antialiased selection:bg-[#94421A]/20 selection:text-[#94421A]">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
