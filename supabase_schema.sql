-- Create ENUM type for User Roles
CREATE TYPE user_role AS ENUM ('author', 'viewer', 'admin');

-- Create Users table (Assuming it maps to Supabase's auth.users table)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role user_role DEFAULT 'viewer'::user_role NOT NULL
);

-- Create Posts table
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    image_url TEXT,
    summary TEXT,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Comments table
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

--------------------------------------------------------------------------------
-- POLICIES FOR USERS TABLE
--------------------------------------------------------------------------------
-- Allow everyone to read user profiles
CREATE POLICY "Anyone can read users" ON users
    FOR SELECT USING (true);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

--------------------------------------------------------------------------------
-- POLICIES FOR POSTS TABLE
--------------------------------------------------------------------------------
-- 1. Viewers (and all users) can read posts
CREATE POLICY "Anyone can read posts" ON posts
    FOR SELECT USING (true);

-- 2. Authors can only edit their own posts
CREATE POLICY "Authors can update own posts" ON posts
    FOR UPDATE USING (
        auth.uid() = author_id AND
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'author'::user_role)
    );

-- 3. Admins can edit any post
CREATE POLICY "Admins can update all posts" ON posts
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'::user_role)
    );

-- 4. Authors and Admins can insert posts
CREATE POLICY "Authors and Admins can insert posts" ON posts
    FOR INSERT WITH CHECK (
        auth.uid() = author_id AND
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('author'::user_role, 'admin'::user_role))
    );

-- 5. Authors can delete their own posts, Admins can delete any post
CREATE POLICY "Authors can delete own, Admins can delete any" ON posts
    FOR DELETE USING (
        (auth.uid() = author_id AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'author'::user_role))
        OR
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'::user_role)
    );

--------------------------------------------------------------------------------
-- POLICIES FOR COMMENTS TABLE
--------------------------------------------------------------------------------
-- 1. Anyone can read comments
CREATE POLICY "Anyone can read comments" ON comments
    FOR SELECT USING (true);

-- 2. Any logged in user (including viewers) can insert comments
CREATE POLICY "Authenticated users can insert comments" ON comments
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
    );

-- 3. Users can update and delete their own comments
CREATE POLICY "Users can update their own comments" ON comments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON comments
    FOR DELETE USING (auth.uid() = user_id);

-- 4. Admins can delete any comment
CREATE POLICY "Admins can delete any comment" ON comments
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'::user_role)
    );
