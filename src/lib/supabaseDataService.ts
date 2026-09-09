import { supabase } from './supabaseClient';
import type { User, Match, Message, Like, QuestPin, QuestCategory, QuestApplication } from './types';
import {
  fromSupabaseUser,
  toSupabaseUser,
  fromSupabaseMatch,
  toSupabaseMatch,
  fromSupabaseMessage,
  toSupabaseMessage,
  fromSupabaseLike,
  fromSupabaseQuestPin,
  toSupabaseQuestPin,
  fromSupabaseQuestApplication,
} from './supabaseMappers';
import type { FilterSettings } from '@/contexts/user-context';
import {
  notifyNewLike,
  notifyNewMatch,
  notifyNewMessage,
  notifyIncomingCall,
  sendRealtimeBroadcast,
} from './notificationService';

export function getClient() {
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }
  return supabase;
}

/**
 * Fetch discoverable candidate profiles for the swipe card stack.
 */
export async function fetchDiscoverUsers(
  currentUserId: string,
  filters?: FilterSettings,
  limitCount = 30,
  currentUserGender?: string
): Promise<User[]> {
  const client = getClient();

  // 1. Get IDs of users already liked or passed by current user
  const { data: swipedData } = await client
    .from('likes')
    .select('likee_id')
    .eq('liker_id', currentUserId);

  const excludeIds = new Set<string>([currentUserId]);
  if (swipedData) {
    for (const row of swipedData) {
      if (row.likee_id) excludeIds.add(row.likee_id);
    }
  }

  // Determine gender filter:
  // If user explicitly chose gender in /filter, use filters.gender.
  // Otherwise default to the opposite gender (남성 -> 여성, 여성 -> 남성).
  let targetGenders: string[] = [];
  if (filters?.gender && filters.gender.length > 0) {
    targetGenders = filters.gender;
  } else {
    let gender = currentUserGender;
    if (!gender) {
      const { data: me } = await client.from('users').select('gender').eq('id', currentUserId).maybeSingle();
      gender = me?.gender;
    }
    if (gender === '남성' || (gender && gender.toLowerCase().startsWith('m'))) {
      targetGenders = ['여성'];
    } else if (gender === '여성' || (gender && (gender.toLowerCase().startsWith('f') || gender.toLowerCase().startsWith('w')))) {
      targetGenders = ['남성'];
    }
  }

  // 2. Query users
  let query = client
    .from('users')
    .select('*')
    .neq('id', currentUserId)
    .limit(limitCount * 2);

  if (targetGenders.length > 0) {
    query = query.in('gender', targetGenders);
  }
  if (filters?.ageRange) {
    query = query
      .gte('age', filters.ageRange.min)
      .lte('age', filters.ageRange.max);
  }

  const { data: usersData, error } = await query;
  if (error) {
    console.error('Error fetching discover users:', error);
    return [];
  }

  // 3. Filter out excluded IDs and strictly enforce target gender
  const candidates = (usersData || [])
    .filter((u) => {
      if (excludeIds.has(u.id)) return false;
      if (targetGenders.length > 0 && !targetGenders.includes(u.gender)) return false;
      return true;
    })
    .map(fromSupabaseUser);

  return candidates.slice(0, limitCount);
}

/**
 * Record a swipe (like or pass). If reciprocal like exists, create a match!
 */
