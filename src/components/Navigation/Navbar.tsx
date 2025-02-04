'use client';

import { cn } from '@/lib/utils';
import { Fragment, useEffect, useState, useRef } from 'react';
import { useSupabase } from '@/app/providers';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import ThemeToggle from '../ThemeToggle';

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Projects', href: '/projects' },
];

export default function Navbar() {
  const { supabase } = useSupabase();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error('Error getting user:', error);
      } finally {
        setLoading(false);
      }
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <nav className={cn(
      "sticky top-0 z-40 w-full transition-all duration-200",
      "bg-background/80 backdrop-blur-xl backdrop-saturate-150",
      "border-b border-border/40"
    )}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                Figma to Code
              </span>
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/dashboard"
                className={cn(
                  "inline-flex items-center px-1 pt-1 text-sm font-medium",
                  "text-foreground/80 hover:text-foreground transition-colors",
                  "border-b-2 border-transparent hover:border-border"
                )}
              >
                Dashboard
              </Link>
              <Link
                href="/projects"
                className={cn(
                  "inline-flex items-center px-1 pt-1 text-sm font-medium",
                  "text-foreground/80 hover:text-foreground transition-colors",
                  "border-b-2 border-transparent hover:border-border"
                )}
              >
                Projects
              </Link>
            </div>
          </div>

          <div className="flex items-center">
            <ThemeToggle />
            {!loading && (
              <div className="relative ml-4">
                {user ? (
                  <>
                    <button
                      ref={buttonRef}
                      onClick={() => setMenuOpen(!menuOpen)}
                      className={cn(
                        "flex items-center gap-2 rounded-full",
                        "bg-primary/10 p-2 text-sm text-primary",
                        "hover:bg-primary/20 transition-colors"
                      )}
                    >
                      <span className="font-medium">
                        {user.email?.[0].toUpperCase()}
                      </span>
                    </button>
                    {menuOpen && (
                      <div
                        ref={menuRef}
                        className={cn(
                          "absolute right-0 mt-2 w-48 origin-top-right rounded-md",
                          "bg-card/80 backdrop-blur-xl backdrop-saturate-150",
                          "shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none",
                          "divide-y divide-border/40"
                        )}
                      >
                        <div className="py-1">
                          <Link
                            href="/profile"
                            className={cn(
                              "block px-4 py-2 text-sm",
                              "text-foreground/80 hover:text-foreground",
                              "hover:bg-primary/10 transition-colors"
                            )}
                            onClick={() => setMenuOpen(false)}
                          >
                            Profile
                          </Link>
                          <Link
                            href="/settings"
                            className={cn(
                              "block px-4 py-2 text-sm",
                              "text-foreground/80 hover:text-foreground",
                              "hover:bg-primary/10 transition-colors"
                            )}
                            onClick={() => setMenuOpen(false)}
                          >
                            Settings
                          </Link>
                        </div>
                        <div className="py-1">
                          <button
                            onClick={() => {
                              setMenuOpen(false);
                              handleSignOut();
                            }}
                            className={cn(
                              "block w-full px-4 py-2 text-left text-sm",
                              "text-foreground/80 hover:text-foreground",
                              "hover:bg-primary/10 transition-colors"
                            )}
                          >
                            Sign out
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href="/auth"
                    className={cn(
                      "rounded-md bg-primary px-3 py-2",
                      "text-sm font-medium text-primary-foreground",
                      "hover:bg-primary/90 transition-colors"
                    )}
                  >
                    Sign in
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
