'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useUser } from '@/contexts/user-context';
import { useToast } from '@/hooks/use-toast';
import { Button } from './ui/button';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { useRouter } from 'next/navigation';
import type { Match } from '@/lib/types';
import { useLanguage } from '@/contexts/language-context';
import { fetchUserProfile, updateMatchCallStatus } from '@/lib/supabaseDataService';

export function IncomingCallToast() {
  const { user: currentUser, matches } = useUser();
  const { toast, dismiss } = useToast();
  const router = useRouter();
  const { t } = useLanguage();

  const knownRingingIds = useRef<Set<string>>(new Set());
  const isInitialLoad = useRef(true);

  const ringingMatches = (matches || []).filter(m => m.callStatus === 'ringing');

  const showCallToast = useCallback(async (incomingCall: Match) => {
    if (!incomingCall.callerId) return;

    try {
      const caller = await fetchUserProfile(incomingCall.callerId);
      if (!caller) return;

      const notificationTitle = t('incoming_call_title');
      const notificationBody = t('incoming_call_desc').replace('%s', caller.name);
      
      // If tab is in background, use system notification
      if (document.hidden && Notification.permission === 'granted') {
          const notification = new Notification(notificationTitle, {
              body: notificationBody,
              icon: caller.photoUrls?.[0] || '/icon.svg',
              tag: `call-${incomingCall.id}`,
          });
          
          notification.onclick = () => {
              window.focus();
              updateMatchCallStatus(incomingCall.id, 'active');
              router.push(`/chat/${incomingCall.id}`);
          };
      }
      
      // Always show an in-app toast
      const { id: toastId } = toast({
          duration: 20000,
          title: notificationTitle,
          description: (
            <div className="flex items-center gap-3 mt-2">
              <Avatar className="h-10 w-10">
                <AvatarImage src={caller.photoUrls?.[0]} alt={caller.name} />
                <AvatarFallback>{caller.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <span>{notificationBody}</span>
            </div>
          ),
          action: (
            <div className="flex gap-2 mt-4">
              <Button variant="destructive" size="sm" onClick={() => {
                  updateMatchCallStatus(incomingCall.id, 'idle', null);
                  dismiss(toastId);
              }}>
                {t('reject_call')}
              </Button>
              <Button variant="default" size="sm" onClick={() => {
                  updateMatchCallStatus(incomingCall.id, 'active');
                  dismiss(toastId);
                  router.push(`/chat/${incomingCall.id}`);
              }}>
                {t('accept_call')}
              </Button>
            </div>
          ),
      });

    } catch (error) {
        console.error("Failed to fetch caller's profile for toast:", error);
    }
  }, [toast, dismiss, router, t]);

  useEffect(() => {
    if (!ringingMatches || !currentUser?.id) {
      return;
    }

    if (isInitialLoad.current) {
      ringingMatches.forEach(match => {
        if (match.callerId !== currentUser.id) {
          knownRingingIds.current.add(match.id);
        }
      });
      isInitialLoad.current = false;
      return;
    }

    ringingMatches.forEach(incomingCall => {
      if (incomingCall.callerId !== currentUser.id && !knownRingingIds.current.has(incomingCall.id)) {
        showCallToast(incomingCall);
        knownRingingIds.current.add(incomingCall.id);
      }
    });

    const currentRingingIds = new Set(ringingMatches.map(m => m.id));
    knownRingingIds.current.forEach(id => {
      if (!currentRingingIds.has(id)) {
        knownRingingIds.current.delete(id);
      }
    });
    
  }, [ringingMatches, currentUser?.id, showCallToast]);

  return null;
}
