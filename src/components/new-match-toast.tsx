'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useUser } from '@/contexts/user-context';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import Link from 'next/link';
import type { Match, User } from '@/lib/types';
import { useLanguage } from '@/contexts/language-context';
import { usePathname } from 'next/navigation';
import { fetchUserProfile, getClient } from '@/lib/supabaseDataService';

export function NewMatchToast() {
  const { user: currentUser, matches } = useUser();
  const { toast } = useToast();
  const { t } = useLanguage();
  const pathname = usePathname();

  const knownMatchIds = useRef<Set<string>>(new Set());
  const isInitialLoad = useRef(true);

  const renderMatchToast = useCallback((matchId: string, otherUser: Partial<User>) => {
    if (!currentUser) return;
    if (pathname === `/chat/${matchId}`) return;

    toast({
      duration: 5000,
      title: t('new_match_title'),
      description: (
        <Link href={`/chat/${matchId}`} className="w-full">
          <div className="flex items-center gap-3 mt-2 cursor-pointer">
            <Avatar className="h-10 w-10">
              <AvatarImage src={otherUser.photoUrls?.[0]} alt={otherUser.name} />
              <AvatarFallback>{otherUser.name?.charAt(0) || '?'}</AvatarFallback>
            </Avatar>
            <span>{(t('new_match_desc') || '').replace('%s', otherUser.name || '상대방')}</span>
          </div>
        </Link>
      ),
    });
  }, [currentUser, pathname, toast, t]);

  const showMatchToast = useCallback(async (match: Match) => {
    if (!currentUser) return;
    const otherUserId = match.users.find(id => id !== currentUser.id);
    if (!otherUserId) return;

    try {
      const otherUser = await fetchUserProfile(otherUserId);
      if (otherUser) {
        renderMatchToast(match.id, otherUser);
      }
    } catch (e) {
      console.error("Failed to show match toast", e);
    }
  }, [currentUser, renderMatchToast]);

  // 1. Listen to instant WebSocket Realtime Broadcast
  useEffect(() => {
    if (!currentUser?.id) return;
    const client = getClient();

    const alertChannel = client
      .channel(`user_alerts_match_${currentUser.id}`)
      .on('broadcast', { event: 'alert' }, ({ payload }) => {
        if (payload?.type === 'match' && payload.matchId) {
          if (knownMatchIds.current.has(payload.matchId)) return;
          knownMatchIds.current.add(payload.matchId);
          if (payload.matchedUser) {
            renderMatchToast(payload.matchId, payload.matchedUser);
          }
        }
      })
      .subscribe();

    return () => {
      client.removeChannel(alertChannel);
    };
  }, [currentUser?.id, renderMatchToast]);

  // 2. Also watch `matches` array updates from user-context
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
