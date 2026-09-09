'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useUser } from '@/contexts/user-context';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { useRouter, usePathname } from 'next/navigation';
import type { Match, User } from '@/lib/types';
import { useLanguage } from '@/contexts/language-context';
import { fetchUserProfile, getClient } from '@/lib/supabaseDataService';

export function NewMessageToast() {
  const { user: currentUser, matches } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();

  const lastTimestampRef = useRef<Map<string, number>>(new Map());
  const isInitialLoad = useRef(true);

  const renderMessageToast = useCallback((matchId: string, sender: Partial<User>, text?: string) => {
    if (!currentUser) return;
    if (pathname === `/chat/${matchId}`) return;

    const senderName = sender.name || '대화 상대';
    const messageText = text || '새로운 메시지가 도착했습니다.';

    toast({
      duration: 5000,
      title: t('new_message_title').replace('%s', senderName),
      description: (
        <div 
          className="w-full mt-2 cursor-pointer" 
          onClick={() => router.push(`/chat/${matchId}`)}
        >
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={sender.photoUrls?.[0]} alt={senderName} />
              <AvatarFallback>{senderName.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="truncate">{messageText}</span>
          </div>
        </div>
      ),
    });
  }, [currentUser, pathname, router, toast, t]);

  // 1. Listen to instant WebSocket Realtime Broadcast
  useEffect(() => {
    if (!currentUser?.id) return;
    const client = getClient();

    const alertChannel = client
      .channel(`user_alerts_msg_${currentUser.id}`)
      .on('broadcast', { event: 'alert' }, ({ payload }) => {
        if (payload?.type === 'message' && payload.matchId) {
          if (payload.sender && payload.sender.id !== currentUser.id) {
            renderMessageToast(payload.matchId, payload.sender, payload.text);
          }
        }
      })
      .subscribe();

    return () => {
      client.removeChannel(alertChannel);
    };
  }, [currentUser?.id, renderMessageToast]);

  // 2. Also watch `matches` array updates from user-context
  useEffect(() => {
    if (!matches || !currentUser) return;

    const getMillis = (ts: any): number => {
      if (!ts) return 0;
      if (typeof ts.toMillis === 'function') return ts.toMillis();
      if (typeof ts.toDate === 'function') return ts.toDate().getTime();
      return new Date(ts).getTime() || 0;
    };

    if (isInitialLoad.current) {
      matches.forEach(m => {
        if (m.lastMessageTimestamp) {
          lastTimestampRef.current.set(m.id, getMillis(m.lastMessageTimestamp));
        }
      });
      isInitialLoad.current = false;
      return;
    }
    
    matches.forEach(async (match) => {
      const newTime = getMillis(match.lastMessageTimestamp);
      const oldTime = lastTimestampRef.current.get(match.id) || 0;
      
      if (newTime > oldTime) {
        lastTimestampRef.current.set(match.id, newTime);
        if (match.lastMessageSenderId && match.lastMessageSenderId !== currentUser.id && pathname !== `/chat/${match.id}`) {
          const sender = await fetchUserProfile(match.lastMessageSenderId);
          if (sender) {
            renderMessageToast(match.id, sender, match.lastMessage);
          }
        }
      }
    });

  }, [matches, currentUser, pathname, renderMessageToast]);

  return null;
}
