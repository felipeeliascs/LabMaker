import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Simulador CNC laser — Gêmeo digital',
  description: 'Simulador de corte CNC laser com importação de SVG e G-code e controle do robô UR5.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col bg-background">{children}</body>
    </html>
  );
}
