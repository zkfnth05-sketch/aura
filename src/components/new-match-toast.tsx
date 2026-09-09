'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useUser } from '@/contexts/user-context';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import Link from 'next/link';
import type { Match } from '@/lib/types';
import { useLanguage } from '@/contexts/language-context';
import { usePathname } from 'next/navigation';
import { fetchUserProfile } from '@/lib/supabaseDataService';

export function NewMatchToast() {
  const { user: currentUser, matches } = useUser();
  const { toast } = useToast();
  const { t } = useLanguage();
  const pathname = usePathname();

  const knownMatchIds = useRef<Set<string>>(new Set());
  const isInitialLoad = useRef(true);

  const showMatchToast = useCallback(async (match: Match) => {
    if (!currentUser) return;
    if (pathname === `/chat/${match.id}`) return;

    const otherUserId = match.users.find(id => id !== currentUser.id);
    if (!otherUserId) return;

    try {
      const otherUser = await fetchUserProfile(otherUserId);
      if (otherUser) {
        toast({
          duration: 5000,
          title: t('new_match_title'),
          description: (
            <Link href={`/chat/${match.id}`} className="w-full">
              <div className="flex items-center gap-3 mt-2 cursor-pointer">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={otherUser.photoUrls?.[0]} alt={otherUser.name} />
                  <AvatarFallback>{otherUser.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <span>{t('new_match_desc').replace('%s', otherUser.name)}</span>
              </div>
            </Link>
          ),
        });
      }
    } catch (e) {
      console.error("Failed to show match toast", e);
    }
  }, [currentUser, toast, t, pathname]);

  useEffect(() => {
    if (!matches || !currentUser) return;

    if (isInitialLoad.current) {
      matches.forEach(m => knownMatchIds.current.add(m.id));
      isInitialLoad.current = false;
      return;
    }

    matches.forEach(m => {
      if (!knownMatchIds.current.has(m.id)) {
        knownMatchIds.current.add(m.id);
        showMatchToast(m);
      }
    });
  }, [matches, currentUser, showMatchToast]);

  return null;
}
