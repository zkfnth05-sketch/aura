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
      const oppositeGender = currentUser.gender === '남성' ? '여성' : '남성';

      const { data: usersData, error } = await supabase
        .from('users')
        .select('*')
        .eq('gender', oppositeGender)
        .neq('id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error("Error fetching HOT/NEW users:", error);
        return;
      }

      const users = (usersData || []).map(fromSupabaseUser).filter(u =>
        u.photoUrls && u.photoUrls.length > 0 &&
        !currentUser.blockedUsers?.includes(u.id) &&
        !u.blockedUsers?.includes(currentUser.id)
      );

      setNewUsers(users.slice(0, 20));
      setHotUsers([...users].sort(() => 0.5 - Math.random()).slice(0, 20));

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
  

  if (!isLoaded || !currentUser) {
    return (
      <div className="flex flex-col h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </main>
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