export async function recordSwipe(
  likerId: string,
  likeeId: string,
  isLike: boolean
): Promise<{ success: boolean; isMatch: boolean; match?: Match; matchedUser?: User }> {
  const client = getClient();

  // 1. Record like/dislike in likes table
  const { error: likeError } = await client
    .from('likes')
    .upsert(
      {
        liker_id: likerId,
        likee_id: likeeId,
        is_like: isLike,
      },
      { onConflict: 'liker_id,likee_id' }
    );

  if (likeError) {
    console.error('Error recording swipe:', likeError);
    return { success: false, isMatch: false };
  }

  if (!isLike) {
    return { success: true, isMatch: false };
  }

  // 2. Check if the other user has also liked the current user
  const { data: reciprocalLike } = await client
    .from('likes')
    .select('id')
    .eq('liker_id', likeeId)
    .eq('likee_id', likerId)
    .eq('is_like', true)
    .maybeSingle();

  if (!reciprocalLike) {
    // Notify likee in real-time (In-app alert + Web Push)
    fetchUserProfile(likerId).then((liker) => {
      if (liker) {
        notifyNewLike({ targetUserId: likeeId, liker });
      }
    }).catch((err) => console.error('Error notifying new like:', err));

    return { success: true, isMatch: false };
  }

  // 3. It's a match! Create match using deterministic ID
  const matchId = [likerId, likeeId].sort().join('_');
  const now = new Date().toISOString();

  const matchRow = {
    id: matchId,
    users: [likerId, likeeId],
    last_message: '매칭되었습니다! 인사를 건네보세요.',
    last_message_timestamp: now,
    last_message_sender_id: null,
    unread_counts: { [likerId]: 0, [likeeId]: 0 },
    match_date: now,
    call_status: 'idle',
    caller_id: null,
  };

  const { data: createdMatch, error: matchError } = await client
    .from('matches')
    .upsert(matchRow, { onConflict: 'id' })
    .select()
    .single();

  if (matchError) {
    console.error('Error creating match:', matchError);
    return { success: true, isMatch: false };
  }

  // 4. Fetch matched user's profile for the match modal
  const { data: otherUserData } = await client
    .from('users')
    .select('*')
    .eq('id', likeeId)
    .maybeSingle();

  const matchedUser = otherUserData ? fromSupabaseUser(otherUserData) : undefined;
  const match = fromSupabaseMatch(createdMatch);

  // Notify both users about the new match (In-app toast + Web Push)
  fetchUserProfile(likerId).then((liker) => {
    if (liker && matchedUser) {
      notifyNewMatch({ userA: liker, userB: matchedUser, matchId });
    }
  }).catch((err) => console.error('Error notifying new match:', err));

  return {
    success: true,
    isMatch: true,
    match,
    matchedUser,
  };
}

/**
 * Fetch matches for a user
 */
export async function fetchUserMatches(userId: string): Promise<Match[]> {
  const client = getClient();
  const { data, error } = await client
    .from('matches')
    .select('*')
    .contains('users', JSON.stringify([userId]))
    .order('last_message_timestamp', { ascending: false });

  if (error) {
    console.error('Error fetching matches:', error.message || error);
    return [];
  }

  return (data || []).map(fromSupabaseMatch);
}

/**
 * Subscribe to realtime changes on matches for a user
 */
export function subscribeUserMatches(userId: string, onUpdate: () => void) {
  const client = getClient();
  const channel = client
    .channel(`user-matches-${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'matches',
      },
      () => {
        onUpdate();
      }
    )
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
}

/**
 * Fetch chat messages for a match
 */
export async function fetchChatMessages(matchId: string, limitCount = 100): Promise<Message[]> {
  const client = getClient();
  const { data, error } = await client
    .from('messages')
    .select('*')
    .eq('match_id', matchId)
    .order('created_at', { ascending: true })
    .limit(limitCount);

  if (error) {
    console.error('Error fetching messages:', error);
    return [];
  }

  return (data || []).map(fromSupabaseMessage);
}

/**
 * Send a message in a match
 */
export async function sendChatMessage(params: {
  matchId: string;
  senderId: string;
  text?: string;
  audioUrl?: string;
  senderLanguage?: string;
  translations?: Record<string, any>;
}): Promise<Message | null> {
  const client = getClient();
  const row = toSupabaseMessage(params);

  const { data: insertedMsg, error: msgError } = await client
    .from('messages')
    .insert(row)
    .select()
    .single();

  if (msgError) {
    console.error('Error sending message:', msgError);
    return null;
  }

  // Update match last message metadata
  await client
    .from('matches')
    .update({
      last_message: params.text || (params.audioUrl ? '음성 메시지' : '메시지'),
      last_message_timestamp: new Date().toISOString(),
      last_message_sender_id: params.senderId,
    })
    .eq('id', params.matchId);

  // Notify recipient in real-time (In-app toast + Web Push)
  const userIds = params.matchId.split('_');
  const recipientId = userIds.find((id) => id !== params.senderId);
  if (recipientId) {
    fetchUserProfile(params.senderId).then((sender) => {
      if (sender) {
        notifyNewMessage({
          recipientId,
          sender,
          matchId: params.matchId,
          text: params.text || (params.audioUrl ? '음성 메시지' : '새로운 메시지'),
        });
      }
    }).catch((err) => console.error('Error notifying chat message:', err));
  }

  return fromSupabaseMessage(insertedMsg);
}

/**
 * Subscribe to new messages for a match
 */
export function subscribeChatMessages(matchId: string, onNewMessage: (msg: Message) => void) {
  const client = getClient();
  const channel = client
    .channel(`chat-${matchId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `match_id=eq.${matchId}`,
      },
      (payload) => {
        if (payload.new) {
          onNewMessage(fromSupabaseMessage(payload.new));
        }
      }
    )
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
}

