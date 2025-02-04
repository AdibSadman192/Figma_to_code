import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Background } from '@/components/ui/background';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Figma to Code',
  description: 'Convert Figma designs to code with ease',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={`${inter.className} min-h-screen bg-background text-foreground antialiased`}>
        <Background>
          <Providers>
            {children}
          </Providers>
        </Background>
      </body>
    </html>
  );
}
