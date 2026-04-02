"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

export default function EditPostPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [regenerateSummary, setRegenerateSummary] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('posts')
        .select('*')
        .eq('id', params.id)
        .single();

      if (fetchError || !data) {
        setError('Failed to fetch post or post not found');
        setLoading(false);
        return;
      }

      // Authorization Check: Only author or admin can edit
      if (!authLoading && user) {
        if (user.id !== data.author_id && user.role !== 'admin' && user.role !== 'author') {
           router.push('/');
           return;
        }
      }

      setTitle(data.title);
      setBody(data.body);
      setImageUrl(data.image_url || '');
      setLoading(false);
    };

    if (!authLoading && user) {
      fetchPost();
    } else if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, params.id, router]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      setError('Session expired. Please login again.');
      setSaving(false);
      return;
    }

    try {
      const response = await fetch('/api/posts/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          id: params.id,
          title,
          body,
          image_url: imageUrl,
          regenerate_summary: regenerateSummary
        })
      });

      if (response.ok) {
        router.push(`/posts/${params.id}`);
      } else {
        const result = await response.json();
        setError(result.error || 'Failed to update post');
      }
    } catch (err) {
      setError('An error occurred while updating the post.');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="bg-gray-50 min-h-screen">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 lg:py-20">
         <div className="bg-white p-8 md:p-16 rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">Revise Story</h1>
            <p className="text-gray-500 mb-12 font-medium">Refining your narrative updates the world. Choose whether to regenerate the AI summary below.</p>

            {error && (
              <div className="mb-8 p-5 bg-red-50 border-2 border-red-100 rounded-3xl text-red-600 text-sm font-bold flex items-center gap-3">
                <span className="text-lg">⚠️</span> {error}
              </div>
            )}

            <form onSubmit={handleUpdate} className="space-y-10">
               <div>
                  <label className="block text-xs font-black text-gray-400 mb-4 tracking-[0.2em] uppercase">Post Title</label>
                  <input 
                    type="text" 
                    required
                    className="w-full px-6 py-5 rounded-2xl border-2 border-gray-50 outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 transition-all font-black text-2xl placeholder-gray-300 bg-gray-50/30"
                    placeholder="Refactor your title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
               </div>

               <div>
                  <label className="block text-xs font-black text-gray-400 mb-4 tracking-[0.2em] uppercase">Media Attachment URL</label>
                  <input 
                    type="url" 
                    className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 transition-all font-bold text-gray-600 bg-gray-50/30"
                    placeholder="https://images.unsplash.com/..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                  />
               </div>

               <div>
                  <label className="block text-xs font-black text-gray-400 mb-4 tracking-[0.2em] uppercase">Narrative Body</label>
                  <textarea 
                    required
                    className="w-full px-8 py-6 rounded-[2rem] border-2 border-gray-50 outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 transition-all font-medium min-h-[400px] text-gray-800 leading-relaxed bg-gray-50/30 text-lg shadow-inner"
                    placeholder="Edit your story..."
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                  />
               </div>

               <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100/50 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <span className="text-2xl">🤖</span>
                     <div>
                        <p className="text-sm font-black text-indigo-900">AI Summary Optimization</p>
                        <p className="text-xs text-indigo-400 font-bold">Regenerate a fresh ~200-word summary for this post.</p>
                     </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setRegenerateSummary(!regenerateSummary)}
                    className={`w-14 h-8 rounded-full transition-colors relative flex items-center ${regenerateSummary ? 'bg-indigo-600' : 'bg-gray-200'}`}
                  >
                     <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform transform ${regenerateSummary ? 'translate-x-7' : 'translate-x-1'}`}></div>
                  </button>
               </div>

               <div className="flex justify-end gap-5 pt-8">
                  <button 
                    type="button"
                    onClick={() => router.back()}
                    className="px-10 py-4 rounded-full font-black text-xs uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors"
                  >
                    Discard Changes
                  </button>
                  <button 
                    type="submit"
                    disabled={saving}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-12 py-4 rounded-full font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-200 transition-all disabled:opacity-50 hover:scale-[1.05] active:scale-[0.95]"
                  >
                    {saving ? 'UPDATING DB...' : 'Commit Changes'}
                  </button>
               </div>
            </form>
         </div>
      </main>
    </div>
  );
}
