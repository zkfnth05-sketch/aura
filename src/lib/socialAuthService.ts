'use client';

import { supabase } from '@/lib/supabaseClient';

/**
 * 카카오 소셜 로그인 실행 함수
 */
export async function signInWithKakao(): Promise<{ error: Error | null }> {
  try {
    if (!supabase) {
      throw new Error('Supabase 클라이언트가 초기화되지 않았습니다.');
    }

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://aura-ai-dating.vercel.app';
    const redirectUrl = `${origin}/auth/callback`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          prompt: 'select_account',
        },
      },
    });

    if (error) {
      console.error('Kakao OAuth signIn error:', error);
      return { error };
    }

    return { error: null };
  } catch (err: any) {
    console.error('signInWithKakao exception:', err);
    return { error: err };
  }
}

/**
 * 구글 소셜 로그인 실행 함수
 */
export async function signInWithGoogle(): Promise<{ error: Error | null }> {
  try {
    if (!supabase) {
      throw new Error('Supabase 클라이언트가 초기화되지 않았습니다.');
    }

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://aura-ai-dating.vercel.app';
    const redirectUrl = `${origin}/auth/callback`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      },
    });

    if (error) {
      console.error('Google OAuth signIn error:', error);
      return { error };
    }

    return { error: null };
  } catch (err: any) {
    console.error('signInWithGoogle exception:', err);
    return { error: err };
  }
}
