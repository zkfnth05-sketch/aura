'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useUser } from '@/contexts/user-context';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { useRouter, usePathname } from 'next/navigation';
import type { Match } from '@/lib/types';
import { useLanguage } from '@/contexts/language-context';
import { fetchUserProfile } from '@/lib/supabaseDataService';

export function NewMessageToast() {
  const { user: currentUser, matches } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();

  const lastTimestampRef = useRef<Map<string, number>>(new Map());
  const isInitialLoad = useRef(true);

  const showToastForMatch = useCallback(async (match: Match) => {
    if (!currentUser || !match.lastMessageSenderId) return;
    if (match.lastMessageSenderId === currentUser.id) return;
    if (pathname === `/chat/${match.id}`) return;

    try {
      const sender = await fetchUserProfile(match.lastMessageSenderId);
      if (sender) {
        toast({
          duration: 5000,
          title: t('new_message_title').replace('%s', sender.name),
          description: (
            <div 
              className="w-full mt-2 cursor-pointer" 
              onClick={() => router.push(`/chat/${match.id}`)}
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={sender.photoUrls?.[0]} alt={sender.name} />
                  <AvatarFallback>{sender.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="truncate">{match.lastMessage}</span>
              </div>
            </div>
          ),
        });
      }
    } catch (error) {
      console.error("Error fetching sender for new message toast:", error);
    }
  }, [currentUser, pathname, router, toast, t]);

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
    
    matches.forEach(match => {
      const newTime = getMillis(match.lastMessageTimestamp);
      const oldTime = lastTimestampRef.current.get(match.id) || 0;
      
      if (newTime > oldTime) {
        showToastForMatch(match);
        lastTimestampRef.current.set(match.id, newTime);
      }
    });

  }, [matches, currentUser, showToastForMatch]);

  return null;
}
