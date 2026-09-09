'use client';

import { useEffect, useCallback } from 'react';
import { useUser } from '@/contexts/user-context';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { fetchUserProfile, getClient } from '@/lib/supabaseDataService';
import Link from 'next/link';
import { useLanguage } from '@/contexts/language-context';
import type { User } from '@/lib/types';

export function NewLikeToast() {
  const { user: currentUser } = useUser();
  const { toast } = useToast();
  const { t } = useLanguage();

  const showLikeAlert = useCallback((liker: Partial<User>) => {
    if (!liker?.id) return;
    toast({
      duration: 5000,
      title: t('new_like_title'),
      description: (
        <Link href={`/users/${liker.id}`} className="w-full">
          <div className="flex items-center gap-3 mt-2 cursor-pointer">
            <Avatar className="h-10 w-10">
              <AvatarImage src={liker.photoUrls?.[0]} alt={liker.name} />
              <AvatarFallback>{liker.name?.charAt(0) || '?'}</AvatarFallback>
            </Avatar>
            <span>{(t('new_like_desc') || '').replace('%s', liker.name || '누군가')}</span>
          </div>
        </Link>
      ),
    });
  }, [toast, t]);

  useEffect(() => {
    if (!currentUser?.id) return;
    const client = getClient();

    // 1. Listen to instant WebSocket Realtime Broadcast (sub-50ms latency)
    const alertChannel = client
      .channel(`user_alerts_${currentUser.id}`)
      .on('broadcast', { event: 'alert' }, async ({ payload }) => {
        if (payload?.type === 'like') {
          if (payload.liker) {
            showLikeAlert(payload.liker);
          } else if (payload.likerId) {
            const liker = await fetchUserProfile(payload.likerId);
            if (liker) showLikeAlert(liker);
          }
        }
      })
      .subscribe();

    // 2. Fallback: postgres_changes on likes table
    const tableChannel = client
      .channel(`new-like-toast-${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'likes',
          filter: `likee_id=eq.${currentUser.id}`,
        },
        async (payload) => {
          const row = payload.new as any;
          if (!row || !row.is_like || !row.liker_id) return;
          try {
            const liker = await fetchUserProfile(row.liker_id);
            if (liker) {
              showLikeAlert(liker);
            }
          } catch (e) {
            console.error('Error showing like toast:', e);
          }
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(alertChannel);
      client.removeChannel(tableChannel);
    };
  }, [currentUser?.id, showLikeAlert]);

  return null;
}
