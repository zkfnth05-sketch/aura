'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { openMemberOnlyDialog } from '@/lib/member-only-gate';
import Header from '@/components/layout/header';
import ActionButtons from '@/components/action-buttons';
import ProfileCard from '@/components/profile-card';
import { useUser } from '@/contexts/user-context';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { User } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/language-context';
import CoachMarkGuide from '@/components/coach-mark-guide';
import { homeGuide } from '@/lib/coachmark-steps';
import { fetchDiscoverUsers, recordSwipe } from '@/lib/supabaseDataService';
import { useToast } from '@/hooks/use-toast';
import { VipWaitingBanner } from '@/components/vip-waiting-banner';
import { CURATED_GUEST_FEMALE_PROFILES, CURATED_GUEST_MALE_PROFILES } from '@/lib/guest-preview-users';


const PREFETCH_THRESHOLD = 5;
const FETCH_LIMIT = 20; // Fetch more to account for client-side filtering

// 🎫 [게스트 전면 개방] 비로그인 상태에서도 ProfileCard 가 요구하는
// currentUser: User 를 충족시키기 위한 합성 프로필 (궁합 계산 전용, DB 저장 없음)
const GUEST_VIEWER: User = {
  id: 'guest',
  name: '게스트',
  age: 0,
  gender: '기타',
  location: '',
  lat: 0,
  lng: 0,
  bio: '',
  photoUrls: [],
  hobbies: [],
  interests: [],
  values: [],
  communication: [],
  lifestyle: [],
  relationship: [],
};

const CardSkeleton = () => (
    <div className="absolute inset-0 w-full h-full">
        <Skeleton className="w-full h-full rounded-2xl" />
    </div>
);