/**
 * Fetch a user profile by ID
 */
export async function fetchUserProfile(userId: string): Promise<User | null> {
  const client = getClient();
  const { data, error } = await client
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return fromSupabaseUser(data);
}

/**
 * Upsert or update a user profile
 */
export async function saveUserProfile(user: Partial<User> & { id: string }): Promise<User | null> {
  const client = getClient();
  const row = toSupabaseUser(user);

  const { data, error } = await client
    .from('users')
    .upsert(row, { onConflict: 'id' })
    .select()
    .single();

  if (error) {
    console.error('Error saving user profile:', error);
    return null;
  }

  return fromSupabaseUser(data);
}

/**
 * Fetch likes sent and received by a user
 */
export async function fetchUserLikes(userId: string): Promise<{
  peopleILiked: Like[];
  peopleWhoLikedMe: Like[];
}> {
  const client = getClient();

  const [sentRes, receivedRes] = await Promise.all([
    client
      .from('likes')
      .select('*')
      .eq('liker_id', userId)
      .eq('is_like', true)
      .order('created_at', { ascending: false }),
    client
      .from('likes')
      .select('*')
      .eq('likee_id', userId)
      .eq('is_like', true)
      .order('created_at', { ascending: false }),
  ]);

  if (sentRes.error) console.error('Error fetching sent likes:', sentRes.error);
  if (receivedRes.error) console.error('Error fetching received likes:', receivedRes.error);

  const peopleILiked = (sentRes.data || []).map(fromSupabaseLike);
  const peopleWhoLikedMe = (receivedRes.data || []).map(fromSupabaseLike);

  return { peopleILiked, peopleWhoLikedMe };
}

/**
 * Fetch users with filter/pagination for admin dashboard
 */
export async function fetchAllUsers(limitCount = 100): Promise<User[]> {
  const client = getClient();
  const { data, error } = await client
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limitCount);

  if (error) {
    console.error('Error fetching all users:', error);
    return [];
  }

  return (data || []).map(fromSupabaseUser);
}

/**
 * Fetch multiple users by their IDs
 */
export async function fetchUsersByIds(userIds: string[]): Promise<User[]> {
  const cleanIds = Array.from(new Set((userIds || []).filter(Boolean)));
  if (cleanIds.length === 0) return [];

  const client = getClient();
  const { data, error } = await client
    .from('users')
    .select('*')
    .in('id', cleanIds);

  if (error || !data) {
    console.error('Error fetching users by IDs:', error);
    return [];
  }

  const userMap = new Map(data.map((u) => [u.id, fromSupabaseUser(u)]));
  // Preserve original order so recent likes remain at the top
  return cleanIds.map((id) => userMap.get(id)).filter((u): u is User => !!u);
}

/**
 * Fetch candidate users for the Map screen
 */
export async function fetchMapUsers(
  currentUserId: string,
  genderFilter?: string[],
  limitCount = 50,
  currentUserGender?: string
): Promise<User[]> {
  const client = getClient();
  let query = client
    .from('users')
    .select('*')
    .neq('id', currentUserId)
    .limit(limitCount);

  let targetGenders = genderFilter && genderFilter.length > 0 ? genderFilter : [];
  if (targetGenders.length === 0) {
    let gender = currentUserGender;
    if (!gender) {
      const { data: me } = await client.from('users').select('gender').eq('id', currentUserId).maybeSingle();
      gender = me?.gender;
    }
    const isMale = gender === '남성' || (gender && gender.toLowerCase().startsWith('m'));
    const isFemale = gender === '여성' || (gender && (gender.toLowerCase().startsWith('f') || gender.toLowerCase().startsWith('w')));
    if (isMale) {
      targetGenders = ['여성'];
    } else if (isFemale) {
      targetGenders = ['남성'];
    }
  }

  if (targetGenders.length > 0) {
    query = query.in('gender', targetGenders);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching map users:', error);
    return [];
  }
  return (data || [])
    .filter((u) => targetGenders.length === 0 || targetGenders.includes(u.gender))
    .map(fromSupabaseUser);
}

/**
 * Delete a user profile from the database
 */
