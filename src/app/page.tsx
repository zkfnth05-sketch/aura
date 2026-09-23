'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import HomePageClient from '@/components/home-page-client';
import SplashScreen from '@/components/splash-screen';
import { useUser } from '@/contexts/user-context';
import { supabase } from '@/lib/supabaseClient';
import { fromSupabaseUser } from '@/lib/supabaseMappers';


export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { authUser, isLoaded, user, isSignupFlowActive } = useUser();
  const [autoReviewDone, setAutoReviewDone] = useState(false);

  // 구글 심사관 자동 로그인: ?auto_review=1 파라미터 감지
  useEffect(() => {
    if (autoReviewDone) return;
    const isAutoReview = searchParams.get('auto_review') === '1';
    if (!isAutoReview) return;

    // 이미 로그인되어 있으면 스킵
    if (typeof window !== 'undefined' && localStorage.getItem('aura_user_id')) {
      setAutoReviewDone(true);
      return;
    }

    // DB에서 테스트 계정(phone_number에 12345678 포함) 검색 후 자동 로그인
    const autoLogin = async () => {
      try {
        if (!supabase) {
          setAutoReviewDone(true);
          return;
        }

        const { data } = await supabase
          .from('users')
          .select('*')
          .ilike('phone_number', '%12345678%')
          .limit(1)
          .maybeSingle();

        if (data) {
          const testUser = fromSupabaseUser(data);
          localStorage.setItem('aura_user_id', testUser.id);
          localStorage.removeItem('aura_temp_uid');
          window.location.href = '/';  // 파라미터 없이 새로고침하여 정상 로그인 진입
          return;
        }
      } catch (err) {
        console.error('Auto review login error:', err);
      }
      setAutoReviewDone(true);
    };

    autoLogin();
  }, [searchParams, autoReviewDone]);

  useEffect(() => {
    // Wait until authentication state is fully loaded.
    if (isLoaded) {
      if (isSignupFlowActive) {
        // If we are in the middle of signup, don't redirect anywhere.
        return;
      }
      if (!authUser) {
        // 1. If no user is authenticated, redirect to the signup page.
        // 단, auto_review 처리 중이면 리다이렉트하지 않음
        if (searchParams.get('auto_review') === '1' && !autoReviewDone) return;
        router.replace('/signup');
      } else if (authUser && !user) {
        // 2. If authenticated but no profile data exists (signup incomplete),
        // redirect to the profile creation page.
        router.replace('/signup/profile');
      }
      // 3. If authUser and user both exist, do nothing and let the component render HomePageClient.
    }
  }, [authUser, isLoaded, user, router, isSignupFlowActive, searchParams, autoReviewDone]);

  // Show a splash screen while loading or redirecting.
  // This prevents the main interface from flashing before the redirect happens.
  if (!isLoaded || (isSignupFlowActive && !user) || (!isSignupFlowActive && (!authUser || !user))) {
    return <SplashScreen />;
  }
  
  // If user has completed signup, show the main app interface.
  return <HomePageClient />;
}