export default function HomePageClient() {
  const { 
    user: currentUser, 
    isLoaded,
    matches,
    peopleILiked,
    isLikesLoading,
    filters,
    swipeUser,
    requireActiveAdmission,
    openActionGate,
  } = useUser();
  const { toast } = useToast();
  const { t } = useLanguage();
  
  const router = useRouter();

  const [recommendedUsers, setRecommendedUsers] = useState<User[]>([]);
  const [isRecommendedUsersLoading, setIsRecommendedUsersLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeState, setSwipeState] = useState<'left' | 'right' | null>(null);

  const hasMoreRef = useRef(true);
  const isLoadingMoreRef = useRef(false);
  const prevFiltersRef = useRef(JSON.stringify(filters));

  const fetchNextRecommendedUsers = useCallback(async (isInitial = false) => {
    if ((isLoadingMoreRef.current || !hasMoreRef.current) && !isInitial) {
      return;
    }
    
    isLoadingMoreRef.current = true;
    if (isInitial) {
      setIsRecommendedUsersLoading(true);
    }
    
    try {
      // 🎫 게스트도 동일 파이프라인 사용: currentUser 가 없으면 'guest' 로 조회
      const guestGender = typeof window !== 'undefined' ? localStorage.getItem('aura_guest_gender') : null;
      const viewerId = currentUser?.id || 'guest';
      const viewerGender = currentUser?.gender || (guestGender === '여성' ? '여성' : '남성');
      const candidates = await fetchDiscoverUsers(viewerId, filters, 30, viewerGender);

      // 🎫 게스트 폴백: DB 결과가 빈약하면 성별 맞춤 큐레이션 프로필 결합
      let merged = candidates;
      if (!currentUser) {
        const isTargetFemale = viewerGender !== '여성';
        const curatedList = isTargetFemale ? CURATED_GUEST_FEMALE_PROFILES : CURATED_GUEST_MALE_PROFILES;
        const existingIds = new Set(candidates.map(u => u.id));
        const curated = curatedList.filter(u => !existingIds.has(u.id));
        merged = [...candidates, ...curated];
      }

      if (merged.length === 0) {
        hasMoreRef.current = false;
      }
      setRecommendedUsers(prev => {
        if (isInitial) return merged;
        const existingIds = new Set(prev.map(u => u.id));
        const unique = merged.filter(u => !existingIds.has(u.id));
        return [...prev, ...unique];
      });
    } catch (e) {
      console.error("Error fetching recommended users:", e);
      // 🎫 네트워크/DB 실패 시에도 게스트 화면이 비지 않도록 큐레이션 폴백
      if (!currentUser) {
        setRecommendedUsers(prev => (prev.length > 0 ? prev : CURATED_GUEST_FEMALE_PROFILES));
      }
    } finally {
      isLoadingMoreRef.current = false;
      if (isInitial) {
        setIsRecommendedUsersLoading(false);
      }
    }
  }, [currentUser, filters]);

  const initializeRecommendations = useCallback(() => {
    // 🎫 게스트 개방: currentUser 가 없어도 isLoaded 만 충족되면 즉시 로드
    if (!isLoaded) return;
    if (currentUser && peopleILiked === null) return;

    setIsRecommendedUsersLoading(true);
    setRecommendedUsers([]);
    setCurrentIndex(0);
    hasMoreRef.current = true;
    
    fetchNextRecommendedUsers(true);
  }, [isLoaded, currentUser, peopleILiked, fetchNextRecommendedUsers]);

  useEffect(() => {
    const currentFiltersJSON = JSON.stringify(filters);
    if (!isLoaded) return;

    // 🎫 게스트 상태: currentUser 가 없어도 추천 목록이 비어있으면 즉시 초기화 로드
    if (!currentUser) {
      if (recommendedUsers.length === 0 && hasMoreRef.current && !isLoadingMoreRef.current) {
        initializeRecommendations();
      }
      return;
    }

    // 로그인 회원 상태: 좋아요 목록 확인 완료 후 초기화
    if (peopleILiked !== null) {
      if (prevFiltersRef.current !== currentFiltersJSON) {
        prevFiltersRef.current = currentFiltersJSON;
        initializeRecommendations();
      } else if (recommendedUsers.length === 0 && hasMoreRef.current && !isLoadingMoreRef.current) {
        initializeRecommendations();
      }
    }
  }, [isLoaded, currentUser, peopleILiked, filters, initializeRecommendations, recommendedUsers.length]);

  useEffect(() => {
    if (!isRecommendedUsersLoading && hasMoreRef.current && recommendedUsers.length - currentIndex <= PREFETCH_THRESHOLD) {
      fetchNextRecommendedUsers();
    }
  }, [currentIndex, recommendedUsers.length, isRecommendedUsersLoading, fetchNextRecommendedUsers]);


  const visibleCards = useMemo(() => {
    return recommendedUsers.slice(currentIndex, currentIndex + 2).reverse();
  }, [recommendedUsers, currentIndex]);

  const activeUser = recommendedUsers[currentIndex];

  const isAlreadyMatched = useMemo(() => {
    if (!matches || !activeUser) return null;
    return matches.find(m => m.users.includes(activeUser.id)) || null;
  }, [matches, activeUser]);

  const handleAction = async (action: 'like' | 'dislike' | 'message') => {
    if (!activeUser || swipeState) return;

    // 🎫 [게스트 인터셉트] 비로그인 유저: dislike 는 자유 통과, like/message 는 로그인 유도
    if (!currentUser) {
      if (action === 'dislike') {
        setSwipeState('left');
        setTimeout(() => {
          setCurrentIndex(prev => prev + 1);
          setSwipeState(null);
        }, 400);
        return;
      }

      setSwipeState(null);
      openMemberOnlyDialog(action === 'like' ? 'feature_like' : 'feature_dm_request');
      return;
    }
  
    // 대기 중인 남성 유저는 고화질 관전만 가능하며, 좋아요/메시지 시도시 VIP 모달 발동!
    if (action === 'like' || action === 'message') {
      const allowed = requireActiveAdmission(() => {}, action === 'like' ? t('action_like_profile') : t('action_send_message'));
      if (!allowed) return;
    }

    const targetUserId = activeUser.id;
  
    if (action === 'message') {
      if (isAlreadyMatched) {
        router.push(`/chat/${isAlreadyMatched.id}`);
        return;
      }
      
      const res = await swipeUser(activeUser, true);
      const matchId = res.match ? res.match.id : [currentUser.id, targetUserId].sort().join('_');
      router.push(`/chat/${matchId}`);
      return;
    }
  
    const direction = action === 'dislike' ? 'left' : 'right';
    setSwipeState(direction);
  
    swipeUser(activeUser, action === 'like').then((result) => {
      if (result.isMatch) {
        toast({
          title: t('toast_new_match'),
          description: (t('new_match_desc') || '').replace('%s', activeUser.name),
        });
      }
    }).catch(e => {
      console.error("Failed to record swipe:", e);
    });

    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      setSwipeState(null);
    }, 400); // Animation time
  };

  const handleSwipe = (direction: 'left' | 'right') => {
    handleAction(direction === 'right' ? 'like' : 'dislike');
  };
  
  const isLikedByMe = peopleILiked?.some(u => u.id === activeUser?.id);
  
  // 🎫 게스트는 peopleILiked 가 항상 null 이므로 로딩 판정에서 제외 (스켈레톤 무한루프 방지)
  const isReallyLoading = !isLoaded || (Boolean(currentUser) && isRecommendedUsersLoading && recommendedUsers.length === 0);

  if (isReallyLoading) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <CoachMarkGuide guide={homeGuide} />
      <Header />
      {currentUser?.admissionStatus === 'queued' && (
        <VipWaitingBanner
          queuePosition={currentUser.queuePosition || 1}
          onOpenInviteModal={() => openActionGate(t('feature_chat_and_match'))}
        />
      )}
      <main className="relative flex-1 flex items-center justify-center p-4">
        <div className="relative w-full aspect-[3/4.5] max-w-[400px] perspective-1000">
          {visibleCards.length > 0 ? (
            visibleCards.map((user, index) => {
              const isTop = index === 1;
              
              return (
                <ProfileCard
                  key={user.id}
                  currentUser={currentUser || GUEST_VIEWER}
                  potentialMatch={user}
                  isActive={isTop}
                  zIndex={isTop ? 50 : 20}
                  swipeState={isTop ? swipeState : null}
                  depth={isTop ? 0 : 1}
                  onSwipe={handleSwipe}
                />
              );
            })
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-card rounded-3xl shadow-sm p-6 text-center border">
                <h2 className="text-xl font-bold">{t('no_recommendations_title')}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{t('no_recommendations_subtitle')}</p>
                <Button onClick={initializeRecommendations} className="mt-4">{t('refresh_button')}</Button>
            </div>
          )}
           {(isRecommendedUsersLoading && visibleCards.length === 0) && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <CardSkeleton />
                </div>
            )}
        </div>
      </main>

      {activeUser && (
        <footer className="relative z-30 h-28 flex items-center justify-center pb-6">
            <ActionButtons 
                onDislike={() => handleAction('dislike')}
                onMessage={() => handleAction('message')}
                onLike={() => handleAction('like')}
                isLiked={isLikedByMe}
            />
        </footer>
      )}
    </div>
  );
}
