"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState<'viewer' | 'author'>('viewer');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 1) Signup with Supabase Auth
    const { data: authData, error: signupError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signupError) {
      setError(signupError.message);
      setLoading(false);
      return;
    }

    if (!authData.user) {
        setError('Unknown signup error.');
        setLoading(false);
        return;
    }

    // 2) Insert user details into public.users table (manually, as trigger might not be set up)
    const { error: userTableError } = await supabase
      .from('users')
      .insert([
        {
          id: authData.user.id,
          name: name,
          email: email,
          role: role
        }
      ]);

    if (userTableError) {
      // If table insert fails, clean up or report
      console.error('User profile creation failed:', userTableError);
      setError('Signup partially failed. Profile could not be created: ' + userTableError.message);
    } else {
      router.push('/login?signedup=true');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-4">
      <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl shadow-gray-200/50 w-full max-w-md border border-gray-100">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Create Account</h1>
        <p className="text-gray-500 mb-8">Join the AI Blog community and start your journey.</p>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
            <input 
              type="text" 
              required
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all font-medium"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
            <input 
              type="email" 
              required
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all font-medium"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
             <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
             <div className="relative">
               <input 
                 type={showPassword ? 'text' : 'password'} 
                 required
                 className="w-full px-4 py-3 rounded-2xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all font-medium pr-12"
                 placeholder="••••••••"
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
               />
               <button
                 type="button"
                 onClick={() => setShowPassword(!showPassword)}
                 className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600 transition-colors"
               >
                 {showPassword ? (
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                 ) : (
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                 )}
               </button>
             </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">I want to be an...</label>
            <div className="grid grid-cols-2 gap-4">
               <button 
                type="button" 
                onClick={() => setRole('viewer')}
                className={`py-3 rounded-2xl border font-bold transition-all ${role === 'viewer' ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-gray-100 text-gray-500 hover:border-indigo-200'}`}
               >
                 Viewer
               </button>
               <button 
                type="button" 
                onClick={() => setRole('author')}
                className={`py-3 rounded-2xl border font-bold transition-all ${role === 'author' ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-gray-100 text-gray-500 hover:border-indigo-200'}`}
               >
                 Author
               </button>
            </div>
          </div>
          <button 
           type="submit"
           disabled={loading}
           className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all disabled:opacity-50 shadow-lg shadow-indigo-200"
          >
            {loading ? 'Processing...' : 'Create My Account'}
          </button>
        </form>

        <p className="mt-8 text-center text-gray-500 text-sm font-medium">
          Already have an account? <Link href="/login" className="text-indigo-600 hover:underline transition-all">Sign In Here</Link>
        </p>
      </div>
    </div>
  );
}
