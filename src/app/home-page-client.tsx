
'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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


const PREFETCH_THRESHOLD = 5;
const FETCH_LIMIT = 20; // Fetch more to account for client-side filtering

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
  } = useUser();
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
    if (!currentUser) return;
    if ((isLoadingMoreRef.current || !hasMoreRef.current) && !isInitial) {
      return;
    }
    
    isLoadingMoreRef.current = true;
    if (isInitial) {
      setIsRecommendedUsersLoading(true);
    }
    
    try {
      const candidates = await fetchDiscoverUsers(currentUser.id, filters, 30);
      if (candidates.length === 0) {
        hasMoreRef.current = false;
      }
      setRecommendedUsers(prev => {
        if (isInitial) return candidates;
        const existingIds = new Set(prev.map(u => u.id));
        const unique = candidates.filter(u => !existingIds.has(u.id));
        return [...prev, ...unique];
      });
    } catch (e) {
      console.error("Error fetching recommended users:", e);
    } finally {
      isLoadingMoreRef.current = false;
      if (isInitial) {
        setIsRecommendedUsersLoading(false);
      }
    }
  }, [currentUser, filters]);

  const initializeRecommendations = useCallback(() => {
    if (!isLoaded || !currentUser || peopleILiked === null) return;

    setIsRecommendedUsersLoading(true);
    setRecommendedUsers([]);
    setCurrentIndex(0);
    hasMoreRef.current = true;
    
    fetchNextRecommendedUsers(true);
  }, [isLoaded, currentUser, peopleILiked, fetchNextRecommendedUsers]);

  useEffect(() => {
    const currentFiltersJSON = JSON.stringify(filters);
    if (isLoaded && currentUser && peopleILiked !== null) {
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

  const handleSwipe = (direction: 'left' | 'right') => {
    if (!activeUser || swipeState) return;
    setSwipeState(direction);
  
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      setSwipeState(null);
    }, 400); // Animation time
  };

  const { toast } = useToast();

  const handleAction = async (action: 'like' | 'dislike' | 'message') => {
    if (!currentUser || !activeUser || swipeState) return;
  
    const targetUserId = activeUser.id;
  
    if (action === 'message') {
      if (isAlreadyMatched) {
        router.push(`/chat/${isAlreadyMatched.id}`);
        return;
      }
      
      const res = await recordSwipe(currentUser.id, targetUserId, true);
      const matchId = res.match ? res.match.id : [currentUser.id, targetUserId].sort().join('_');
      router.push(`/chat/${matchId}`);
      return;
    }
  
    const direction = action === 'dislike' ? 'left' : 'right';
    setSwipeState(direction);
  
    recordSwipe(currentUser.id, targetUserId, action === 'like').then((result) => {
      if (result.isMatch) {
        toast({
          title: "🎉 매칭 성공!",
          description: `${activeUser.name}님과 서로 호감을 표시했습니다!`,
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
  
  const isLikedByMe = peopleILiked?.some(u => u.id === activeUser?.id);
  
  const isReallyLoading = !isLoaded || isLikesLoading || (isRecommendedUsersLoading && recommendedUsers.length === 0);

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
      <main className="relative flex-1 flex items-center justify-center p-4">
        <div className="relative w-full aspect-[3/4.5] max-w-[400px] perspective-1000">
          {visibleCards.length > 0 ? (
            visibleCards.map((user, index) => {
              const isTop = index === 1;
              
              return (
                <ProfileCard
                  key={user.id}
                  currentUser={currentUser!}
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
