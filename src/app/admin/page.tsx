"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [posts, setPosts] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;

    const fetchDashboardData = async () => {
      setFetching(true);

      const [
        { data: fetchedPosts },
        { data: fetchedComments },
        { data: fetchedUsers }
      ] = await Promise.all([
        supabase.from('posts').select('*, users(name)').order('created_at', { ascending: false }),
        supabase.from('comments').select('*, posts(title), users(name)').order('created_at', { ascending: false }),
        supabase.from('users').select('*').order('name', { ascending: true })
      ]);

      setPosts(fetchedPosts || []);
      setComments(fetchedComments || []);
      setUsersList(fetchedUsers || []);
      setFetching(false);
    };

    fetchDashboardData();
  }, [user]);

  const handleDeletePost = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (!error) {
      setPosts(prev => prev.filter(p => p.id !== id));
      setComments(prev => prev.filter(c => c.post_id !== id));
    } else {
      alert('Failed to delete post');
    }
  };

  const handleDeleteComment = async (id: string) => {
    if (!window.confirm('Delete this comment permanently?')) return;
    const { error } = await supabase.from('comments').delete().eq('id', id);
    if (!error) {
      setComments(prev => prev.filter(c => c.id !== id));
    } else {
      alert('Failed to delete comment');
    }
  };

  const handleRoleChange = async (id: string, newRole: string) => {
    const { error } = await supabase.from('users').update({ role: newRole }).eq('id', id);
    if (!error) {
      setUsersList(prev => prev.map(u => u.id === id ? { ...u, role: newRole } : u));
    } else {
      alert('Failed to update user role');
    }
  };

  if (loading || fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="p-4 md:p-12 max-w-7xl mx-auto space-y-16">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-5xl font-black text-gray-900 mb-2 bg-gradient-to-r from-[#121E26] to-[#7E94A8] bg-clip-text text-transparent">Authority</h1>
            <p className="text-[#4A555E] font-medium italic">Enterprise Management Console & Command Center</p>
          </div>
          <div className="flex gap-4">
             <div className="bg-white px-6 py-3 rounded-2xl border border-[#CAD3D7] shadow-sm">
                <p className="text-[10px] uppercase font-black tracking-widest text-[#7E94A8] mb-1">Active Users</p>
                <p className="text-2xl font-black text-[#121E26]">{usersList.length}</p>
             </div>
             <div className="bg-white px-6 py-3 rounded-2xl border border-[#CAD3D7] shadow-sm">
                <p className="text-[10px] uppercase font-black tracking-widest text-[#7E94A8] mb-1">Total Posts</p>
                <p className="text-2xl font-black text-[#121E26]">{posts.length}</p>
             </div>
          </div>
        </header>

        {/* Users Section */}
        <section className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-xl shadow-[#121E26]/5 border border-[#CAD3D7]">
          <div className="flex items-center justify-between mb-8">
             <h2 className="text-2xl font-black text-[#121E26] uppercase tracking-tight">Personnel Directory</h2>
             <span className="px-4 py-1 bg-[#F4FAF9] text-[#7E94A8] border border-[#CAD3D7] rounded-full text-[10px] font-black tracking-widest uppercase">LIVE FEED</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="py-5 px-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Name</th>
                  <th className="py-5 px-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Email Address</th>
                  <th className="py-5 px-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Privilege Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-6 px-4">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#7E94A8] flex items-center justify-center text-white text-xs font-black shadow-sm">{u.name[0]}</div>
                          <span className="font-bold text-[#121E26]">{u.name}</span>
                       </div>
                    </td>
                    <td className="py-6 px-4 text-gray-500 font-medium text-sm">{u.email}</td>
                    <td className="py-6 px-4">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        disabled={u.id === user.id}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none border-2 transition-all ${u.id === user.id ? 'bg-[#F4FAF9] border-[#CAD3D7] text-gray-400 cursor-not-allowed' : 'bg-white border-[#CAD3D7] focus:border-[#7E94A8] text-[#121E26]'}`}
                      >
                        <option value="viewer">Viewer Account</option>
                        <option value="author">Author Privileges</option>
                        <option value="admin">System Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pb-20">
           {/* Posts Section */}
           <section className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-xl shadow-earth-gold/5 border border-earth-cream">
              <h2 className="text-2xl font-black text-gray-900 mb-8 uppercase tracking-tight">Content Management</h2>
              <div className="space-y-4">
                {posts.map((post) => (
                  <div key={post.id} className="flex items-center justify-between p-6 bg-[#F4FAF9] rounded-3xl group hover:bg-white transition-all border border-transparent hover:border-[#CAD3D7]">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-[#121E26] truncate group-hover:text-[#7E94A8] transition-colors">{post.title}</h3>
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Author: {post.users?.name}</p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Link
                        href={`/posts/${post.id}`}
                        className="p-3 bg-white hover:bg-[#7E94A8] hover:text-white rounded-xl text-gray-400 shadow-sm transition-all border border-[#CAD3D7]"
                        title="View Post"
                      >
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                      </Link>
                      <Link
                        href={`/posts/${post.id}/edit`}
                        className="p-3 bg-white hover:bg-[#4A555E] hover:text-white rounded-xl text-gray-400 shadow-sm transition-all border border-[#CAD3D7]"
                        title="Edit Post"
                      >
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                      </Link>
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="p-3 bg-white hover:bg-[#CAD3D7] hover:text-[#121E26] rounded-xl text-gray-400 shadow-sm transition-all border border-[#CAD3D7]"
                        title="Delete Post"
                      >
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
           </section>

           {/* Comments Section */}
           <section className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-xl shadow-gray-200/40 border border-gray-100">
                  <h2 className="text-2xl font-black text-gray-900 mb-8 uppercase tracking-tight">Comment Moderation</h2>
                  <div className="space-y-4">
                     {comments.map((c) => (
                        <div key={c.id} className="p-6 bg-[#F4FAF9] rounded-3xl group border border-transparent hover:border-[#CAD3D7] hover:bg-white transition-all">
                           <div className="flex justify-between items-start mb-2">
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{c.users?.name}</p>
                              <button 
                                onClick={() => handleDeleteComment(c.id)}
                                className="text-[#7E94A8] hover:text-[#121E26] font-black text-[10px] uppercase underline tracking-[0.2em]"
                              >
                                Purge
                              </button>
                           </div>
                       <p className="text-gray-700 text-sm font-medium line-clamp-2">{c.comment_text}</p>
                       <p className="mt-2 text-[10px] text-gray-300 italic font-bold">On: {c.posts?.title}</p>
                    </div>
                 ))}
                 {comments.length === 0 && <p className="text-gray-300 text-center py-10 font-bold italic tracking-tight uppercase">Clearance: No active reports</p>}
              </div>
           </section>
        </div>
      </div>
    </div>
  );
}
