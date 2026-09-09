'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useUser } from '@/contexts/user-context';
import { useToast } from '@/hooks/use-toast';
import { Button } from './ui/button';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { useRouter } from 'next/navigation';
import type { Match, User } from '@/lib/types';
import { useLanguage } from '@/contexts/language-context';
import { fetchUserProfile, updateMatchCallStatus, getClient } from '@/lib/supabaseDataService';

export function IncomingCallToast() {
  const { user: currentUser, matches } = useUser();
  const { toast, dismiss } = useToast();
  const router = useRouter();
  const { t } = useLanguage();

  const knownRingingIds = useRef<Set<string>>(new Set());
  const activeToastIds = useRef<Map<string, string>>(new Map());
  const isInitialLoad = useRef(true);

  const ringingMatches = (matches || []).filter(m => m.callStatus === 'ringing');

  const renderCallAlert = useCallback((matchId: string, caller: Partial<User>) => {
    if (!caller?.id || caller.id === currentUser?.id) return;

    const callerName = caller.name || '대화 상대';
    const notificationTitle = t('incoming_call_title');
    const notificationBody = t('incoming_call_desc').replace('%s', callerName);

    // If tab is in background, show system notification
    if (typeof document !== 'undefined' && document.hidden && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      const notification = new Notification(notificationTitle, {
        body: notificationBody,
        icon: caller.photoUrls?.[0] || '/icon.svg',
        tag: `call-${matchId}`,
      });

      notification.onclick = () => {
        window.focus();
        updateMatchCallStatus(matchId, 'active');
        router.push(`/chat/${matchId}`);
      };
    }

    // Show in-app action toast
    const { id: toastId } = toast({
      duration: 25000,
      title: notificationTitle,
      description: (
        <div className="flex items-center gap-3 mt-2">
          <Avatar className="h-10 w-10">
            <AvatarImage src={caller.photoUrls?.[0]} alt={callerName} />
            <AvatarFallback>{callerName.charAt(0)}</AvatarFallback>
          </Avatar>
          <span>{notificationBody}</span>
        </div>
      ),
      action: (
        <div className="flex gap-2 mt-4">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              updateMatchCallStatus(matchId, 'idle', null);
              dismiss(toastId);
              activeToastIds.current.delete(matchId);
            }}
          >
            {t('reject_call')}
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => {
              updateMatchCallStatus(matchId, 'active');
              dismiss(toastId);
              activeToastIds.current.delete(matchId);
              router.push(`/chat/${matchId}`);
            }}
          >
            {t('accept_call')}
          </Button>
        </div>
      ),
    });

    activeToastIds.current.set(matchId, toastId);
  }, [currentUser?.id, dismiss, router, toast, t]);

  const showCallToast = useCallback(async (incomingCall: Match) => {
    if (!incomingCall.callerId) return;
    try {
      const caller = await fetchUserProfile(incomingCall.callerId);
      if (caller) {
        renderCallAlert(incomingCall.id, caller);
      }
    } catch (error) {
      console.error("Failed to fetch caller profile for toast:", error);
    }
  }, [renderCallAlert]);

  // 1. Listen to instant WebSocket Realtime Broadcast
  useEffect(() => {
    if (!currentUser?.id) return;
    const client = getClient();

    const alertChannel = client
      .channel(`user_alerts_call_${currentUser.id}`)
      .on('broadcast', { event: 'alert' }, ({ payload }) => {
        if (payload?.type === 'call') {
          // If call ended or idle, dismiss toast
          if (payload.data?.callStatus === 'idle' && payload.data?.matchId) {
            const existingToastId = activeToastIds.current.get(payload.data.matchId);
            if (existingToastId) {
              dismiss(existingToastId);
              activeToastIds.current.delete(payload.data.matchId);
            }
            return;
          }

          if (payload.caller && payload.matchId && payload.caller.id !== currentUser.id) {
            renderCallAlert(payload.matchId, payload.caller);
          }
        }
      })
      .subscribe();

    return () => {
      client.removeChannel(alertChannel);
    };
  }, [currentUser?.id, dismiss, renderCallAlert]);

  // 2. Also watch matches array from user-context
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
        const existingToastId = activeToastIds.current.get(id);
        if (existingToastId) {
          dismiss(existingToastId);
          activeToastIds.current.delete(id);
        }
      }
    });
    
  }, [ringingMatches, currentUser?.id, dismiss, showCallToast]);

  return null;
}
