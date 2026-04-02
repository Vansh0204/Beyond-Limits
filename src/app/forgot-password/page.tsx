"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    // Get the base URL for redirection
    const siteUrl = window.location.origin;

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/reset-password`,
    });

    if (resetError) {
      setError(resetError.message);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4FAF9] p-4">
      <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl shadow-[#121E26]/5 w-full max-w-lg border border-[#CAD3D7]">
        <Link href="/login" className="inline-flex items-center gap-2 text-sm font-black text-[#7E94A8] mb-8 hover:gap-3 transition-all uppercase tracking-widest">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to Login
        </Link>
        
        <h1 className="text-4xl font-black text-[#121E26] mb-4 tracking-tighter">Recover Access</h1>
        <p className="text-[#4A555E] mb-10 font-medium italic">Enter your email to receive a secure recovery link.</p>
        
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-black uppercase tracking-widest">
            {error}
          </div>
        )}

        {success ? (
          <div className="text-center py-10 bg-[#F4FAF9] rounded-[2rem] border border-[#CAD3D7]">
             <div className="w-16 h-16 bg-[#7E94A8] rounded-full flex items-center justify-center text-white mx-auto mb-6 shadow-lg">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
             </div>
             <h2 className="text-2xl font-black text-[#121E26] mb-2 uppercase tracking-tight">Recovery Link Sent</h2>
             <p className="text-[#4A555E] italic font-medium px-8 text-sm">Please check your inbox. If you don't see it, check your spam folder.</p>
             <Link href="/login" className="mt-8 inline-block px-10 py-3.5 bg-[#121E26] text-white rounded-full font-black text-xs uppercase tracking-widest hover:bg-[#7E94A8] transition-all">
                Return to Login
             </Link>
          </div>
        ) : (
          <form onSubmit={handleResetRequest} className="space-y-8">
            <div>
              <label className="block text-[10px] uppercase font-black text-[#7E94A8] tracking-[0.2em] mb-3 ml-1">Email Address</label>
              <input 
                type="email" 
                required
                className="w-full px-6 py-4 rounded-2xl border-2 border-[#CAD3D7] outline-none focus:border-[#7E94A8] transition-all font-bold text-[#121E26] bg-white placeholder:text-gray-300 shadow-sm"
                placeholder="beyond@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button 
              type="submit"
              disabled={loading}
              className="w-full py-5 rounded-2xl bg-gradient-to-r from-[#121E26] to-[#7E94A8] text-white font-black text-sm uppercase tracking-widest transition-all disabled:opacity-50 shadow-xl shadow-[#121E26]/10 hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? 'Transmitting Link...' : 'Send Recovery Link'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
