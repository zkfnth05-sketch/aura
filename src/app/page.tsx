'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import HomePageClient from '@/components/home-page-client';
import GuestPreviewExperience from '@/components/guest-preview-experience';
import SplashScreen from '@/components/splash-screen';
import { useUser } from '@/contexts/user-context';
import { supabase } from '@/lib/supabaseClient';
import { fromSupabaseUser } from '@/lib/supabaseMappers';

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { authUser, isLoaded, user, isSignupFlowActive } = useUser();
  const [autoReviewDone, setAutoReviewDone] = useState(false);

  // 구글 심사관 자동 로그인: ?auto_review=1 파라미터 감지 (Google Play 절대 수칙)
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
      if (authUser && !user) {
        // If authenticated but no profile data exists (signup incomplete),
        // redirect to the profile creation page.
        router.replace('/signup/profile');
      }
    }
  }, [authUser, isLoaded, user, router, isSignupFlowActive]);

  // Show a splash screen while loading authentication state
  if (!isLoaded) {
    return <SplashScreen />;
  }

  // If in the middle of active signup flow without completed profile
  if (isSignupFlowActive && !user) {
    return <SplashScreen />;
  }

  // If authenticated and user profile exists -> Full Regular App Interface
  if (authUser && user) {
    return <HomePageClient />;
  }

  // If NOT authenticated -> High-Converting VIP Guest Preview Swiping Experience!
  return <GuestPreviewExperience />;
}

