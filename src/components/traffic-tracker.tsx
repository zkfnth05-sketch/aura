'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { logTrafficVisit } from '@/lib/supabaseDataService';

export function TrafficTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // 관리자 페이지 자체의 이동은 외부 유입 통계에 집계하지 않음
    if (pathname && pathname.startsWith('/admin')) {
      return;
    }

    try {
      const storageKey = 'aura_traffic_session_v1';
      const lastLogged = sessionStorage.getItem(storageKey);
      
      // 동일 브라우저 탭 세션에서 이미 기록된 경우 중복 기록 방지
      if (lastLogged) {
        return;
      }

      // 고유 세션 ID 생성
      let sessionId = localStorage.getItem('aura_anon_uid');
      if (!sessionId) {
        sessionId = 'sess_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
        localStorage.setItem('aura_anon_uid', sessionId);
      }

      const referrer = typeof document !== 'undefined' ? document.referrer : '';
      const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
      const utmSource = urlParams.get('utm_source')?.toLowerCase() || '';
      const inviteRef = urlParams.get('ref') || urlParams.get('invite') || '';
      const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';

      // 기기 판별
      let device: 'mobile' | 'desktop' | 'tablet' = 'mobile';
      if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
        device = 'tablet';
      } else if (!/Mobile|Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
        device = 'desktop';
      }

      // 유입 채널 판별 엔진
      let channel = '기타 다이렉트 / 북마크';
      let channel_category: 'search' | 'sns' | 'messenger' | 'community' | 'direct' = 'direct';

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

      // 비동기 방문 기록 전송
      logTrafficVisit({
        session_id: sessionId,
        path: pathname || '/',
        referrer: referrer || 'Direct',
        channel,
        channel_category,
        device,
      });

      sessionStorage.setItem(storageKey, Date.now().toString());
    } catch (e) {
      // Ignore background analytics tracking errors
    }
  }, [pathname]);

  return null;
}
