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
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setError(null);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `covers/${fileName}`;

      const { data, error: uploadError } = await supabase.storage
        .from('blog_images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('blog_images')
        .getPublicUrl(filePath);

      setImageUrl(publicUrl);
    } catch (err: any) {
      console.error('Error uploading image:', err);
      setError(err.message || 'Failed to upload image. Ensure a "blog_images" bucket exists in your Supabase storage.');
    } finally {
      setUploading(false);
    }
  };

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

               <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] font-black text-[#7E94A8] tracking-[0.2em] uppercase ml-1">Cover Image</label>
                    <span className="text-[10px] font-black text-gray-300 uppercase italic">URL or Local File</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative group">
                      <input 
                        type="url" 
                        className="w-full px-6 py-4 rounded-3xl border-2 border-[#CAD3D7] outline-none focus:border-[#7E94A8] transition-all font-medium text-[#121E26] bg-white placeholder:text-gray-300 shadow-sm"
                        placeholder="Paste image URL here..."
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                      />
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[9px] font-black text-gray-200 uppercase tracking-tighter pointer-events-none group-focus-within:opacity-0 transition-opacity">External Link</div>
                    </div>

                    <div className="relative overflow-hidden rounded-3xl border-2 border-dashed border-[#CAD3D7] bg-[#F4FAF9] group hover:border-[#7E94A8] transition-all flex items-center justify-center min-h-[64px]">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file);
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        disabled={uploading}
                      />
                      <div className="flex items-center gap-3 px-6">
                        {uploading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-[#7E94A8] border-t-transparent animate-spin rounded-full"></div>
                            <span className="text-[10px] font-black text-[#7E94A8] uppercase tracking-widest">Optimizing...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5 text-[#7E94A8]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                            <span className="text-[10px] font-black text-[#7E94A8] uppercase tracking-widest group-hover:text-[#121E26] transition-colors">Upload from Device</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {imageUrl && (
                    <div className="relative aspect-[21/9] w-full rounded-2xl overflow-hidden border border-[#CAD3D7] bg-gray-50">
                       <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                       <button 
                        type="button" 
                        onClick={() => setImageUrl('')}
                        className="absolute top-2 right-2 w-8 h-8 bg-black/60 backdrop-blur-md rounded-full text-white flex items-center justify-center hover:bg-black transition-all"
                       >
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                       </button>
                    </div>
                  )}
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
