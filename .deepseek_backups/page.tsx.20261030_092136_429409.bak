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

  // 🎯 [구글 심사관 0.1초 프리패스 자동 로그인]
  // TWA 시작 주소(?auto_review=1) 진입 시 즉시 'user_821012345678'(테스트 계정)로 자동 바인딩
  useEffect(() => {
    const isAutoReview = searchParams.get('auto_review') === '1';
    if (isAutoReview) {
      const currentLocalId = typeof window !== 'undefined' ? localStorage.getItem('aura_user_id') : null;
      if (currentLocalId !== 'user_821012345678') {
        localStorage.setItem('aura_user_id', 'user_821012345678');
        localStorage.setItem('aura_temp_uid', 'user_821012345678');
        localStorage.setItem('aura_signup_phone', '+821012345678');
        window.location.href = '/?auto_review=1';
      }
    }
  }, [searchParams]);

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
  if (user) {
    return <HomePageClient />;
  }

  // If NOT authenticated -> High-Converting VIP Guest Preview Swiping Experience!
  return <GuestPreviewExperience />;
}

