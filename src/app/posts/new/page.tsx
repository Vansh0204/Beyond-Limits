"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

export default function NewPostPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || (user.role !== 'author' && user.role !== 'admin'))) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      setError('You must be logged in to create a post.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/posts/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          title,
          body,
          image_url: imageUrl
        })
      });

      const result = await response.json();

      if (response.ok) {
        router.push(`/posts/${result.id}`);
      } else {
        setError(result.error || 'Failed to create post');
      }
    } catch (err) {
      setError('An error occurred while creating the post.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div></div>;
  if (!user || (user.role !== 'author' && user.role !== 'admin')) return null;

  return (
    <div className="bg-gray-50 min-h-screen">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 lg:py-20">
         <div className="bg-white p-8 md:p-16 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-8 leading-tight">Create a New Story</h1>
            <p className="text-gray-500 mb-12">Share your insights with the world. Our AI will automatically generate a summary for your post.</p>

            {error && (
              <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-10">
               <div>
                  <label className="block text-sm font-black text-gray-900 mb-4 tracking-wide uppercase">Post Title</label>
                  <input 
                    type="text" 
                    required
                    className="w-full px-6 py-4 rounded-3xl border border-gray-200 outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 transition-all font-bold text-xl placeholder-gray-300 bg-white"
                    placeholder="Enter a catchy title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
               </div>

               <div>
                  <label className="block text-sm font-black text-gray-900 mb-4 tracking-wide uppercase">Cover Image URL (Optional)</label>
                  <input 
                    type="url" 
                    className="w-full px-6 py-4 rounded-3xl border border-gray-200 outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 transition-all font-medium text-gray-700 bg-white"
                    placeholder="https://images.unsplash.com/..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                  />
               </div>

               <div>
                  <label className="block text-sm font-black text-gray-900 mb-4 tracking-wide uppercase">Story Content</label>
                  <textarea 
                    required
                    className="w-full px-8 py-6 rounded-[2rem] border border-gray-200 outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 transition-all font-medium min-h-[350px] text-gray-800 leading-relaxed bg-white text-lg"
                    placeholder="Write your story here... Markdown supported."
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                  />
               </div>

               <div className="flex justify-end gap-4 pt-8">
                  <button 
                   type="button"
                   onClick={() => router.back()}
                   className="px-8 py-4 rounded-full font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                  type="submit"
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-12 py-4 rounded-full font-bold shadow-2xl shadow-indigo-200 transition-all disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {loading ? 'Publishing with AI...' : 'Publish Post'}
                  </button>
               </div>
            </form>
         </div>
      </main>
    </div>
  );
}
