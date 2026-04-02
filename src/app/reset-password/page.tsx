"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if the user is in a password recovery session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Recovery session expired or invalid. Please request a new link.');
      }
    };
    checkSession();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError(null);

    const { error: resetError } = await supabase.auth.updateUser({
      password: password,
    });

    if (resetError) {
      setError(resetError.message);
    } else {
      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4FAF9] p-4">
      <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl shadow-[#121E26]/5 w-full max-w-lg border border-[#CAD3D7]">
        <h1 className="text-4xl font-black text-[#121E26] mb-4 tracking-tighter">New Credentials</h1>
        <p className="text-[#4A555E] mb-10 font-medium italic">Secure your account with a fresh password.</p>
        
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-black uppercase tracking-widest">
            {error}
          </div>
        )}

        {success ? (
          <div className="text-center py-10 bg-[#F4FAF9] rounded-[2rem] border border-[#CAD3D7]">
             <div className="w-16 h-16 bg-[#7E94A8] rounded-full flex items-center justify-center text-white mx-auto mb-6 shadow-lg">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
             </div>
             <h2 className="text-2xl font-black text-[#121E26] mb-2 uppercase tracking-tight">Security Updated</h2>
             <p className="text-[#4A555E] italic font-medium px-8 text-sm">Your password has been successfully reset. Redirecting you to login...</p>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-8">
            <div>
              <label className="block text-[10px] uppercase font-black text-[#7E94A8] tracking-[0.2em] mb-3 ml-1">New Password</label>
              <input 
                type="password" 
                required
                className="w-full px-6 py-4 rounded-2xl border-2 border-[#CAD3D7] outline-none focus:border-[#7E94A8] transition-all font-bold text-[#121E26] bg-white placeholder:text-gray-300 shadow-sm"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-black text-[#7E94A8] tracking-[0.2em] mb-3 ml-1">Confirm Identity</label>
              <input 
                type="password" 
                required
                className="w-full px-6 py-4 rounded-2xl border-2 border-[#CAD3D7] outline-none focus:border-[#7E94A8] transition-all font-bold text-[#121E26] bg-white placeholder:text-gray-300 shadow-sm"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <button 
              type="submit"
              disabled={loading || !!error && error.includes('expired')}
              className="w-full py-5 rounded-2xl bg-gradient-to-r from-[#121E26] to-[#7E94A8] text-white font-black text-sm uppercase tracking-widest transition-all disabled:opacity-50 shadow-xl shadow-[#121E26]/10 hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? 'Securing Account...' : 'Set Final Password'}
            </button>
            <Link href="/forgot-password" size="sm" className="block text-center text-xs font-bold text-earth-steel hover:text-earth-midnight transition-colors opacity-50 hover:opacity-100">
                  Request New Link if Broken
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
