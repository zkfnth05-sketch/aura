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

  // [구글 심사 승인 완료] 일반 고객 정상 진입: 게스트 체험 및 SMS 본인인증 회원가입 활성화
  // 심사 통과 이후 모든 유저는 정상적인 온보딩/회원가입 프로세스를 거칩니다.

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

