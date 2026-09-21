'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { logTrafficVisit } from '@/lib/supabaseDataService';

export function TrafficTracker() {
  const pathname = usePathname();
  const lastLoggedRef = useRef<{ path: string; timestamp: number }>({ path: '', timestamp: 0 });

  useEffect(() => {
    // 관리자 페이지 자체의 이동은 외부 유입 통계에 집계하지 않음
    if (!pathname || pathname.startsWith('/admin')) {
      return;
    }

    const now = Date.now();
    // 동일 경로에 대해 2초 이내 중복 트리거(React StrictMode/리렌더링) 방지
    if (lastLoggedRef.current.path === pathname && (now - lastLoggedRef.current.timestamp) < 2000) {
      return;
    }
    lastLoggedRef.current = { path: pathname, timestamp: now };

    try {
      // 1. 고유 방문자 식별자 (UV 기준 - 로컬스토리지 영구 보존)
      let sessionId = typeof window !== 'undefined' ? localStorage.getItem('aura_anon_uid') : null;
      if (!sessionId) {
        sessionId = 'sess_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
        if (typeof window !== 'undefined') {
          localStorage.setItem('aura_anon_uid', sessionId);
        }
      }

      // 2. 세션 내 최초 유입 채널 보존 (세션 스토리지)
      let channel = typeof window !== 'undefined' ? sessionStorage.getItem('aura_traffic_channel') : null;
      let channel_category: 'search' | 'sns' | 'messenger' | 'community' | 'direct' = 
        (typeof window !== 'undefined' ? sessionStorage.getItem('aura_traffic_cat') as any : null) || 'direct';
      let referrer = typeof window !== 'undefined' ? (sessionStorage.getItem('aura_traffic_ref') || document.referrer) : '';

      // 최초 세션 진입인 경우 채널 감지 및 세션 스토리지 저장
      if (!channel) {
        referrer = typeof document !== 'undefined' ? document.referrer : '';
        const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
        const utmSource = urlParams.get('utm_source')?.toLowerCase() || '';
        const inviteRef = urlParams.get('ref') || urlParams.get('invite') || '';
        const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';

        channel = '기타 다이렉트 / 북마크';
        channel_category = 'direct';

        const refLower = referrer.toLowerCase();

        if (inviteRef || utmSource.includes('invite') || utmSource.includes('friend')) {
          channel = '지인 초대 (친구추천 링크)';
          channel_category = 'messenger';
        } else if (refLower.includes('naver.com') || utmSource.includes('naver')) {
          channel = '네이버 (검색/블로그/카페)';
          channel_category = 'search';
        } else if (refLower.includes('google.') || utmSource.includes('google')) {
          channel = '구글 (Google 다국어 검색)';
          channel_category = 'search';
        } else if (refLower.includes('kakao') || userAgent.includes('KAKAOTALK') || utmSource.includes('kakao')) {
          channel = '카카오톡 (오픈채팅/알림톡)';
          channel_category = 'messenger';
        } else if (refLower.includes('tiktok.com') || utmSource.includes('tiktok')) {
          channel = '틱톡 (TikTok 바이럴)';
          channel_category = 'sns';
        } else if (refLower.includes('instagram.com') || utmSource.includes('instagram')) {
          channel = '인스타그램 (릴스/스토리)';
          channel_category = 'sns';
        } else if (refLower.includes('threads.net') || utmSource.includes('threads')) {
          channel = '스레드 (Threads)';
          channel_category = 'sns';
        } else if (refLower.includes('reddit.com') || refLower.includes('redd.it') || utmSource.includes('reddit')) {
          channel = '레딧 (Reddit)';
          channel_category = 'community';
        } else if (refLower.includes('t.me') || refLower.includes('telegram') || utmSource.includes('telegram')) {
          channel = '텔레그램 (Telegram 채널)';
          channel_category = 'messenger';
        } else if (refLower.includes('tistory.com') || utmSource.includes('tistory')) {
          channel = '티스토리 (블로그 리뷰)';
          channel_category = 'community';
        } else if (refLower.includes('youtube.com') || refLower.includes('youtu.be') || utmSource.includes('youtube')) {
          channel = '유튜브 (소개 영상/링크)';
          channel_category = 'sns';
        } else if (refLower.includes('facebook.com') || utmSource.includes('facebook')) {
          channel = '페이스북 (Facebook 커뮤니티)';
          channel_category = 'sns';
        } else if (refLower.includes('twitter.com') || refLower.includes('x.com') || refLower.includes('t.co') || utmSource.includes('twitter')) {
          channel = 'X (트위터 실시간 트렌드)';
          channel_category = 'sns';
        } else if (refLower.length > 0) {
          channel = '기타 웹사이트 유입';
          channel_category = 'community';
        }

        if (typeof window !== 'undefined') {
          sessionStorage.setItem('aura_traffic_channel', channel);
          sessionStorage.setItem('aura_traffic_cat', channel_category);
          if (referrer) sessionStorage.setItem('aura_traffic_ref', referrer);
        }
      }

      // 기기 판별
      const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
      let device: 'mobile' | 'desktop' | 'tablet' = 'mobile';
      if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
        device = 'tablet';
      } else if (!/Mobile|Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
        device = 'desktop';
      }

      // 비동기 방문/페이지뷰 기록 Supabase 전송
      logTrafficVisit({
        session_id: sessionId,
        path: pathname || '/',
        referrer: referrer || 'Direct',
        channel: channel || '기타 다이렉트 / 북마크',
        channel_category,
        device,
      });
    } catch (e) {
      // Ignore background analytics tracking errors
    }
  }, [pathname]);

  return null;
}
