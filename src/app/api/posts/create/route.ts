import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { genAI } from '@/lib/gemini';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(req: Request) {
  try {
    const { title, body, image_url } = await req.json();

    if (!title || !body) {
      return NextResponse.json({ error: 'Title and body are required' }, { status: 400 });
    }

    // Ensure user is authenticated by checking Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '').trim();
    
    // Create a Supabase client that uses the user's token so RLS is correctly applied.
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    // Fetch the authenticating user 
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    // 2) Call Google Gemini API
    let summary = "Summary not available.";
    
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite-preview' });
      const prompt = `Summarize the following blog post in exactly 200 words. Ensure the summary is detailed, engaging, and professional. Content: ${body}`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      summary = response.text() || summary;
    } catch (geminiError) {
      console.error('Gemini API Error (using fallback summary):', geminiError);
      // Fails gracefully - proceeds with 'summary not available' string
    }

    // 3) Save the post alongside the summary
    const { data: post, error: insertError } = await supabase
      .from('posts')
      .insert([
        {
          title,
          body,
          image_url,
          summary,
          author_id: user.id
        }
      ])
      // Return the inserted row
      .select()
      .single();

    if (insertError) {
      console.error('Supabase Error:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // 4) Return the created post back to the client
    return NextResponse.json(post, { status: 201 });

  } catch (error: any) {
    console.error('Internal Server Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
