"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

// ─── Author Dashboard ──────────────────────────────────────────────
function AuthorDashboard({ user }: { user: any }) {
  const [posts, setPosts] = useState<any[]>([]);
  const [totalComments, setTotalComments] = useState(0);
  const [totalUpvotes, setTotalUpvotes] = useState(0);
  const [totalDownvotes, setTotalDownvotes] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const { data: myPosts } = await supabase
        .from('posts')
        .select('*, comments(count)')
        .eq('author_id', user.id)
        .order('created_at', { ascending: false });

      const postsData = myPosts || [];
      const postIds = postsData.map((p: any) => p.id);

      let upvotes = 0;
      let downvotes = 0;

      if (postIds.length > 0) {
        const { data: voteData } = await supabase
          .from('votes')
          .select('vote_type, post_id')
          .in('post_id', postIds);

        const voteCounts: Record<string, { up: number; down: number }> = {};
        for (const v of voteData || []) {
          if (!voteCounts[v.post_id]) voteCounts[v.post_id] = { up: 0, down: 0 };
          voteCounts[v.post_id][v.vote_type as 'up' | 'down']++;
        }
        postsData.forEach((p: any) => {
          p._upvotes = voteCounts[p.id]?.up || 0;
          p._downvotes = voteCounts[p.id]?.down || 0;
        });

        upvotes = (voteData || []).filter((v: any) => v.vote_type === 'up').length;
        downvotes = (voteData || []).filter((v: any) => v.vote_type === 'down').length;
      }

      setPosts(postsData);
      setTotalComments(postsData.reduce((acc: number, p: any) => acc + (p.comments?.[0]?.count || 0), 0));
      setTotalUpvotes(upvotes);
      setTotalDownvotes(downvotes);
      setLoading(false);
    };

    fetchData();
  }, [user.id]);

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('🚨 Are you sure you want to delete this story forever? This action cannot be reversed.')) return;

    const { error } = await supabase.from('posts').delete().eq('id', postId);

    if (error) {
      alert('Error: ' + error.message);
    } else {
      setPosts(prev => prev.filter(p => p.id !== postId));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-earth-gold to-earth-brown flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-earth-gold/20">
                {user.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-400 mb-0.5">Welcome back 👋</p>
                <h1 className="text-3xl font-black text-gray-900">{user.name}</h1>
                <span className="inline-block mt-1 px-3 py-0.5 bg-indigo-100 text-indigo-600 text-[10px] font-black uppercase tracking-wider rounded-full capitalize">
                  {user.role}
                </span>
              </div>
            </div>
            <Link
              href="/posts/new"
              className="self-start sm:self-center bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-full font-bold text-sm shadow-lg shadow-indigo-100 transition-all"
            >
              + Write New Post
            </Link>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-8">
            <StatCard value={posts.length} label="Posts" color="brown" />
            <StatCard value={totalComments} label="Comments" color="sand" />
            <StatCard value={totalUpvotes} label="Thumbs Up" color="gold" icon="up" />
            <StatCard value={totalDownvotes} label="Thumbs Down" color="sand" icon="down" />
            <StatCard value={posts.filter(p => p.summary && p.summary !== 'Summary not available.').length} label="AI Posts" color="gold" />
          </div>
        </div>
      </div>

      {/* Posts */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-gray-900">My Published Posts</h2>
          <Link href="/profile?tab=my-posts" className="text-sm font-bold text-indigo-600 hover:underline">
            View all →
          </Link>
        </div>

        {posts.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-gray-100 shadow-sm">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <p className="text-gray-400 font-semibold mb-5">You haven't published anything yet.</p>
            <Link href="/posts/new" className="bg-indigo-600 text-white px-6 py-3 rounded-full font-bold text-sm hover:bg-indigo-700 transition-all shadow-md">
              Write your first story
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <DashboardPostCard key={post.id} post={post} onDelete={handleDeletePost} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

// ─── Viewer Dashboard ──────────────────────────────────────────────
function ViewerDashboard({ user }: { user: any }) {
  const [likedPosts, setLikedPosts] = useState<any[]>([]);
  const [totalUpvotesGiven, setTotalUpvotesGiven] = useState(0);
  const [totalCommentsGiven, setTotalCommentsGiven] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const [likedResponse, commentsResponse] = await Promise.all([
        supabase
          .from('votes')
          .select('post_id, posts(*, users(name), comments(count))')
          .eq('user_id', user.id)
          .eq('vote_type', 'up')
          .order('created_at', { ascending: false })
          .limit(6),
        supabase
          .from('comments')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id)
      ]);

      const upvoted = (likedResponse.data || []).map((v: any) => v.posts).filter(Boolean);
      setLikedPosts(upvoted);
      setTotalUpvotesGiven(upvoted.length);
      setTotalCommentsGiven(commentsResponse.count || 0);
      setLoading(false);
    };

    fetchData();
  }, [user.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50/50 pb-16">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-indigo-200">
                {user.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-400 mb-0.5">Welcome back 👋</p>
                <h1 className="text-3xl font-black text-gray-900">{user.name}</h1>
                <span className="inline-block mt-1 px-3 py-0.5 bg-purple-100 text-purple-600 text-[10px] font-black uppercase tracking-wider rounded-full capitalize">
                  {user.role}
                </span>
              </div>
            </div>
            <Link
              href="/posts"
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-full font-bold text-sm shadow-lg shadow-purple-100 transition-all"
            >
              Explore Stories
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <StatCard value={likedPosts.length} label="Stories Liked" color="indigo" />
            <StatCard value={totalCommentsGiven} label="Comments Posted" color="gray" />
            <div className="bg-white rounded-2xl p-5 border border-gray-100 md:col-span-2">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg">💡</div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Personal Details</p>
                    <p className="text-sm font-bold text-gray-900">{user.email}</p>
                  </div>
                  <Link href="/profile?tab=details" className="ml-auto text-xs font-black text-indigo-600 hover:underline">View All →</Link>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Liked Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black text-gray-900">Recently Liked</h2>
          <Link href="/profile?tab=liked" className="text-sm font-bold text-indigo-600 hover:underline">
            Manage Library →
          </Link>
        </div>

        {likedPosts.length === 0 ? (
          <div className="bg-white rounded-[2rem] p-16 text-center border border-gray-100 shadow-sm">
             <p className="text-gray-400 font-bold italic mb-6">Your liked library is currently empty.</p>
             <Link href="/posts" className="bg-indigo-600 text-white px-8 py-3 rounded-full font-bold text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all">Explore Trending Blogs</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {likedPosts.map((post) => (
              <DashboardPostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function StatCard({ value, label, color, icon }: { value: number; label: string; color: string; icon?: string }) {
  const configs: Record<string, { bg: string; border: string; text: string }> = {
    brown: { bg: 'bg-[#F4FAF9]', border: 'border-[#121E26]', text: 'text-[#121E26]' },
    gold:  { bg: 'bg-[#F4FAF9]', border: 'border-[#7E94A8]', text: 'text-[#7E94A8]' },
    sand:  { bg: 'bg-[#F4FAF9]', border: 'border-[#CAD3D7]', text: 'text-[#4A555E]' },
    gray:  { bg: 'bg-[#F4FAF9]', border: 'border-[#CAD3D7]', text: 'text-[#121E26]' },
  };
  const config = configs[color] || configs.gray;

  return (
    <div className={`rounded-2xl p-5 border-2 ${config.bg} ${config.border} ${config.text} transition-all hover:scale-[1.02] shadow-sm`}>
      <p className="text-3xl font-black">{value}</p>
      <p className={`text-[10px] font-black mt-1 uppercase tracking-[0.2em] opacity-80`}>{label}</p>
    </div>
  );
}

function DashboardPostCard({ post, onDelete }: { post: any; onDelete?: (id: string) => void }) {
  const commentCount = post.comments?.[0]?.count || 0;
  const hasSummary = post.summary && post.summary !== 'Summary not available.';

  return (
    <Link href={`/posts/${post.id}`} className="block group">
      <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 h-full flex flex-col">
        {/* Cover */}
        {post.image_url && (
          <div className="aspect-[16/9] bg-gray-50 relative overflow-hidden">
            <img src={post.image_url} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            {hasSummary && (
              <div className="absolute top-3 left-3">
                <span className="px-2 py-1 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow">AI</span>
              </div>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete(post.id);
                }}
                className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm text-rose-500 rounded-full flex items-center justify-center shadow-lg hover:bg-rose-500 hover:text-white transition-all z-10"
                title="Delete Post"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-6 flex flex-col flex-1">
          <p className="text-xs text-gray-400 font-medium mb-2">
            {new Date(post.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
          </p>
          <h3 className="font-extrabold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2 mb-3 leading-snug">
            {post.title}
          </h3>
          <p className="text-gray-500 text-sm line-clamp-2 mb-4 flex-1 font-medium">
            {hasSummary ? post.summary : post.body?.substring(0, 120) + '...'}
          </p>

          {/* Stats row */}
          <div className="flex items-center gap-4 pt-4 border-t border-gray-50 text-xs font-bold">
            <span className="flex items-center gap-1 text-gray-400">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              {commentCount}
            </span>
            <div className="ml-auto text-indigo-600 flex items-center gap-1">
               Read Story →
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Public Landing Page ───────────────────────────────────────────
function PublicHome({ user }: { user: any }) {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*, users(name)')
        .order('created_at', { ascending: false })
        .limit(6);
      if (!error) setPosts(data || []);
      setLoading(false);
    };
    fetchPosts();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50/50">
      {/* Hero */}
      <section className="relative py-24 overflow-hidden bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-[#121E26] mb-6 leading-none">
            Welcome to{' '}
            <span className="bg-gradient-to-r from-[#121E26] to-[#7E94A8] bg-clip-text text-transparent">
              Beyond Limits
            </span>
          </h1>
          <p className="max-w-2xl mx-auto text-xl text-gray-500 font-medium mb-10 leading-relaxed italic">
            Explore deep insights and tech stories — each post comes with an AI-generated summary to get you up to speed instantly.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/posts" className="bg-indigo-600 hover:bg-earth-gold text-white px-10 py-4 rounded-full font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-100 transition-all hover:scale-105 active:scale-95">
              Start Reading
            </Link>
            {!user && (
              <Link href="/signup" className="bg-white hover:bg-gray-50 text-gray-800 px-10 py-4 rounded-full font-black text-xs uppercase tracking-widest border-2 border-gray-100 transition-all">
                Join Community
              </Link>
            )}
          </div>
        </div>
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-[#7E94A8] opacity-10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-96 h-96 bg-[#CAD3D7] opacity-10 rounded-full blur-3xl pointer-events-none"></div>
      </section>

      {/* Latest Posts */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-3xl font-black text-gray-900">Latest Stories</h2>
          <Link href="/posts" className="text-indigo-600 font-bold text-sm hover:underline">View all →</Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <Link key={post.id} href={`/posts/${post.id}`} className="block group">
              <article className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col h-full">
                {post.image_url && (
                  <div className="aspect-[16/9] bg-gray-100 relative overflow-hidden">
                    <img src={post.image_url} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                )}
                <div className="p-7 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <span>{new Date(post.created_at).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{post.users?.name}</span>
                  </div>
                  <h3 className="text-xl font-extrabold text-gray-900 mb-3 line-clamp-2 group-hover:text-earth-brown transition-colors leading-snug flex-1">
                    {post.title}
                  </h3>
                  <p className="text-gray-500 text-sm mb-5 line-clamp-2 leading-relaxed italic">
                    {post.summary && post.summary !== 'Summary not available.' ? post.summary : (post.body || '').substring(0, 140) + '...'}
                  </p>
                  <div className="inline-flex items-center gap-2 font-black text-[#7E94A8] text-xs uppercase tracking-widest group-hover:gap-3 transition-all mt-auto">
                    Read More Story →
                  </div>
                </div>
              </article>
            </Link>
          ))}

          {posts.length === 0 && (
            <div className="col-span-full py-20 text-center">
              <p className="text-xl text-gray-400 italic">No posts yet. Be the first to write one!</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

// ─── Smart Router ──────────────────────────────────────────────────
export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && user.role === 'viewer') {
      router.replace('/posts');
    }
  }, [user, loading, router]);

  if (loading || (user && user.role === 'viewer')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (user?.role === 'author' || user?.role === 'admin') {
    return <AuthorDashboard user={user} />;
  }

  return <PublicHome user={user} />;
}
