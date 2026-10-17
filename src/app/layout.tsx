import type { Metadata } from 'next';
import './globals.css';

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
      <body className="h-screen w-screen overflow-hidden bg-white text-neutral-900 m-0 p-0 antialiased">
        {children}
      </body>
    </html>
  );
}
