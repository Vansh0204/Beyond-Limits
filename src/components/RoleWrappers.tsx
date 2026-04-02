"use client";

import React from 'react';
import { useAuth } from '@/context/AuthContext';

export const AuthorOnly = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading || !user) return null;
  // Let's assume authors (and potentially admins) can see author actions
  if (user.role === 'author' || user.role === 'admin') return <>{children}</>;
  
  return null;
};

export const AdminOnly = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading || !user) return null;
  if (user.role === 'admin') return <>{children}</>;
  
  return null;
};

export const ViewerOnly = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading || !user) return null;
  if (user.role === 'viewer') return <>{children}</>;
  
  return null;
};
