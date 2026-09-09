
'use client';
import { useState, useEffect, useMemo } from 'react';
import Header from '@/components/layout/header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MatchList from '@/components/match-list';
import UserGrid from '@/components/user-grid';
import { useUser } from '@/contexts/user-context';
import { Loader2 } from 'lucide-react';
import type { User, Match } from '@/lib/types';
import { useLanguage } from '@/contexts/language-context';
import CoachMarkGuide from '@/components/coach-mark-guide';
import { matchesGuide } from '@/lib/coachmark-steps';
import { fetchUsersByIds } from '@/lib/supabaseDataService';

export interface MatchWithUser {
  match: Match;
  otherUser?: User;
}

export default function MatchesPage() {
  const {
    user: currentUser,
    isLoaded,
    matches,
    isMatchesLoading,
    peopleILiked,
    peopleWhoLikedMe,
    isLikesLoading,
    refreshLikes,
    refreshMatches,
  } = useUser();
  const { t } = useLanguage();
  const [otherUsersForMatches, setOtherUsersForMatches] = useState<User[]>([]);
  const [areOtherUsersLoading, setAreOtherUsersLoading] = useState(true);

  // Always refresh likes and matches when opening the matches screen
  useEffect(() => {
    refreshLikes();
    refreshMatches();
  }, [refreshLikes, refreshMatches]);

  const isChatsLoading = isMatchesLoading || areOtherUsersLoading;

  const otherUserIdsForMatches = useMemo(() => {
    if (!matches || !currentUser) return [];
    return matches.map(m => m.users.find(id => id !== currentUser.id)).filter((id): id is string => !!id);
  }, [matches, currentUser]);

  useEffect(() => {
    if (otherUserIdsForMatches.length === 0) {
      setOtherUsersForMatches([]);
      setAreOtherUsersLoading(false);
      return;
    }
    
    setAreOtherUsersLoading(true);
    fetchUsersByIds(otherUserIdsForMatches)
      .then(users => {
        setOtherUsersForMatches(users);
      })
      .catch(e => {
        console.error("Failed to fetch other users for matches:", e);
      })
      .finally(() => {
        setAreOtherUsersLoading(false);
      });
  }, [otherUserIdsForMatches]);
  
  const matchesWithUsers: MatchWithUser[] = useMemo(() => {
    if (!matches || !currentUser) return [];
    const usersById = new Map(otherUsersForMatches.map(u => [u.id, u]));
    return matches
      .map(match => {
        const otherUserId = match.users.find(id => id !== currentUser.id);
        const otherUser = otherUserId ? usersById.get(otherUserId) : undefined;
        return { match, otherUser };
      })
      .filter(item => item.otherUser); // Filter out matches where other user was not found (e.g., deleted account)
  }, [matches, currentUser, otherUsersForMatches]);

  // Memoize unique users to prevent re-calculation on every render
  const uniquePeopleWhoLikedMe = useMemo(() => {
    if (!peopleWhoLikedMe) return [];
    return Array.from(new Map(peopleWhoLikedMe.map(user => [user.id, user])).values());
  }, [peopleWhoLikedMe]);

  const uniquePeopleILiked = useMemo(() => {
    if (!peopleILiked) return [];
    return Array.from(new Map(peopleILiked.map(user => [user.id, user])).values());
  }, [peopleILiked]);


  if (!isLoaded || !currentUser) {
    return (
        <div className="flex flex-col h-screen">
          <Header />
          <main className="flex-1 flex justify-center items-center pt-20">
            <Loader2 className="h-8 w-8 animate-spin" />
          </main>
        </div>
    );
  }
  
  return (
    <div className="flex flex-col min-h-screen">
      <CoachMarkGuide guide={matchesGuide} />
      <Header />
      <main>
        <Tabs defaultValue="chats" onValueChange={() => { refreshLikes(); refreshMatches(); }} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-transparent p-0 rounded-none h-14">
            <TabsTrigger
              value="chats"
              className="rounded-none data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary bg-transparent text-muted-foreground text-sm font-bold"
            >
              {t('chats_tab')}
            </TabsTrigger>
            <TabsTrigger
              value="liked-me"
              className="rounded-none data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary bg-transparent text-muted-foreground text-sm font-bold"
            >
              {t('liked_me_tab')}
            </TabsTrigger>
            <TabsTrigger
              value="i-liked"
              className="rounded-none data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary bg-transparent text-muted-foreground text-sm font-bold"
            >
              {t('i_liked_tab')}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="chats" className="mt-0 p-4 pb-4">
            {isChatsLoading ? <div className="flex justify-center items-center pt-20"><Loader2 className="h-8 w-8 animate-spin" /></div> : <MatchList matchesWithUsers={matchesWithUsers} />}
          </TabsContent>
          <TabsContent value="liked-me" className="mt-0 p-4 pb-4">
             {isLikesLoading ? <div className="flex justify-center items-center pt-20"><Loader2 className="h-8 w-8 animate-spin" /></div> : <UserGrid users={uniquePeopleWhoLikedMe} />}
          </TabsContent>
          <TabsContent value="i-liked" className="mt-0 p-4 pb-4">
            {isLikesLoading ? <div className="flex justify-center items-center pt-20"><Loader2 className="h-8 w-8 animate-spin" /></div> : <UserGrid users={uniquePeopleILiked} />}
          </TabsContent>
            
        </Tabs>
      </main>
    </div>
  );
}
