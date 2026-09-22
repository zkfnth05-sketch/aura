'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/components/layout/header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import type { User } from '@/lib/types';
import { useUser } from '@/contexts/user-context';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/language-context';
import CoachMarkGuide from '@/components/coach-mark-guide';
import { hotGuide } from '@/lib/coachmark-steps';
import { supabase } from '@/lib/supabaseClient';
import { fromSupabaseUser } from '@/lib/supabaseMappers';
import { GuestGateModal } from '@/components/guest-gate-modal';

const UserCard = React.memo(({ user }: { user: User }) => {
  // Defensive check for photoUrls
  if (!user.photoUrls || user.photoUrls.length === 0) {
    return null;
  }

  return (
    <Link
      href={`/users/${user.id}`}
      prefetch={true}
    >
      <Card className="overflow-hidden relative group cursor-pointer border-none aspect-[3/4]">
        <Image
          src={user.photoUrls[0]}
          alt={`Profile of ${user.name}`}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          data-ai-hint="person portrait"
        />
        <div className="absolute bottom-0 left-0 right-0 p-3 text-white [text-shadow:0_2px_4px_rgba(0,0,0,0.7)]">
          <p className="font-semibold truncate">{user.name}, {user.age}</p>
        </div>
      </Card>
    </Link>
  );
});
UserCard.displayName = 'UserCard';

const UserGridSkeleton = () => (
    <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="w-full aspect-[3/4] rounded-lg" />
        ))}
    </div>
);


export default function HotPage() {
  const { user: currentUser, isLoaded } = useUser();
  const { t } = useLanguage();

  const [newUsers, setNewUsers] = useState<User[]>([]);
  const [hotUsers, setHotUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    if (!currentUser || !supabase) return;
    setIsLoading(true);

    try {
      const isMale = currentUser.gender === '남성' || currentUser.gender?.toLowerCase().startsWith('m');
      const oppositeGender = isMale ? '여성' : '남성';

      // ── 🆕 NEW 탭: 반대 성별 최신 가입자 풀 (14일 제한 없이 최신순으로 20~50명 안정적 확보) ──
      const { data: newUsersData, error: newError } = await supabase
        .from('users')
        .select('*')
        .eq('gender', oppositeGender)
        .neq('id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (newError) {
        console.error("Error fetching NEW users:", newError);
      }

      const validCandidates = (newUsersData || []).map(fromSupabaseUser).filter(u =>
        u.gender === oppositeGender &&
        u.photoUrls && u.photoUrls.length > 0 &&
        !currentUser.blockedUsers?.includes(u.id) &&
        !u.blockedUsers?.includes(currentUser.id)
      );

      // 최신순 후보군에서 최대 50명 (접속 시마다 자연스러운 셔플)
      const shuffledNew = [...validCandidates].sort(() => Math.random() - 0.5);
      setNewUsers(shuffledNew.slice(0, 50));

      // ── 🔥 HOT 탭: 반대 성별 좋아요 상위 우선 + 부족 시(20~50명 미달) 좋아요 없는 회원 자동 보충(Fallback) ──
      const candidateIds = validCandidates.map(u => u.id);

      if (candidateIds.length > 0) {
        // 반대 성별 후보자들이 받은 실제 좋아요 데이터 조회
        const { data: likesData, error: likesError } = await supabase
          .from('likes')
          .select('likee_id')
          .in('likee_id', candidateIds)
          .eq('is_like', true);

        if (likesError) {
          console.error("Error fetching likes for HOT tab:", likesError);
        }

        // likee_id 별 좋아요 수 집계
        const likeCountMap: Record<string, number> = {};
        for (const row of (likesData || [])) {
          if (row.likee_id) {
            likeCountMap[row.likee_id] = (likeCountMap[row.likee_id] || 0) + 1;
          }
        }

        // 1) 좋아요를 1개 이상 받은 회원 (좋아요 많은 순으로 우선 정렬)
        const usersWithLikes = validCandidates
          .filter(u => (likeCountMap[u.id] || 0) > 0)
          .sort((a, b) => (likeCountMap[b.id] || 0) - (likeCountMap[a.id] || 0));

        // 2) 좋아요가 아직 없는 회원 (보충용 Fallback 풀)
        const usersWithoutLikes = validCandidates
          .filter(u => (likeCountMap[u.id] || 0) === 0);

        // 목표 인원: 최대 50명 (최소 20명 이상 항상 확보)
        const TARGET_HOT_COUNT = 50;
        let selectedHotUsers: User[] = [...usersWithLikes];

        // 좋아요 받은 회원이 목표치에 미달할 경우, 좋아요를 받지 못한 회원으로 자동 채움
        if (selectedHotUsers.length < TARGET_HOT_COUNT) {
          const needed = TARGET_HOT_COUNT - selectedHotUsers.length;
          const shuffledWithoutLikes = [...usersWithoutLikes].sort(() => Math.random() - 0.5);
          selectedHotUsers.push(...shuffledWithoutLikes.slice(0, needed));
        }

        // 접속할 때마다 다른 순서로 신선하게 노출 (최대 50명, 최소 20명 이상)
        const shuffledHot = [...selectedHotUsers].sort(() => Math.random() - 0.5);
        setHotUsers(shuffledHot.slice(0, 50));
      } else {
        setHotUsers([]);
      }

    } catch (error) {
      console.error("Error fetching HOT/NEW users:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (isLoaded && currentUser) {
      fetchUsers();
    }
  }, [isLoaded, currentUser, fetchUsers]);
  

  if (!isLoaded) {
    return (
      <div className="flex flex-col h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </main>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex flex-col h-screen">
        <Header />
        <GuestGateModal isOpen={true} featureName="HOT 인기 회원 탐색" />
      </div>
    );
  }
  
  return (
    <div className="flex flex-col min-h-screen">
      <CoachMarkGuide guide={hotGuide} />
      <Header />
      <main>
        <Tabs defaultValue="new" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-transparent p-0 rounded-none h-14">
            <TabsTrigger 
              value="new" 
              className="rounded-none data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary bg-transparent text-muted-foreground text-sm font-bold"
            >
              {t('new_users_tab')}
            </TabsTrigger>
            <TabsTrigger 
              value="hot"
              className="rounded-none data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary bg-transparent text-muted-foreground text-sm font-bold"
            >
              {t('hot_nav')}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="new" className="mt-0 p-4 pb-4">
            {isLoading ? (
                <UserGridSkeleton />
            ) : (
              <div className="grid grid-cols-2 gap-4">
                  {newUsers.map((user) => (
                      <UserCard key={`new-${user.id}`} user={user} />
                  ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="hot" className="mt-0 p-4 pb-4">
            {isLoading ? (
              <UserGridSkeleton />
            ) : (
              <div className="grid grid-cols-2 gap-4">
                  {hotUsers.map((user) => (
                      <UserCard key={`hot-${user.id}`} user={user} />
                  ))}
              </div>
            )}
          </TabsContent>

        </Tabs>
      </main>
    </div>
  );
}