export async function deleteUserProfile(userId: string): Promise<boolean> {
  const client = getClient();
  const { error } = await client.from('users').delete().eq('id', userId);
  if (error) {
    console.error('Error deleting user profile:', error);
    return false;
  }
  return true;
}

/**
 * Subscribe to realtime changes on incoming likes
 */
export function subscribeUserLikes(userId: string, onUpdate: () => void) {
  const client = getClient();
  const channel = client
    .channel(`user-likes-${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'likes',
        filter: `likee_id=eq.${userId}`,
      },
      () => {
        onUpdate();
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'likes',
        filter: `liker_id=eq.${userId}`,
      },
      () => {
        onUpdate();
      }
    )
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
}

/**
 * Update call status on a match
 */
export async function updateMatchCallStatus(
  matchId: string,
  callStatus: 'idle' | 'ringing' | 'active',
  callerId?: string | null
): Promise<void> {
  const client = getClient();
  const updatePayload: Record<string, any> = {
    call_status: callStatus,
  };
  if (callerId !== undefined) {
    updatePayload.caller_id = callerId;
  }
  const { error } = await client
    .from('matches')
    .update(updatePayload)
    .eq('id', matchId);

  if (error) {
    console.error('Error updating call status:', error);
    return;
  }

  const userIds = matchId.split('_');

  // If ringing, dispatch incoming call alert to the other participant
  if (callStatus === 'ringing' && callerId) {
    const recipientId = userIds.find((id) => id !== callerId);
    if (recipientId) {
      fetchUserProfile(callerId).then((caller) => {
        if (caller) {
          notifyIncomingCall({ recipientId, caller, matchId });
        }
      }).catch((err) => console.error('Error notifying incoming call:', err));
    }
  } else if (callStatus === 'active') {
    // If call accepted, broadcast active event to both participants
    userIds.forEach((uid) => {
      sendRealtimeBroadcast(uid, {
        type: 'call',
        title: '통화 연결',
        body: '영상 통화가 연결되었습니다.',
        data: { callStatus: 'active', matchId },
      });
    });
  } else if (callStatus === 'idle') {
    // If call ended or rejected, broadcast dismiss event to all participants
    userIds.forEach((uid) => {
      sendRealtimeBroadcast(uid, {
        type: 'call',
        title: '통화 종료',
        body: '통화가 종료되었습니다.',
        data: { callStatus: 'idle', matchId },
      });
    });
  }
}

/**
 * Submit user report
 */
export async function submitUserReport(params: {
  reporterId: string;
  reporterName?: string;
  reportedUserId: string;
  reportedUserName?: string;
  reason: string;
}): Promise<boolean> {
  const client = getClient();
  try {
    const { error } = await client.from('reports').insert({
      reporter_id: params.reporterId,
      reporter_name: params.reporterName,
      reported_user_id: params.reportedUserId,
      reported_user_name: params.reportedUserName,
      reason: params.reason,
      status: 'new',
      created_at: new Date().toISOString(),
    });
    if (error) {
      console.warn('Report insert note:', error.message);
    }
    return true;
  } catch (e) {
    console.warn('Report insert exception:', e);
    return true;
  }
}

/**
 * Fetch active quest pins with 24-hour expiration filter and opposite gender filtering
 */
export async function fetchActiveQuestPins(
  currentUserId?: string,
  currentUserGender?: string
): Promise<QuestPin[]> {
  const client = getClient();
  const nowIso = new Date().toISOString();

  // Fetch all open quest pins that haven't expired
  const { data: pinsData, error } = await client
    .from('quest_pins')
    .select('*')
    .eq('status', 'open')
    .gt('expires_at', nowIso)
    .order('created_at', { ascending: false });

  if (error || !pinsData || pinsData.length === 0) {
    if (error) console.warn('fetchActiveQuestPins note:', error.message);
    return [];
  }

  // Collect creator IDs to fetch user profiles
  const creatorIds = Array.from(new Set(pinsData.map((p) => p.creator_id)));
  const { data: usersData } = await client
    .from('users')
    .select('*')
    .in('id', creatorIds);

  const userMap = new Map<string, User>();
  if (usersData) {
    usersData.forEach((u) => {
      userMap.set(u.id, fromSupabaseUser(u));
    });
  }

  const isMale = currentUserGender === '남성' || currentUserGender?.toLowerCase().startsWith('m');
  const targetOppositeGender = isMale ? '여성' : '남성';

  const mappedPins: QuestPin[] = [];

  for (const row of pinsData) {
    const creator = userMap.get(row.creator_id);
    const pin = fromSupabaseQuestPin(row, creator);

    // Filter rule:
    // 1. If it's my own pin, always keep it (for management/deletion)
    // 2. If it's another user's pin, only include if creator's gender is the opposite gender
    if (currentUserId && pin.creatorId === currentUserId) {
      mappedPins.push(pin);
    } else if (!currentUserGender || !creator?.gender) {
      mappedPins.push(pin);
    } else if (creator.gender === targetOppositeGender) {
      mappedPins.push(pin);
    }
  }

  return mappedPins;
}

/**
 * Create a new 24-hour quest pin with 500m safe location fuzzing
 */
export async function createQuestPin(params: {
  creatorId: string;
  title: string;
  category: QuestCategory;
  description?: string;
  meetupTime?: string;
  realLat: number;
  realLng: number;
}): Promise<QuestPin | null> {
  const client = getClient();

  // 500m random safe fuzzing
  const distance = 200 + Math.random() * 300; // 200m ~ 500m
  const angle = Math.random() * 2 * Math.PI;
  const earthRadius = 6378137;
  const dLat = (distance * Math.cos(angle)) / earthRadius;
  const dLng = (distance * Math.sin(angle)) / (earthRadius * Math.cos((Math.PI * params.realLat) / 180));
  const approxLat = params.realLat + (dLat * 180) / Math.PI;
  const approxLng = params.realLng + (dLng * 180) / Math.PI;

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await client
    .from('quest_pins')
    .insert({
      creator_id: params.creatorId,
      title: params.title.trim(),
      category: params.category,
      description: params.description?.trim() || '',
      approx_lat: approxLat,
      approx_lng: approxLng,
      meetup_time: params.meetupTime?.trim() || '',
      created_at: new Date().toISOString(),
      expires_at: expiresAt,
      status: 'open',
    })
    .select('*')
    .single();

  if (error || !data) {
    console.error('Failed to create quest pin:', error);
    throw new Error(error?.message || 'Failed to create quest pin');
  }

  const creator = await fetchUserProfile(params.creatorId);
  return fromSupabaseQuestPin(data, creator || undefined);
}

/**
 * Delete a quest pin (by creator)
 */
export async function deleteQuestPin(questId: string, creatorId: string): Promise<boolean> {
  const client = getClient();
  const { error } = await client
    .from('quest_pins')
    .delete()
    .eq('id', questId)
    .eq('creator_id', creatorId);

  if (error) {
    console.error('Failed to delete quest pin:', error);
    return false;
  }
  return true;
}

/**
 * Start or retrieve a 1:1 chat for a quest pin
 */
export async function startQuestChat(
  currentUserId: string,
  targetUserId: string,
  questTitle: string
): Promise<string> {
  const client = getClient();

  // 1. Check if match already exists
  const { data: existingMatches } = await client
    .from('matches')
    .select('*')
    .contains('users', [currentUserId, targetUserId]);

  if (existingMatches && existingMatches.length > 0) {
    return existingMatches[0].id;
  }

  // 2. Create new match
  const newMatchId = `match_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const now = new Date().toISOString();

  const { error } = await client.from('matches').insert({
    id: newMatchId,
    users: [currentUserId, targetUserId],
    last_message: `⚡ 번개 퀘스트: "${questTitle}" 대화가 시작되었습니다.`,
    last_message_sender_id: currentUserId,
    last_message_timestamp: now,
    unread_counts: { [targetUserId]: 1, [currentUserId]: 0 },
    created_at: now,
    match_date: now,
    call_status: 'idle',
    caller_id: null,
  });

  if (error) {
    console.error('Failed to create match for quest:', error);
    throw new Error('Failed to create match');
  }

  // Send initial message
  await sendChatMessage({
    matchId: newMatchId,
    senderId: currentUserId,
    text: `안녕하세요! 올려주신 번개 퀘스트 [${questTitle}] 보고 메시지 드려요 😊`,
  });

  return newMatchId;
}

/**
 * Subscribe to realtime changes in quest_pins
 */
export function subscribeQuestPins(onChange: () => void) {
  if (!supabase) return () => {};
  const channel = supabase
    .channel('realtime_quest_pins')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'quest_pins' },
      () => {
        onChange();
      }
    )
    .subscribe();

  return () => {
    supabase?.removeChannel(channel);
  };
}


