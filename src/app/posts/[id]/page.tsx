"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function PostDetailPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [commenting, setCommenting] = useState(false);

  // Votes state
  const [upvotes, setUpvotes] = useState(0);
  const [downvotes, setDownvotes] = useState(0);
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    const fetchPostDetail = async () => {
      setLoading(true);
      const [
        { data: fetchedPost },
        { data: fetchedComments },
        { data: fetchedVotes }
      ] = await Promise.all([
        supabase.from('posts').select('*, users(name, role)').eq('id', params.id).single(),
        supabase.from('comments').select('*, users(name)').eq('post_id', params.id).order('created_at', { ascending: false }),
        supabase.from('votes').select('*').eq('post_id', params.id)
      ]);

      setPost(fetchedPost);
      setComments(fetchedComments || []);

      const votes = fetchedVotes || [];
      setUpvotes(votes.filter((v: any) => v.vote_type === 'up').length);
      setDownvotes(votes.filter((v: any) => v.vote_type === 'down').length);

      if (user) {
        const myVote = votes.find((v: any) => v.user_id === user.id);
        setUserVote(myVote ? myVote.vote_type : null);
      }

      setLoading(false);
    };

    fetchPostDetail();
  }, [params.id, user]);

  const handleVote = async (type: 'up' | 'down') => {
    if (!user || voting) return;
    setVoting(true);

    if (userVote === type) {
      // Remove vote
      await supabase.from('votes').delete().eq('post_id', params.id).eq('user_id', user.id);
      if (type === 'up') setUpvotes(p => p - 1);
      else setDownvotes(p => p - 1);
      setUserVote(null);
    } else if (userVote && userVote !== type) {
      // Switch vote
      await supabase.from('votes').update({ vote_type: type }).eq('post_id', params.id).eq('user_id', user.id);
      if (type === 'up') { setUpvotes(p => p + 1); setDownvotes(p => p - 1); }
      else { setDownvotes(p => p + 1); setUpvotes(p => p - 1); }
      setUserVote(type);
    } else {
      // New vote
      await supabase.from('votes').insert([{ post_id: params.id, user_id: user.id, vote_type: type }]);
      if (type === 'up') setUpvotes(p => p + 1);
      else setDownvotes(p => p + 1);
      setUserVote(type);
    }

    setVoting(false);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;
    setCommenting(true);

    const { data: commentIdx, error } = await supabase
      .from('comments')
      .insert([{ post_id: params.id, user_id: user.id, comment_text: newComment }])
      .select('*, users(name)')
      .single();

    if (!error && commentIdx) {
      setComments(prev => [commentIdx, ...prev]);
      setNewComment('');
    } else {
      alert('Failed to post comment');
    }
    setCommenting(false);
  };

  const handleDeleteComment = async (id: string) => {
    if (!window.confirm('Delete this comment permanently?')) return;
    const { error } = await supabase.from('comments').delete().eq('id', id);
    if (!error) {
      setComments(prev => prev.filter(c => c.id !== id));
    }
  };

  const handleEditComment = async (id: string, oldText: string) => {
    const newText = window.prompt('Update your comment:', oldText);
    if (!newText || newText === oldText) return;

    const { error } = await supabase.from('comments').update({ comment_text: newText }).eq('id', id);
    if (!error) {
      setComments(prev => prev.map(c => c.id === id ? { ...c, comment_text: newText } : c));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50">
        <h1 className="text-4xl font-bold mb-4 text-gray-900">Post Not Found</h1>
        <Link href="/" className="text-indigo-600 hover:underline font-semibold">← Back Home</Link>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <article className="max-w-4xl mx-auto px-4 sm:px-6 py-12 lg:py-20">
        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <span className="px-3 py-1 bg-indigo-50 rounded-full text-xs font-bold text-indigo-600 uppercase tracking-wider">AI Optimized</span>
            <span className="text-gray-300">•</span>
            <span className="text-gray-400 text-sm font-medium">{new Date(post.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-8">
            {post.title}
          </h1>

          {/* Author card */}
          <div className="flex items-center gap-4 bg-gray-50 p-5 rounded-2xl border border-gray-100">
            <div className="w-11 h-11 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 font-black text-lg">
              {post.users?.name?.[0]}
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">{post.users?.name}</p>
              <p className="text-xs text-gray-400 capitalize">{post.users?.role}</p>
            </div>

            {/* Author/Admin Actions */}
            {(user?.id === post.author_id || user?.role === 'admin') && (
              <div className="ml-auto flex items-center gap-3">
                <Link
                  href={`/posts/${post.id}/edit`}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 border border-gray-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Story
                </Link>
                <button
                  onClick={async () => {
                    if (!window.confirm('🚨 Are you absoluteley sure you want to delete this story? This cannot be undone.')) return;
                    
                    const { error } = await supabase
                      .from('posts')
                      .delete()
                      .eq('id', post.id);

                    if (error) {
                      alert('Error: ' + error.message);
                    } else {
                      alert('Story deleted successfully.');
                      window.location.href = '/';
                    }
                  }}
                  className="bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white px-5 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all border border-rose-100 shadow-sm flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Destroy Post
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Cover Image */}
        {post.image_url && (
          <div className="aspect-[21/9] mb-12 rounded-3xl overflow-hidden shadow-xl">
            <img src={post.image_url} alt={post.title} className="w-full h-full object-cover" />
          </div>
        )}

        {/* AI Summary */}
        {post.summary && post.summary !== 'Summary not available.' && (
          <div className="bg-indigo-50/60 p-8 rounded-3xl border-l-4 border-indigo-500 mb-10">
            <p className="text-[10px] font-black tracking-widest uppercase text-indigo-400 mb-3">✦ AI Summary</p>
            <p className="text-indigo-900 font-medium leading-relaxed italic">"{post.summary}"</p>
          </div>
        )}

        {/* Body */}
        <div className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap mb-14">
          {post.body}
        </div>

        {/* ── VOTE BAR ── */}
        <div className="flex items-center gap-4 p-6 bg-gray-50 rounded-2xl border border-gray-100 mb-16">
          <p className="text-sm font-bold text-gray-500 mr-2">Was this helpful?</p>

          {/* Thumbs Up */}
          <button
            onClick={() => handleVote('up')}
            disabled={!user || voting}
            title={!user ? 'Login to vote' : ''}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-all border-2 ${
              userVote === 'up'
                ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-100'
                : 'bg-white border-gray-200 text-gray-600 hover:border-emerald-400 hover:text-emerald-600'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            <svg className="w-5 h-5" fill={userVote === 'up' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
            </svg>
            <span>{upvotes}</span>
          </button>

          {/* Thumbs Down */}
          <button
            onClick={() => handleVote('down')}
            disabled={!user || voting}
            title={!user ? 'Login to vote' : ''}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-all border-2 ${
              userVote === 'down'
                ? 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-100'
                : 'bg-white border-gray-200 text-gray-600 hover:border-rose-400 hover:text-rose-600'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            <svg className="w-5 h-5" fill={userVote === 'down' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
            </svg>
            <span>{downvotes}</span>
          </button>

          {!user && (
            <p className="text-xs text-gray-400 ml-auto font-medium">
              <Link href="/login" className="text-indigo-500 font-bold hover:underline">Login</Link> to vote
            </p>
          )}
        </div>

        {/* Comments Section */}
        <section className="pt-12 border-t border-gray-100">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-10">
            Discussion <span className="text-gray-300 font-normal">({comments.length})</span>
          </h2>

          {user ? (
            <form onSubmit={handleAddComment} className="mb-12">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex-shrink-0 flex items-center justify-center text-indigo-600 font-black text-sm">
                  {user.name?.[0]}
                </div>
                <div className="flex-1">
                  <textarea
                    className="w-full px-5 py-4 rounded-2xl border border-gray-200 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all font-medium min-h-[120px] text-gray-700 bg-white resize-none text-sm"
                    placeholder="Share your thoughts..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                  <div className="mt-3 flex justify-end">
                    <button
                      disabled={commenting || !newComment.trim()}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-7 py-2.5 rounded-full font-bold text-sm shadow-md shadow-indigo-100 transition-all disabled:opacity-40"
                    >
                      {commenting ? 'Posting...' : 'Post Comment'}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            <div className="mb-10 p-6 bg-gray-50 rounded-2xl text-center border-2 border-dashed border-gray-200">
              <p className="text-gray-500 font-medium mb-3 text-sm">You must be logged in to comment.</p>
              <Link href="/login" className="inline-block bg-indigo-600 px-5 py-2 rounded-full text-white font-bold text-sm hover:bg-indigo-700 transition-all">
                Login to Comment
              </Link>
            </div>
          )}

          <div className="space-y-6">
            {comments.map((comment) => (
              <div key={comment.id} className="flex items-start gap-4 group">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex-shrink-0 flex items-center justify-center text-gray-500 font-black text-sm group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                  {comment.users?.name?.[0]}
                </div>
                <div className="flex-1 bg-gray-50 group-hover:bg-indigo-50/30 p-5 rounded-2xl border border-gray-100 transition-colors">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                       <p className="font-bold text-gray-900 text-sm">{comment.users?.name}</p>
                       <p className="text-xs text-gray-400">{new Date(comment.created_at).toLocaleDateString()}</p>
                    </div>
                    
                    {/* Comment Actions */}
                    {(user?.id === comment.user_id || user?.role === 'admin') && (
                      <div className="flex gap-3">
                         <button 
                           onClick={() => handleEditComment(comment.id, comment.comment_text)}
                           className="text-[10px] font-black text-indigo-400 hover:text-indigo-600 uppercase tracking-widest transition-colors"
                         >
                           Edit
                         </button>
                         <button 
                           onClick={() => handleDeleteComment(comment.id)}
                           className="text-[10px] font-black text-rose-300 hover:text-rose-500 uppercase tracking-widest transition-colors"
                         >
                           Purge
                         </button>
                      </div>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed italic">"{comment.comment_text}"</p>
                </div>
              </div>
            ))}

            {comments.length === 0 && (
              <p className="text-center text-gray-400 italic py-10 text-sm">Be the first to share your perspective!</p>
            )}
          </div>
        </section>
      </article>
    </div>
  );
}
