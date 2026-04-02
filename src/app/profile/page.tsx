"use client";

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';

function ProfileContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Data states
  // Data states
  const [authoredPosts, setAuthoredPosts] = useState<any[]>([]);
  const [likedPosts, setLikedPosts] = useState<any[]>([]);
  const [myComments, setMyComments] = useState<any[]>([]);
  const [totalCommentsGiven, setTotalCommentsGiven] = useState(0);
  const [totalUpvotesReceived, setTotalUpvotesReceived] = useState(0);
  const [totalDownvotesReceived, setTotalDownvotesReceived] = useState(0);
  
  const [loading, setLoading] = useState(true);
  const activeTab = searchParams.get('tab') || 'overview';
  const isAuthor = user?.role === 'author' || user?.role === 'admin';

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  const fetchProfileData = async () => {
    if (!user) return;
    setLoading(true);

    const fetchTasks = [];

    // 1. If author, fetch their authored posts
    if (isAuthor) {
      fetchTasks.push(
        supabase
          .from('posts')
          .select('*, comments(count)')
          .eq('author_id', user.id)
          .order('created_at', { ascending: false })
          .then(({ data }) => setAuthoredPosts(data || []))
      );
    }

    // 2. Fetch posts upvoted by the current user
    fetchTasks.push(
      supabase
        .from('votes')
        .select('post_id, posts(*, users(name), comments(count))')
        .eq('user_id', user.id)
        .eq('vote_type', 'up')
        .then(({ data }) => {
          const upvoted = (data || []).map((v: any) => v.posts).filter(Boolean);
          setLikedPosts(upvoted);
        })
    );

    // 3. Fetch all comments posted by this user
    fetchTasks.push(
      supabase
        .from('comments')
        .select('*, posts(title)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          setMyComments(data || []);
          setTotalCommentsGiven(data?.length || 0);
        })
    );

    await Promise.all(fetchTasks);

    // 4. If author, fetch votes received on their posts
    if (isAuthor) {
      const { data: myPosts } = await supabase.from('posts').select('id').eq('author_id', user.id);
      const postIds = (myPosts || []).map(p => p.id);
      
      if (postIds.length > 0) {
        const { data: voteData } = await supabase
          .from('votes')
          .select('vote_type, post_id')
          .in('post_id', postIds);

        const up = (voteData || []).filter((v: any) => v.vote_type === 'up').length;
        const down = (voteData || []).filter((v: any) => v.vote_type === 'down').length;
        
        setTotalUpvotesReceived(up);
        setTotalDownvotesReceived(down);

        // Attach per-post vote counts to authoredPosts
        const voteCounts: Record<string, { up: number; down: number }> = {};
        for (const v of voteData || []) {
          if (!voteCounts[v.post_id]) voteCounts[v.post_id] = { up: 0, down: 0 };
          voteCounts[v.post_id][v.vote_type as 'up' | 'down']++;
        }
        
        setAuthoredPosts(prev => prev.map(p => ({
          ...p,
          _upvotes: voteCounts[p.id]?.up || 0,
          _downvotes: voteCounts[p.id]?.down || 0
        })));
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchProfileData();
  }, [user, isAuthor]);

  const handleDeleteComment = async (id: string) => {
    if (!window.confirm('🚨 Purge this comment forever?')) return;
    const { error } = await supabase.from('comments').delete().eq('id', id);
    if (!error) {
      setMyComments(prev => prev.filter(c => c.id !== id));
      setTotalCommentsGiven(prev => prev - 1);
    }
  };

  const handleEditComment = async (id: string, oldText: string) => {
    const newText = window.prompt('Update your perspective:', oldText);
    if (!newText || newText === oldText) return;

    const { error } = await supabase.from('comments').update({ comment_text: newText }).eq('id', id);
    if (!error) {
      setMyComments(prev => prev.map(c => c.id === id ? { ...c, comment_text: newText } : c));
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) return null;

  const tabs = [
    { key: 'overview', label: 'Overview' },
    ...(isAuthor ? [{ key: 'my-posts', label: `My Posts (${authoredPosts.length})` }] : []),
    { key: 'liked', label: `Liked Posts (${likedPosts.length})` },
    { key: 'comments', label: `My Comments (${myComments.length})` },
    { key: 'details', label: 'Personal Details' }
  ];

  return (
    <main className="min-h-screen bg-gray-50/50 pb-20">
      {/* Profile Hero */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-indigo-200">
              {user.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-black text-gray-900">{user.name}</h1>
                <span className="px-3 py-1 bg-indigo-100 text-indigo-600 text-xs font-black uppercase tracking-wider rounded-full capitalize">
                  {user.role}
                </span>
              </div>
              <p className="text-gray-400 font-medium text-lg">{user.email}</p>
            </div>
            {isAuthor && (
              <Link
                href="/posts/new"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-full font-bold text-sm shadow-xl shadow-indigo-100 transition-all active:scale-95"
              >
                + Create New Post
              </Link>
            )}
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
            {isAuthor ? (
              <>
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                  <p className="text-4xl font-black text-gray-900">{authoredPosts.length}</p>
                  <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">Posts Authored</p>
                </div>
                <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100">
                  <p className="text-4xl font-black text-emerald-600">{totalUpvotesReceived}</p>
                  <p className="text-xs font-bold text-emerald-500 mt-1 uppercase tracking-widest">Global Likes</p>
                </div>
              </>
            ) : (
              <>
                <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
                  <p className="text-4xl font-black text-indigo-600">{likedPosts.length}</p>
                  <p className="text-xs font-bold text-indigo-400 mt-1 uppercase tracking-widest">Stories Upvoted</p>
                </div>
                <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100">
                  <p className="text-4xl font-black text-emerald-600">{totalCommentsGiven}</p>
                  <p className="text-xs font-bold text-emerald-500 mt-1 uppercase tracking-widest">Comments Made</p>
                </div>
              </>
            )}
            <div className="bg-purple-50 rounded-2xl p-6 border border-purple-100">
               <p className="text-4xl font-black text-purple-600">{myComments.length}</p>
               <p className="text-xs font-bold text-purple-500 mt-1 uppercase tracking-widest">My Perspectives</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <p className="text-4xl font-black text-gray-900 uppercase">
                {isAuthor ? authoredPosts.filter(p => p.summary && p.summary !== 'Summary not available.').length : 'View'}
              </p>
              <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">{isAuthor ? 'AI Summaries' : 'Type'}</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 mt-12 border-b border-gray-100">
            {tabs.map(({ key, label }) => (
              <Link
                key={key}
                href={`/profile${key === 'overview' ? '' : `?tab=${key}`}`}
                className={`px-6 py-4 text-sm font-black transition-all border-b-2 -mb-px ${
                  activeTab === key
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-200'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Personal Info Summary */}
            <div className="bg-white rounded-[2rem] p-10 border border-gray-100 shadow-sm">
              <h2 className="text-2xl font-black text-gray-900 mb-8 items-center flex gap-3">
                <span className="w-2 h-8 bg-indigo-600 rounded-full"></span>
                Profile Identity
              </h2>
              <div className="space-y-8">
                <InfoItem label="Full Legal Name" value={user.name} icon="👤" />
                <InfoItem label="Email Address" value={user.email} icon="✉️" />
                <InfoItem label="Authority Rank" value={user.role} icon="🛡️" isBadge />
                <div className="pt-6">
                   <Link href="/profile?tab=details" className="text-indigo-600 font-bold text-sm hover:underline">Manage Account Details →</Link>
                </div>
              </div>
            </div>

            {/* Recent Content */}
            <div className="space-y-8">
               <h2 className="text-2xl font-black text-gray-900 items-center flex gap-3">
                <span className="w-2 h-8 bg-purple-600 rounded-full"></span>
                {isAuthor ? 'Recent Publications' : 'Recently Liked'}
              </h2>
              {isAuthor ? (
                authoredPosts.length > 0 ? (
                  authoredPosts.slice(0, 3).map(post => <MinimalPostCard key={post.id} post={post} />)
                ) : (
                  <EmptyState message="You haven't published anything yet." link="/posts/new" linkText="Start Writing" />
                )
              ) : (
                likedPosts.length > 0 ? (
                  likedPosts.slice(0, 3).map(post => <MinimalPostCard key={post.id} post={post} />)
                ) : (
                  <EmptyState message="You haven't liked any posts yet." link="/posts" linkText="Explore Blogs" />
                )
              )}
            </div>
          </div>
        )}

        {/* MY POSTS TAB (Authors Only) */}
        {activeTab === 'my-posts' && isAuthor && (
           <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-3xl font-black text-gray-900">Portfolio Content</h2>
            </div>
            {authoredPosts.length > 0 ? (
              authoredPosts.map(post => <DetailedPostCard key={post.id} post={post} />)
            ) : (
              <EmptyState message="Your publication list is currently empty." link="/posts/new" linkText="Publish Now" />
            )}
          </div>
        )}

        {/* LIKED POSTS TAB */}
        {activeTab === 'liked' && (
           <div className="space-y-6">
            <h2 className="text-3xl font-black text-gray-900 mb-8">Curated Library</h2>
            {likedPosts.length > 0 ? (
              likedPosts.map(post => <DetailedPostCard key={post.id} post={post} />)
            ) : (
              <EmptyState message="No liked stories found in your library." link="/posts" linkText="Browse Stories" />
            )}
          </div>
        )}

        {/* COMMENTS TAB */}
        {activeTab === 'comments' && (
           <div className="space-y-8 max-w-3xl">
              <h2 className="text-3xl font-black text-gray-900 mb-8">My Perspectives</h2>
              {myComments.length > 0 ? (
                myComments.map(c => (
                  <div key={c.id} className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
                     <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                           <div className="w-1.5 h-6 bg-purple-600 rounded-full"></div>
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">POST: {c.posts?.title}</p>
                        </div>
                        <div className="flex gap-4">
                           <button 
                             onClick={() => handleEditComment(c.id, c.comment_text)}
                             className="text-indigo-600 font-bold text-xs hover:underline"
                           >
                             Edit
                           </button>
                           <button 
                             onClick={() => handleDeleteComment(c.id)}
                             className="text-red-500 font-bold text-xs hover:underline"
                           >
                             Purge
                           </button>
                        </div>
                     </div>
                     <p className="text-gray-700 font-medium leading-relaxed mb-6 italic">"{c.comment_text}"</p>
                     <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-300 font-bold uppercase">{new Date(c.created_at).toLocaleDateString()}</span>
                        <Link href={`/posts/${c.post_id}`} className="text-indigo-500 font-black text-xs hover:gap-2 transition-all flex items-center gap-1">Jump to story →</Link>
                     </div>
                  </div>
                ))
              ) : (
                <EmptyState message="You haven't shared any perspective yet." link="/posts" linkText="Find a Story" />
              )}
           </div>
        )}

        {/* DETAILS TAB */}
        {activeTab === 'details' && (
          <div className="bg-white rounded-[2.5rem] p-12 border border-gray-100 shadow-sm max-w-3xl">
             <h2 className="text-3xl font-black text-gray-900 mb-10">Personal Credentials</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-y-12 gap-x-8">
                <DetailField label="Display Name" value={user.name} />
                <DetailField label="Email Registry" value={user.email} />
                <DetailField label="User ID" value={user.id} isCode />
                <DetailField label="Access Permission" value={user.role} isBadge />
             </div>
             <div className="mt-16 pt-8 border-t border-gray-50 flex gap-4">
                <button className="bg-gray-100 text-gray-600 px-6 py-3 rounded-full font-bold text-sm hover:bg-gray-200 transition-all">Download Data</button>
                <button className="text-red-500 font-bold text-sm px-6 py-3 hover:bg-red-50 rounded-full transition-all">Deactivate Account</button>
             </div>
          </div>
        )}

      </div>
    </main>
  );
}

// ─── Helper Components ──────────────────────────────────────────────

function InfoItem({ label, value, icon, isBadge }: any) {
  return (
    <div className="flex items-center gap-4 group">
      <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-0.5">{label}</p>
        {isBadge ? (
          <span className="px-3 py-0.5 bg-indigo-100 text-indigo-600 text-[10px] font-black uppercase rounded-full">{value}</span>
        ) : (
          <p className="text-gray-900 font-bold">{value}</p>
        )}
      </div>
    </div>
  );
}

function DetailField({ label, value, isCode, isBadge }: any) {
  return (
    <div>
      <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-3">{label}</p>
      {isCode ? (
        <code className="bg-gray-50 px-3 py-1.5 rounded-lg text-xs font-mono text-gray-600 break-all">{value}</code>
      ) : isBadge ? (
        <span className="px-4 py-1 bg-indigo-600 text-white text-xs font-black uppercase rounded-full">{value}</span>
      ) : (
        <p className="text-gray-900 font-extrabold text-lg">{value}</p>
      )}
    </div>
  );
}

function MinimalPostCard({ post }: any) {
  return (
    <Link href={`/posts/${post.id}`} className="block group">
       <div className="flex items-center gap-4 p-4 rounded-2xl hover:bg-white hover:shadow-lg hover:shadow-indigo-100/50 transition-all border border-transparent hover:border-indigo-50">
          <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
             {post.image_url ? (
               <img src={post.image_url} alt="" className="w-full h-full object-cover" />
             ) : (
               <div className="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-200 font-black text-sm">AI</div>
             )}
          </div>
          <div className="min-w-0">
             <h4 className="font-extrabold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1">{post.title}</h4>
             <p className="text-xs text-gray-400 mt-1">{new Date(post.created_at).toLocaleDateString()}</p>
          </div>
       </div>
    </Link>
  );
}

function DetailedPostCard({ post }: { post: any }) {
  const commentCount = post.comments?.[0]?.count || 0;
  const upvotes = post._upvotes || 0;
  const hasSummary = post.summary && post.summary !== 'Summary not available.';

  return (
    <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all group flex flex-col sm:flex-row gap-8">
      <div className="w-full sm:w-48 h-32 rounded-2xl bg-gray-50 overflow-hidden flex-shrink-0 relative">
        {post.image_url ? (
          <img src={post.image_url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-100 font-black text-2xl tracking-tighter">AI BLOG</div>
        )}
        {hasSummary && <span className="absolute top-2 right-2 bg-indigo-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">AI READY</span>}
      </div>
      <div className="flex-1 min-w-0">
         <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{new Date(post.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
         </div>
         <h3 className="text-2xl font-black text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors line-clamp-1">{post.title}</h3>
         <p className="text-gray-500 text-sm line-clamp-2 leading-relaxed mb-6 font-medium">
            {hasSummary ? post.summary : post.body?.substring(0, 160) + '...'}
         </p>
         <div className="flex items-center gap-6">
            <StatItem icon="💬" value={commentCount} label="comments" />
            <StatItem icon="👍" value={upvotes} label="upvotes" color="text-emerald-500" />
            <Link href={`/posts/${post.id}`} className="ml-auto bg-gray-50 hover:bg-indigo-600 hover:text-white px-6 py-2 rounded-full text-sm font-black transition-all">Read Story</Link>
         </div>
      </div>
    </div>
  );
}

function StatItem({ icon, value, label, color }: any) {
  return (
    <div className="flex items-center gap-1.5">
       <span className="text-sm">{icon}</span>
       <span className={`text-sm font-black ${color || 'text-gray-900'}`}>{value}</span>
       <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{label}</span>
    </div>
  );
}

function EmptyState({ message, link, linkText }: any) {
  return (
    <div className="bg-white rounded-[2rem] p-16 text-center border-2 border-dashed border-gray-100">
      <p className="text-gray-400 font-bold mb-6 italic">{message}</p>
      <Link href={link} className="bg-indigo-600 text-white px-8 py-3 rounded-full font-bold text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all">{linkText}</Link>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}
