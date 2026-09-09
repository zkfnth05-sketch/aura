import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@aura-ai-dating.com';

// Initialize web-push if VAPID keys are configured
let isVapidConfigured = false;
if (vapidPublicKey && vapidPrivateKey) {
  try {
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
    isVapidConfigured = true;
  } catch (e) {
    console.error('Failed to configure VAPID in push API:', e);
  }
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
  if (!isVapidConfigured) {
    return NextResponse.json(
      { error: 'VAPID keys are not configured on server' },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const {
      targetUserId,
      subscription,
      title = 'Aura',
      body: messageBody = '새로운 알림이 있습니다.',
      icon = '/icon.svg',
      url = '/',
      data = {},
    } = body;

    const payload = JSON.stringify({
      title,
      body: messageBody,
      icon,
      url,
      data: {
        url,
        ...data,
      },
    });

    // Case 1: Direct single subscription (e.g. welcome test notification)
    if (subscription && typeof subscription === 'object' && subscription.endpoint) {
      try {
        await webpush.sendNotification(subscription, payload);
        return NextResponse.json({ success: true, sent: 1 });
      } catch (err: any) {
        console.error('Error sending direct push notification:', err.statusCode, err.message);
        return NextResponse.json(
          { success: false, error: err.message, statusCode: err.statusCode },
          { status: 500 }
        );
      }
    }

    // Case 2: Send to target user's saved subscriptions
    if (!targetUserId) {
      return NextResponse.json(
        { error: 'targetUserId or subscription is required' },
        { status: 400 }
      );
    }

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, push_subscriptions')
      .eq('id', targetUserId)
      .maybeSingle();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found or query error', details: userError },
        { status: 404 }
      );
    }

    const rawSubscriptions = user.push_subscriptions;
    const subscriptions: any[] = Array.isArray(rawSubscriptions) ? rawSubscriptions : [];

    if (subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        sent: 0,
        message: 'No push subscriptions found for this user',
      });
    }

    let sentCount = 0;
    let failedCount = 0;
    const staleEndpoints = new Set<string>();

    await Promise.all(
      subscriptions.map(async (sub) => {
        if (!sub || !sub.endpoint) return;
        try {
          await webpush.sendNotification(sub, payload);
          sentCount++;
        } catch (err: any) {
          failedCount++;
          // 410 Gone or 404 Not Found indicates subscription expired / unregistered
          if (err.statusCode === 410 || err.statusCode === 404) {
            staleEndpoints.add(sub.endpoint);
          } else {
            console.error('Push send failed for endpoint:', sub.endpoint?.slice(0, 30), err.message);
          }
        }
      })
    );

    // Prune stale subscriptions from database if any expired
    if (staleEndpoints.size > 0) {
      const activeSubscriptions = subscriptions.filter(
        (sub) => !staleEndpoints.has(sub.endpoint)
      );
      await supabaseAdmin
        .from('users')
        .update({ push_subscriptions: activeSubscriptions })
        .eq('id', targetUserId);
    }

    return NextResponse.json({
      success: true,
      sent: sentCount,
      failed: failedCount,
      pruned: staleEndpoints.size,
    });
  } catch (error: any) {
    console.error('Error in /api/push/send route:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
