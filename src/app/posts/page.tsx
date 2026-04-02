"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export default function PostsPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const PAGE_SIZE = 6;
  const isAuthor = user?.role === 'author' || user?.role === 'admin';

  const fetchPosts = async (currentPage: number, isInitial = false) => {
    if (isInitial) setLoading(true);
    else setLoadingMore(true);

    const from = currentPage * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from('posts')
      .select('*, users(name)')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (isAuthor && user?.id) {
      query = query.neq('author_id', user.id);
    }

    const { data, error } = await query;
    if (!error && data) {
      if (isInitial) setPosts(data);
      else setPosts(prev => [...prev, ...data]);
      
      if (data.length < PAGE_SIZE) setHasMore(false);
      else setHasMore(true);
    }
    
    setLoading(false);
    setLoadingMore(false);
  };

  useEffect(() => {
    fetchPosts(0, true);
  }, [user]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPosts(nextPage);
  };

  const filtered = posts.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );


  return (
    <main className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
                {isAuthor ? 'Discover Other Authors' : 'Explore Stories'}
              </h1>
              <p className="text-gray-500">
                {isAuthor
                  ? `${posts.length} post${posts.length !== 1 ? 's' : ''} by the community — not yours`
                  : `${posts.length} article${posts.length !== 1 ? 's' : ''} published`
                }
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 pr-6 py-3 rounded-full border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-sm font-medium w-64 bg-white"
                />
              </div>
              {(user?.role === 'author' || user?.role === 'admin') && (
                <Link
                  href="/posts/new"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-full font-bold text-sm shadow-lg shadow-indigo-100 transition-all"
                >
                  + Write New Post
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Posts Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-gray-400 italic">
              {search
                ? `No posts found matching "${search}"`
                : isAuthor
                ? 'No posts from other authors yet.'
                : 'No posts yet. Be the first to write one!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((post) => (
              <Link key={post.id} href={`/posts/${post.id}`} className="block group">
                <article className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col h-full">
                  {post.image_url && (
                  <div className="aspect-[16/9] bg-gray-100 relative overflow-hidden">
                    <img
                      src={post.image_url}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-[9px] font-black text-[#7E94A8] uppercase tracking-widest shadow-sm">
                        Curated Insight
                      </span>
                    </div>
                  </div>
                )}

                  {/* Content */}
                  <div className="p-7 flex flex-col flex-1">
                    <div className="flex items-center gap-2 mb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      <span>{new Date(post.created_at).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{post.users?.name || 'Anonymous Author'}</span>
                    </div>
                    <h2 className="text-xl font-extrabold text-gray-900 mb-3 line-clamp-2 group-hover:text-earth-brown transition-colors leading-snug">
                      {post.title}
                    </h2>
                    <p className="text-gray-500 text-sm mb-6 line-clamp-3 leading-relaxed flex-1 italic">
                      {post.summary && post.summary !== 'Summary not available.'
                        ? post.summary
                        : (post.body || '').substring(0, 160) + '...'}
                    </p>
                    <div className="inline-flex items-center gap-2 font-black text-earth-gold text-xs uppercase tracking-widest group-hover:gap-3 transition-all mt-auto">
                      Explore Full Story
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}

        {/* Load More Button */}
        {hasMore && filtered.length > 0 && !search && (
          <div className="flex justify-center mt-16">
            <button
               onClick={handleLoadMore}
               disabled={loadingMore}
               className="bg-white hover:bg-gray-50 text-indigo-600 border-2 border-indigo-100 hover:border-indigo-600 px-10 py-3.5 rounded-full font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-100/30 flex items-center gap-3 disabled:opacity-50"
            >
               {loadingMore ? 'Fetching more stories...' : 'Next Page'}
               {loadingMore && <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>}
            </button>
          </div>
        )}
      </div>
    </main>

  );
}
