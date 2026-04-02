import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { genAI } from '@/lib/gemini';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function PUT(req: Request) {
  try {
    const { id, title, body, image_url, regenerate_summary } = await req.json();

    if (!id || !title || !body) {
      return NextResponse.json({ error: 'Post ID, title, and body are required' }, { status: 400 });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    const token = authHeader.replace('Bearer ', '').trim();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    // Prepare update data
    const updateData: any = {
      title,
      body,
      image_url,
    };

    // Only regenerate AI summary if explicitly requested or if body changed significantly
    if (regenerate_summary) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite-preview' });
        // Precise instruction to meet Hivon's ~200 word requirement
        const prompt = `Summarize the following blog post in exactly 200 words. DO NOT exceed or fall significantly short of this limit. The summary should be professional, engaging, and suitable for a tech-focused blog listing page. Content: ${body}`;
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        updateData.summary = response.text() || "Summary regeneration failed.";
      } catch (geminiError) {
        console.error('Gemini API Error during update:', geminiError);
      }
    }

    const { data: post, error: updateError } = await supabase
      .from('posts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Supabase Update Error:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json(post, { status: 200 });

  } catch (error: any) {
    console.error('Internal Server Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
