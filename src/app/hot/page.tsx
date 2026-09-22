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

      // ── 🆕 뉴 탭: 최근 14일 신규 가입자 풀 → 랜덤 셔플 → 50명 ──
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

      const { data: newUsersData, error: newError } = await supabase
        .from('users')
        .select('*')
        .eq('gender', oppositeGender)
        .neq('id', currentUser.id)
        .gte('created_at', twoWeeksAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(200);

      if (newError) {
        console.error("Error fetching NEW users:", newError);
      }

      const newFiltered = (newUsersData || []).map(fromSupabaseUser).filter(u =>
        u.gender === oppositeGender &&
        u.photoUrls && u.photoUrls.length > 0 &&
        !currentUser.blockedUsers?.includes(u.id) &&
        !u.blockedUsers?.includes(currentUser.id)
      );

      const shuffledNew = [...newFiltered].sort(() => Math.random() - 0.5);
      setNewUsers(shuffledNew.slice(0, 50));

      // ── 🔥 HOT 탭: 실제 좋아요 수 Top 50 → 셔플 ──
      const { data: likesData, error: likesError } = await supabase
        .from('likes')
        .select('likee_id')
        .eq('is_like', true);

      if (likesError) {
        console.error("Error fetching likes:", likesError);
      }

      // likee_id 별 좋아요 수 집계
      const likeCountMap: Record<string, number> = {};
      for (const row of (likesData || [])) {
        if (row.likee_id) {
          likeCountMap[row.likee_id] = (likeCountMap[row.likee_id] || 0) + 1;
        }
      }

      // 좋아요 많은 순 Top 50 ID 추출
      const topLikedIds = Object.entries(likeCountMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 50)
        .map(([id]) => id);

      if (topLikedIds.length > 0) {
        const { data: hotUsersData, error: hotError } = await supabase
          .from('users')
          .select('*')
          .in('id', topLikedIds)
          .eq('gender', oppositeGender)
          .neq('id', currentUser.id);

        if (hotError) {
          console.error("Error fetching HOT users:", hotError);
        }

        const hotFiltered = (hotUsersData || []).map(fromSupabaseUser).filter(u =>
          u.gender === oppositeGender &&
          u.photoUrls && u.photoUrls.length > 0 &&
          !currentUser.blockedUsers?.includes(u.id) &&
          !u.blockedUsers?.includes(currentUser.id)
        );

        // 접속할 때마다 다른 순서로 노출
        const shuffledHot = [...hotFiltered].sort(() => Math.random() - 0.5);
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
