"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type UserRole = 'author' | 'viewer' | 'admin';

interface UserDetails {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

interface AuthContextType {
  user: UserDetails | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Function to fetch full user details (including role from public.users)
    const fetchUser = async () => {
      setLoading(true);
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Fetch user role and name from public.users table
      const { data: publicUser, error: userError } = await supabase
        .from('users')
        .select('name, role')
        .eq('id', session.user.id)
        .single();

      if (!userError && publicUser) {
        setUser({
          id: session.user.id,
          email: session.user.email ?? '',
          name: publicUser.name,
          role: publicUser.role as UserRole
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    fetchUser();

    // Listen for auth state changes (login, logout)
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        fetchUser();
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
