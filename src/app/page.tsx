'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import HomePageClient from '@/components/home-page-client';
import GuestOnboardingView from '@/components/guest-onboarding-view';
import SplashScreen from '@/components/splash-screen';
import { useUser } from '@/contexts/user-context';

// ─────────────────────────────────────────────────────────────
// [부트스트랩 모듈] auto_review 1회성 바인딩 — 렌더 부수효과 금지
// - sessionStorage 가드로 1회성 보장 (새로고침/리다이렉트 루프 방지)
// - 리다이렉트 상한(MAX_REDIRECTS) + 루프 감지
// - localStorage 직접 쓰기는 이 모듈 내부로 격리
// ─────────────────────────────────────────────────────────────
const AUTO_REVIEW_UID = 'user_821012345678';
const AUTO_REVIEW_PHONE = '+821012345678';
const BOOTSTRAP_FLAG = 'aura_auto_review_bootstrapped';
const REDIRECT_COUNT_KEY = 'aura_auto_review_redirect_count';
const MAX_REDIRECTS = 3;

function runAutoReviewBootstrap(searchParams: URLSearchParams): boolean {
  if (typeof window === 'undefined') return false;
  if (searchParams.get('auto_review') !== '1') return false;

  // 1회성 가드: 이미 부트스트랩 완료했으면 절대 재실행/재리다이렉트 금지
  if (sessionStorage.getItem(BOOTSTRAP_FLAG) === '1') return false;

  // 루프 감지: 리다이렉트 횟수 상한 초과 시 부트스트랩 포기(무한루프 차단)
  const redirectCount = Number(sessionStorage.getItem(REDIRECT_COUNT_KEY) ?? '0');
  if (redirectCount >= MAX_REDIRECTS) {
    sessionStorage.setItem(BOOTSTRAP_FLAG, '1');
    return false;
  }

  const currentLocalId = localStorage.getItem('aura_user_id');
  if (currentLocalId === AUTO_REVIEW_UID) {
    // 이미 바인딩 완료 → 플래그만 세우고 리다이렉트 없음
    sessionStorage.setItem(BOOTSTRAP_FLAG, '1');
    return false;
  }

  localStorage.setItem('aura_user_id', AUTO_REVIEW_UID);
  localStorage.setItem('aura_temp_uid', AUTO_REVIEW_UID);
  localStorage.setItem('aura_signup_phone', AUTO_REVIEW_PHONE);
  sessionStorage.setItem(REDIRECT_COUNT_KEY, String(redirectCount + 1));
  return true; // 리다이렉트 필요 신호
}

// ─────────────────────────────────────────────────────────────
// [정책 판정] 화면 선택을 선언형으로 분리 — 액션 게이트 삽입 지점
// ─────────────────────────────────────────────────────────────
type ViewState = 'loading' | 'signup-pending' | 'app';

function resolveView(params: {
  isLoaded: boolean;
  isSignupFlowActive: boolean;
  hasUser: boolean;
}): ViewState {
  if (!params.isLoaded) return 'loading';
  if (params.isSignupFlowActive && !params.hasUser) return 'signup-pending';
  return 'app';
}

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { authUser, isLoaded, user, isSignupFlowActive } = useUser();
  const bootstrapRanRef = useRef(false);
  const [guestGender, setGuestGender] = useState<string | null>(null);

  // 로컬에 저장된 게스트 성별 로드
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('aura_guest_gender');
      if (saved) {
        setGuestGender(saved);
      }
    }
  }, []);

  // [부트스트랩] 마운트 1회만 실행 — 렌더 중 부수효과 금지
  useEffect(() => {
    if (bootstrapRanRef.current) return;
    bootstrapRanRef.current = true;

    const needsRedirect = runAutoReviewBootstrap(searchParams);
    if (needsRedirect) {
      // 선언적 리다이렉트 (전체 리로드 금지)
      router.replace('/?auto_review=1');
    }
  }, [searchParams, router]);

  // [리다이렉트] 가입 미완료 회원 → 프로필 생성 페이지
  useEffect(() => {
    if (!isLoaded) return;
    if (isSignupFlowActive) return;
    if (authUser && !user) {
      router.replace('/signup/profile');
    }
  }, [authUser, isLoaded, user, router, isSignupFlowActive]);

  const view = resolveView({
    isLoaded,
    isSignupFlowActive,
    hasUser: Boolean(user),
  });

  if (view === 'loading' || view === 'signup-pending') {
    return <SplashScreen />;
  }

  // 🎫 게스트 첫 진입(성별 미선택): 게스트 온보딩 화면(성별 선택 및 바로 시작)
  if (!user && !guestGender) {
    return (
      <GuestOnboardingView
        onStart={(gender) => {
          setGuestGender(gender);
        }}
      />
    );
  }

  // 🎫 로그인 회원 및 게스트: 100% 개방된 전체 회원 무제한 탐색 피드 직행!
  return <HomePageClient />;
}

