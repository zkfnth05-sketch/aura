'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/language-context';

export default function AuthCallbackPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [statusMessage, setStatusMessage] = useState(t('auth_kakao_verifying'));

  useEffect(() => {
    let isHandled = false;

    async function handleAuthCallback() {
      // 1. URL 에러 파라미터 감지
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const errorDesc = urlParams.get('error_description') || urlParams.get('error');
        if (errorDesc) {
          console.error('OAuth URL error received:', errorDesc);
          toast({
            variant: 'destructive',
            title: t('auth_kakao_error_title'),
            description: decodeURIComponent(errorDesc).replace(/\+/g, ' '),
          });
          setTimeout(() => router.replace('/signup'), 1500);
          return;
        }
      }

      if (!supabase) {
        toast({ variant: 'destructive', title: t('auth_kakao_error_title'), description: t('auth_kakao_error_failed') });
        router.replace('/signup');
        return;
      }

      try {
        // 2. Supabase OAuth 세션 획득
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session?.user) {
          const { data: authListener } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
            if (isHandled) return;
            if (currentSession?.user) {
              isHandled = true;
              authListener.subscription.unsubscribe();
              await processUserSession(currentSession.user);
            }
          });

          setTimeout(() => {
            if (!isHandled) {
              isHandled = true;
              console.warn('Auth callback timeout, redirecting to home');
              router.replace('/');
            }
          }, 5000);
          return;
        }

        if (session.user && !isHandled) {
          isHandled = true;
          await processUserSession(session.user);
        }
      } catch (err: any) {
        console.error('Auth callback exception:', err);
        toast({ variant: 'destructive', title: t('auth_kakao_error_title'), description: t('auth_kakao_error_failed') });
        router.replace('/signup');
      }
    }

    async function processUserSession(authUser: any) {
      setStatusMessage(t('auth_syncing_user'));
      const userId = authUser.id;
      const metadata = authUser.user_metadata || {};
      
      // 카카오 메타데이터 파싱
      const rawNickname = metadata.name || metadata.full_name || metadata.nickname || metadata.preferred_username || '아우라 회원';
      const rawAvatar = metadata.avatar_url || metadata.picture || '';
      const rawEmail = authUser.email || metadata.email || '';
      
      // 성별 파싱
      let parsedGender: '남성' | '여성' = '여성';
      if (metadata.gender) {
        const g = String(metadata.gender).toLowerCase();
        if (g === 'male' || g === '남' || g === 'm') {
          parsedGender = '남성';
        } else {
          parsedGender = '여성';
        }
      }

      // 연령대 파싱
      let parsedAge = 25;
      if (metadata.age_range) {
        const match = String(metadata.age_range).match(/(\d+)/);
        if (match) {
          parsedAge = parseInt(match[1], 10) + 3;
        }
      }

      const referredBy = typeof window !== 'undefined' ? localStorage.getItem('aura_referred_by_code') : null;

      try {
        // 서버 사이드 보안 API를 통해 유저 동기화/생성
        const res = await fetch('/api/auth/social-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            name: rawNickname,
            email: rawEmail,
            avatarUrl: rawAvatar,
            gender: parsedGender,
            age: parsedAge,
            referredBy,
          }),
        });

        const syncData = await res.json();

        if (syncData.success && syncData.user) {
          if (typeof window !== 'undefined') {
            localStorage.setItem('aura_user_id', syncData.user.id);
          }
          toast({
            title: syncData.isNewUser ? '✨ 카카오 3초 가입 완료!' : '🎉 로그인 성공',
            description: `${syncData.user.name || rawNickname}님, 환영합니다!`,
          });
        } else {
          if (typeof window !== 'undefined') {
            localStorage.setItem('aura_user_id', userId);
          }
        }
      } catch (syncErr) {
        console.error('User sync warning:', syncErr);
        if (typeof window !== 'undefined') {
          localStorage.setItem('aura_user_id', userId);
        }
      }

      // 홈으로 즉시 이동
      router.replace('/');
    }

    handleAuthCallback();
  }, [router, toast]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white px-6">
      <div className="flex flex-col items-center gap-4 text-center max-w-sm">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-yellow-400/20 border border-yellow-400/40 flex items-center justify-center animate-pulse shadow-[0_0_24px_rgba(250,204,21,0.3)]">
            <span className="text-2xl font-bold text-yellow-400">💬</span>
          </div>
          <Sparkles className="w-5 h-5 text-amber-400 absolute -top-2 -right-2 animate-bounce" />
        </div>

        <h1 className="text-lg font-bold text-white flex items-center gap-2">
          <span>{t('auth_kakao_login_badge')}</span>
        </h1>

        <p className="text-xs text-zinc-400 leading-relaxed">
          {statusMessage}
        </p>

        <div className="flex items-center gap-2 text-xs text-amber-400 mt-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{t('auth_please_wait')}</span>
        </div>
      </div>
    </div>
  );
}
