'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';
import { useState } from 'react';
import { Database } from '@/lib/database.types';
import { SupabaseClient } from '@supabase/auth-helpers-nextjs';
import { createContext, useContext } from 'react';

type SupabaseContext = {
  supabase: SupabaseClient<Database>;
};

export const Context = createContext<SupabaseContext | undefined>(undefined);

export function Providers({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createPagesBrowserClient());

  return (
    <Context.Provider value={{ supabase }}>
      <NextThemesProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
      </NextThemesProvider>
    </Context.Provider>
  );
}

export const useSupabase = () => {
  const context = useContext(Context);
  if (context === undefined) {
    throw new Error('useSupabase must be used inside Providers');
  }
  return context;
};
