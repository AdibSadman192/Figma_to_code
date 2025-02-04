'use client';

import Navbar from '@/components/Navigation/Navbar';
import Link from 'next/link';
import { Background } from '@/components/ui/background';

export default function LandingPage() {
  return (
    <Background>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-6 text-center">
          <div className="max-w-3xl space-y-6">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
              Convert Figma designs to code with ease
            </h1>
            <p className="text-lg text-muted-foreground">
              Transform your Figma designs into production-ready code automatically. Support for React, Vue, and more.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              >
                Get Started
              </Link>
              <Link
                href="/projects"
                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-6 py-3 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              >
                View Projects
              </Link>
            </div>
          </div>
        </main>
      </div>
    </Background>
  );
}
