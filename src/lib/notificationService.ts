import { getClient } from './supabaseDataService';
import type { User } from './types';

export interface AlertPayload {
  type: 'like' | 'match' | 'message' | 'call' | 'test';
  title: string;
  body: string;
  icon?: string;
  url?: string;
  data?: Record<string, any>;
  liker?: Partial<User>;
  matchedUser?: Partial<User>;
  sender?: Partial<User>;
  caller?: Partial<User>;
  matchId?: string;
}

// In-memory active broadcast channels to avoid repeated subscription setup
const broadcastChannels = new Map<string, any>();

/**
 * Send an instant WebSocket broadcast event to target user's personal alert channel
 */
export async function sendRealtimeBroadcast(targetUserId: string, payload: AlertPayload): Promise<void> {
  if (!targetUserId) return;
  try {
    const client = getClient();
    const topic = `user_alerts_${targetUserId}`;
    let channel = broadcastChannels.get(targetUserId);

    if (!channel) {
      channel = client.channel(topic);
      broadcastChannels.set(targetUserId, channel);

      await new Promise<void>((resolve) => {
        channel.subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            resolve();
          }
        });
        // Fallback timeout so we don't hang if socket is already connected
        setTimeout(resolve, 1200);
      });
    }

    await channel.send({
      type: 'broadcast',
      event: 'alert',
      payload,
    });
  } catch (err) {
    console.error('Failed to send realtime broadcast alert:', err);
  }
}

/**
 * Send Web Push notification through the server API route
 */
export async function sendPushNotification(params: {
  targetUserId?: string;
  subscription?: any;
  title: string;
  body: string;
  icon?: string;
  url?: string;
  data?: Record<string, any>;
}): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    await fetch('/api/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
  } catch (err) {
    console.warn('Failed to call /api/push/send:', err);
  }
}

/**
 * Dual dispatch: 1) Instant WebSocket Broadcast for In-App UI + 2) Web Push for Background/OS
 */
export function dispatchUserAlert(targetUserId: string, payload: AlertPayload): void {
  if (!targetUserId) return;

  // 1. Instant Realtime In-App Broadcast
  sendRealtimeBroadcast(targetUserId, payload);

  // 2. Web Push Notification (non-blocking)
  sendPushNotification({
    targetUserId,
    title: payload.title,
    body: payload.body,
    icon: payload.icon || '/icon.svg',
    url: payload.url || '/',
    data: {
      type: payload.type,
      ...payload.data,
    },
  });
}

/**
 * Send notification when user receives a like
 */
export function notifyNewLike(params: {
  targetUserId: string;
  liker: Partial<User>;
}): void {
  const likerName = params.liker.name || '누군가';
  const icon = params.liker.photoUrls?.[0] || '/icon.svg';

  dispatchUserAlert(params.targetUserId, {
    type: 'like',
    title: '새로운 좋아요!',
    body: `${likerName}님이 회원님을 좋아합니다.`,
    icon,
    url: `/users/${params.liker.id || ''}`,
    liker: params.liker,
  });
}

/**
 * Send notification when reciprocal match is created
 */
export function notifyNewMatch(params: {
  userA: Partial<User>;
  userB: Partial<User>;
  matchId: string;
}): void {
  if (params.userA.id && params.userB.id) {
    // Notify User A about User B
    dispatchUserAlert(params.userA.id, {
      type: 'match',
      title: '새로운 매치!',
      body: `${params.userB.name || '회원'}님과 매칭되었습니다!`,
      icon: params.userB.photoUrls?.[0] || '/icon.svg',
      url: `/chat/${params.matchId}`,
      matchedUser: params.userB,
      matchId: params.matchId,
    });

    // Notify User B about User A
    dispatchUserAlert(params.userB.id, {
      type: 'match',
      title: '새로운 매치!',
      body: `${params.userA.name || '회원'}님과 매칭되었습니다!`,
      icon: params.userA.photoUrls?.[0] || '/icon.svg',
      url: `/chat/${params.matchId}`,
      matchedUser: params.userA,
      matchId: params.matchId,
    });
  }
}

/**
 * Send notification when a new chat message arrives
 */
export function notifyNewMessage(params: {
  recipientId: string;
  sender: Partial<User>;
  matchId: string;
  text?: string;
}): void {
  const senderName = params.sender.name || '대화 상대';
  const icon = params.sender.photoUrls?.[0] || '/icon.svg';
  const preview = params.text || '새로운 음성 메시지가 도착했습니다.';

  dispatchUserAlert(params.recipientId, {
    type: 'message',
    title: senderName,
    body: preview,
    icon,
    url: `/chat/${params.matchId}`,
    sender: params.sender,
    matchId: params.matchId,
    data: { text: preview },
  });
}

/**
 * Send notification when an incoming video call is requested
 */
export function notifyIncomingCall(params: {
  recipientId: string;
  caller: Partial<User>;
  matchId: string;
}): void {
  const callerName = params.caller.name || '대화 상대';
  const icon = params.caller.photoUrls?.[0] || '/icon.svg';

  dispatchUserAlert(params.recipientId, {
    type: 'call',
    title: 'Aura - 영상 통화 요청',
    body: `${callerName}님으로부터 영상 통화 요청이 왔습니다.`,
    icon,
    url: `/chat/${params.matchId}`,
    caller: params.caller,
    matchId: params.matchId,
  });
}

/**
 * Send instant welcome push to newly subscribed device
 */
export async function sendWelcomePush(subscription: any): Promise<void> {
  await sendPushNotification({
    subscription,
    title: 'Aura 알림 활성화 완료! 🔔',
    body: '이제 새로운 매치와 메시지 소식을 실시간으로 받아보실 수 있습니다.',
    icon: '/icon.svg',
    url: '/profile',
  });
}
