
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import type { User, Match, Like } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { toSupabaseUser, fromSupabaseUser } from '@/lib/supabaseMappers';
import { fetchUserMatches, subscribeUserMatches, fetchUserLikes, fetchUsersByIds, subscribeUserLikes, recordSwipe, checkInactivityExpiry, touchAppOpened } from '@/lib/supabaseDataService';
import { sendWelcomePush } from '@/lib/notificationService';
import { VipActionGateModal } from '@/components/vip-action-gate-modal';

export interface AuthUser {
  uid: string;
  phoneNumber?: string;
  email?: string;
  displayName?: string;
}

interface NotificationSettings {
  all: boolean;
  newMatch: boolean;
  newMessage: boolean;
  videoCall: boolean;
  locationShared: boolean;
}

export interface FilterSettings {
  ageRange: { min: number; max: number };
  gender: ('남성' | '여성' | '기타')[];
  relationship: string[];
  values: string[];
  communication: string[];
  lifestyle: string[];
  hobbies: string[];
  interests: string[];
}

interface PhoneAuthState {
  phoneNumber: string;
  setPhoneNumber: (phone: string) => void;
  countryCode: string;
  setCountryCode: (code: string) => void;
  confirmationResult: any;
  sendVerificationCode: (phoneNumberOverride?: string) => Promise<string | undefined>;
  verifyOtp: (otp: string) => Promise<void>;
  reauthenticate: (otp: string) => Promise<void>;
  isSendingOtp: boolean;
  isVerifyingOtp: boolean;
  mockOtp: string | null;
  setMockOtp: (otp: string | null) => void;
}

interface UserContextType {
  user: User | null;
  authUser: AuthUser | null;
  firestore: any;
  updateUser: (newUserData: Partial<User>) => Promise<void>;
  notificationSettings: NotificationSettings;
  updateNotificationSettings: (newSettings: Partial<NotificationSettings>) => void;
  filters: FilterSettings;
  updateFilters: (newFilters: Partial<FilterSettings>) => void;
  resetFilters: () => void;
  isLoaded: boolean;
  totalUnreadCount: number;
  phoneAuth: PhoneAuthState;
  isSignupFlowActive: boolean;
  setIsSignupFlowActive: (isActive: boolean) => void;
  matches: Match[] | null;
  isMatchesLoading: boolean;
  peopleILiked: User[] | null;
  peopleWhoLikedMe: User[] | null;
  isLikesLoading: boolean;
  subscribeToPushNotifications: () => Promise<void>;
  refreshLikes: () => Promise<void>;
  refreshMatches: () => Promise<void>;
  swipeUser: (targetUser: User, isLike: boolean) => Promise<{ success: boolean; isMatch: boolean; match?: Match; matchedUser?: User }>;
  isActionGateOpen: boolean;
  actionGateTitle: string;
  openActionGate: (title?: string) => void;
  closeActionGate: () => void;
  requireActiveAdmission: (actionCallback?: () => void, title?: string) => boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const initialSettings: NotificationSettings = {
  all: true,
  newMatch: true,
  newMessage: true,
  videoCall: true,
  locationShared: true,
};

const initialFilters: FilterSettings = {
  ageRange: { min: 18, max: 99 },
  gender: [],
  relationship: [],
  values: [],
  communication: [],
  lifestyle: [],
  hobbies: [],
  interests: [],
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(initialSettings);
  const [filters, setFilters] = useState<FilterSettings>(initialFilters);
  const [isUserDocLoading, setIsUserDocLoading] = useState(true);
  const [areSettingsLoaded, setAreSettingsLoaded] = useState(false); // New state to track settings loading
  const [isSignupFlowActive, setIsSignupFlowActive] = useState(false);

  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+82');
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<any>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [reauthVerificationId, setReauthVerificationId] = useState<string | null>(null);
  const [mockOtp, setMockOtp] = useState<string | null>(null);
  
  const [peopleILiked, setPeopleILiked] = useState<User[] | null>(null);
  const [peopleWhoLikedMe, setPeopleWhoLikedMe] = useState<User[] | null>(null);
  
  const isLoaded = !isUserDocLoading && areSettingsLoaded;

  // Load Settings from LocalStorage
  useEffect(() => {
    try {
      const storedSettings = localStorage.getItem('notificationSettings');
      if (storedSettings) {
        setNotificationSettings(prev => ({ ...prev, ...JSON.parse(storedSettings) }));
      }
      const storedFilters = localStorage.getItem('userFilters');
      if (storedFilters) {
        setFilters(prev => ({ ...prev, ...JSON.parse(storedFilters) }));
      }
    } catch (error) {
      console.error("Failed to parse data from localStorage", error);
    } finally {
      setAreSettingsLoaded(true); // Signal that settings are now loaded
    }
  }, []);

  // Enforce opposite-gender matching by default across the entire application
  useEffect(() => {
    if (user?.gender) {
      const isMale = user.gender === '남성' || user.gender.toLowerCase().startsWith('m');
      const opposite: ('남성' | '여성' | '기타') = isMale ? '여성' : '남성';
      setFilters(prev => {
        if (!prev.gender || prev.gender.length === 0 || prev.gender.includes(user.gender as any)) {
          const updated: FilterSettings = { ...prev, gender: [opposite] };
          try {
            localStorage.setItem('userFilters', JSON.stringify(updated));
          } catch (e) {}
          return updated;
        }
        return prev;
      });
    }
  }, [user?.gender]);

  const updateNotificationSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    setNotificationSettings(prevSettings => {
        const updatedSettings = { ...prevSettings, ...newSettings };
        try {
            localStorage.setItem('notificationSettings', JSON.stringify(updatedSettings));
        } catch (error) {
            console.error("Failed to save settings", error);
        }
        return updatedSettings;
    });
  }, []);

  // User Document Fetching & Presence Management via Supabase
  useEffect(() => {
    const localUserId = typeof window !== 'undefined' ? localStorage.getItem('aura_user_id') : null;

    if (supabase && localUserId) {
      supabase
        .from('users')
        .select('*')
        .eq('id', localUserId)
        .maybeSingle()
        .then(
          ({ data }) => {
            if (data) {
              setUser(fromSupabaseUser(data));
            } else {
              setUser(null);
            }
            setIsUserDocLoading(false);
          },
          (err: any) => {
            console.error("Supabase user fetch error:", err);
            setIsUserDocLoading(false);
          }
        );

      const channel = supabase
        .channel(`user_changes_${localUserId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'users', filter: `id=eq.${localUserId}` },
          (payload) => {
            if (payload.new) {
              const updatedUser = fromSupabaseUser(payload.new);
              setUser(prev => {
                if (prev?.admissionStatus === 'queued' && updatedUser.admissionStatus === 'active') {
                  toast({
                    title: '🎉 VIP 프리패스 승인!',
                    description: '초대하신 여성 회원님이 가입을 완료하여 정회원으로 입장되었습니다!',
                  });
                }
                return updatedUser;
              });
            }
          }
        )
        .subscribe();

      const updateLastSeen = () => {
        if (supabase && localUserId) {
          supabase.from('users').update({ last_seen: new Date().toISOString() }).eq('id', localUserId).then();
        }
      };
      
      window.addEventListener('focus', updateLastSeen);
      updateLastSeen();
      
      return () => {
        if (supabase) {
          supabase.removeChannel(channel);
        }
        window.removeEventListener('focus', updateLastSeen);
      };
    } else {
      setIsUserDocLoading(false);
    }
  }, []);

  // Dedicated useEffect for location management
  useEffect(() => {
    if (!isLoaded || !user) {
      return;
    }
    
    if (notificationSettings.locationShared) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          if (user.lat !== latitude || user.lng !== longitude) {
            updateUser({ lat: latitude, lng: longitude });
          }
        },
        (error) => {
          console.warn("Geolocation error:", error.message);
          if (error.code === error.PERMISSION_DENIED) {
            toast({
              variant: "destructive",
              title: "위치 권한 거부됨",
              description: "위치 서비스를 사용하려면 브라우저 설정에서 권한을 허용해주세요.",
            });
            // Sync the UI toggle with the browser's reality
            updateNotificationSettings({ locationShared: false });
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    }
  }, [isLoaded, user?.id, notificationSettings.locationShared, toast, updateNotificationSettings]);


  // --- 14-Day Inactivity Check & Touch App Opened ---
  useEffect(() => {
    if (user?.id) {
      checkInactivityExpiry(user.id, user.lastAppOpenedAt).then((isExpired) => {
        if (isExpired) {
          toast({
            variant: 'destructive',
            title: '대기열 만료 안내',
            description: '14일 동안 앱에 미접속하여 대기열 순번이 자동 만료되었습니다.',
          });
          setUser((prev) => (prev ? { ...prev, admissionStatus: 'expired' } : null));
        } else {
          touchAppOpened(user.id);
        }
      });
    }
  }, [user?.id]);

  // --- 50:50 Gender Equilibrium Action Gate Modal ---
  const [isActionGateOpen, setIsActionGateOpen] = useState(false);
  const [actionGateTitle, setActionGateTitle] = useState('1:1 대화 및 매칭');

  const openActionGate = useCallback((title?: string) => {
    if (title) setActionGateTitle(title);
    setIsActionGateOpen(true);
  }, []);

  const closeActionGate = useCallback(() => {
    setIsActionGateOpen(false);
  }, []);

  const requireActiveAdmission = useCallback((actionCallback?: () => void, title?: string): boolean => {
    const isFemale = user?.gender === '여성';
    const isActive = user?.admissionStatus === 'active' || isFemale;
    if (isActive) {
      actionCallback?.();
      return true;
    }

    openActionGate(title || '이 기능');
    return false;
  }, [user?.gender, user?.admissionStatus, openActionGate]);

  // --- Matches & Likes Queries via Supabase ---
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [isMatchesLoading, setIsMatchesLoading] = useState(true);
  const [isLikesLoading, setIsLikesLoading] = useState(true);

  const refreshMatches = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await fetchUserMatches(user.id);
      setMatches(data);
      setIsMatchesLoading(false);
    } catch (e) {
      setIsMatchesLoading(false);
    }
  }, [user?.id]);

  const refreshLikes = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { peopleILiked: myLikes, peopleWhoLikedMe: likesToMe } = await fetchUserLikes(user.id);
      const [likedUsers, likedByUsers] = await Promise.all([
        fetchUsersByIds(myLikes.map((l) => l.likeeId)),
        fetchUsersByIds(likesToMe.map((l) => l.likerId)),
      ]);
      setPeopleILiked(likedUsers);
      setPeopleWhoLikedMe(likedByUsers);
      setIsLikesLoading(false);
    } catch (e) {
      setIsLikesLoading(false);
    }
  }, [user?.id]);

  const swipeUser = useCallback(async (targetUser: User, isLike: boolean) => {
    if (!user?.id) return { success: false, isMatch: false };

    if (isLike) {
      // Optimistic instant addition to peopleILiked!
      setPeopleILiked(prev => [targetUser, ...(prev || []).filter(u => u.id !== targetUser.id)]);
    } else {
      setPeopleILiked(prev => (prev || []).filter(u => u.id !== targetUser.id));
    }

    try {
      const result = await recordSwipe(user.id, targetUser.id, isLike);
      if (result.isMatch && result.match) {
        setMatches(prev => [result.match!, ...(prev || []).filter(m => m.id !== result.match!.id)]);
      }
      // Re-sync with server
      refreshLikes();
      return result;
    } catch (err) {
      console.error('Failed to record swipe in swipeUser:', err);
      refreshLikes();
      return { success: false, isMatch: false };
    }
  }, [user?.id, refreshLikes]);

  useEffect(() => {
    if (!user?.id) {
      setMatches([]);
      setPeopleILiked([]);
      setPeopleWhoLikedMe([]);
      setIsMatchesLoading(false);
      setIsLikesLoading(false);
      return;
    }

    let isMounted = true;
    setIsMatchesLoading(true);
    setIsLikesLoading(true);

    refreshMatches();
    const unsubscribeMatches = subscribeUserMatches(user.id, () => {
      if (isMounted) refreshMatches();
    });

    refreshLikes();
    const unsubscribeLikes = subscribeUserLikes(user.id, () => {
      if (isMounted) refreshLikes();
    });

    // Instant WebSocket broadcast listener for user-specific events
    // Topic: user_alerts_${user.id} (100% matched with notificationService.ts)
    const alertChannel = supabase?.channel(`user_alerts_${user.id}`)
      .on('broadcast', { event: 'alert' }, ({ payload }) => {
        if (!isMounted) return;
        if (payload?.type === 'like') {
          if (payload.title && payload.body) {
            toast({
              title: payload.title,
              description: payload.body,
            });
          }
          if (payload.liker) {
            // Optimistic instant update for People Who Liked Me!
            setPeopleWhoLikedMe(prev => {
              const exists = (prev || []).some(u => u.id === payload.liker.id);
              if (exists) return prev;
              return [payload.liker as User, ...(prev || [])];
            });
          }
          refreshLikes();
        } else if (payload?.type === 'match') {
          if (payload.title && payload.body) {
            toast({
              title: payload.title,
              description: payload.body,
            });
          }
          if (payload.matchedUser && payload.matchId) {
            setMatches(prev => {
              const exists = (prev || []).some(m => m.id === payload.matchId);
              if (exists) return prev;
              return [{
                id: payload.matchId,
                users: [user.id, payload.matchedUser.id],
                lastMessage: '매칭되었습니다! 인사를 건네보세요.',
                lastMessageTimestamp: { toDate: () => new Date(), toMillis: () => Date.now() },
                unreadCounts: {},
                matchDate: { toDate: () => new Date(), toMillis: () => Date.now() },
                callStatus: 'idle',
              }, ...(prev || [])];
            });
          }
          refreshMatches();
          refreshLikes();
        } else if (payload?.type === 'message' || payload?.type === 'call') {
          refreshMatches();
        }
      })
      .subscribe();

    return () => {
      isMounted = false;
      unsubscribeMatches();
      unsubscribeLikes();
      if (alertChannel && supabase) {
        supabase.removeChannel(alertChannel);
      }
    };
  }, [user?.id, refreshMatches, refreshLikes]);

  const totalUnreadCount = (matches || []).reduce((acc, match) => {
    if (user && user.id && match.unreadCounts) {
      return acc + (match.unreadCounts[user.id] || 0);
    }
    return acc;
  }, 0);

  const updateUser = useCallback(async (newUserData: Partial<User>): Promise<void> => {
    const targetUid = user?.id || (typeof window !== 'undefined' ? (localStorage.getItem('aura_user_id') || localStorage.getItem('aura_temp_uid')) : null);
    if (!targetUid) {
      return Promise.reject(new Error("User not authenticated."));
    }

    const dataToSave: any = { ...newUserData, id: targetUid };

    // Supabase에 저장
    if (supabase) {
      try {
        const payload = toSupabaseUser(dataToSave);
        const { error } = await supabase.from('users').upsert(payload);
        if (error) {
          console.error("Supabase upsert error:", error);
        } else {
          if (typeof window !== 'undefined') {
            localStorage.setItem('aura_user_id', targetUid);
            localStorage.removeItem('aura_temp_uid');
          }
          setUser(prev => ({
            ...(prev || {}),
            ...newUserData,
            id: targetUid,
          } as User));
        }
      } catch (e) {
        console.error("Supabase user update exception:", e);
      }
    }
  }, [user?.id]);
  
  const updateFilters = useCallback((newFilters: Partial<FilterSettings>) => {
    setFilters(prevFilters => {
        const updatedFilters = { ...prevFilters, ...newFilters };
        try {
            localStorage.setItem('userFilters', JSON.stringify(updatedFilters));
        } catch (error) {
            console.error("Failed to save filters", error);
        }
        return updatedFilters;
    });
  }, []);

  const resetFilters = useCallback(() => {
    const isMale = user?.gender === '남성' || user?.gender?.toLowerCase().startsWith('m');
    const opposite: ('남성' | '여성' | '기타') = isMale ? '여성' : '남성';
    const defaultGender: ('남성' | '여성' | '기타')[] = user?.gender ? [opposite] : [];
    const resetValues: FilterSettings = { ...initialFilters, gender: defaultGender };
    setFilters(resetValues);
    try {
        localStorage.setItem('userFilters', JSON.stringify(resetValues));
    } catch (error) {
        console.error("Failed to reset filters", error);
    }
  }, [user?.gender]);

  const recaptchaVerifierRef = useRef<any>(null);

  const sendVerificationCode = useCallback(async (phoneNumberOverride?: string) => {
    const rawPhone = phoneNumberOverride || `${countryCode}${phoneNumber.startsWith('0') ? phoneNumber.substring(1) : phoneNumber}`;
    const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
    
    setIsSendingOtp(true);
    try {
      const res = await fetch('/api/auth/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', phoneNumber: cleanPhone }),
      });

      const data = await res.json();
      if (data.success) {
        toast({
          title: '인증번호 발송',
          description: data.message || '인증번호가 발송되었습니다.',
        });
        const detectedCode = data.testAuthCode || data.code;
        if (detectedCode) {
          setMockOtp(detectedCode);
          toast({
            title: '🧪 테스트 모드 인증번호',
            description: `[ ${detectedCode} ] 입력 후 인증을 진행해 주세요.`,
            duration: 10000,
          });
        } else {
          setMockOtp(null);
        }
        if (!phoneNumberOverride) {
          router.push('/signup/otp');
        }
        return 'sent';
      } else {
        toast({
          variant: 'destructive',
          title: '발송 실패',
          description: data.message || '인증번호 발송에 실패했습니다.',
        });
      }
    } catch (error: any) {
      console.error('SMS Send error:', error);
      toast({
        variant: 'destructive',
        title: '발송 오류',
        description: '문자 발송 중 오류가 발생했습니다.',
      });
    } finally {
      setIsSendingOtp(false);
    }
  }, [phoneNumber, countryCode, router, toast]);

  const verifyOtp = useCallback(async (otp: string) => {
    const rawPhone = `${countryCode}${phoneNumber.startsWith('0') ? phoneNumber.substring(1) : phoneNumber}`;
    const cleanPhone = rawPhone.replace(/[^0-9]/g, '');

    setIsVerifyingOtp(true);
    try {
      const res = await fetch('/api/auth/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', phoneNumber: cleanPhone, code: otp }),
      });

      const data = await res.json();
      if (data.success) {
        toast({
          title: '인증 성공',
          description: '휴대폰 번호 인증이 완료되었습니다.',
        });

        if (data.isExistingUser && data.user) {
          // 기존 회원인 경우: 로그인 처리 후 홈으로 이동 (Bug #2 해결)
          const loadedUser = fromSupabaseUser(data.user);
          setUser(loadedUser);
          if (typeof window !== 'undefined') {
            localStorage.setItem('aura_user_id', loadedUser.id);
          }
          router.push('/');
        } else {
          // 신규 회원인 경우: 임시 회원 번호 설정 후 프로필 작성 화면으로 이동
          const newUid = `user_${cleanPhone}`;
          if (typeof window !== 'undefined') {
            localStorage.setItem('aura_signup_phone', cleanPhone);
            localStorage.setItem('aura_temp_uid', newUid);
          }
          router.push('/signup/profile');
        }
      } else {
        toast({
          variant: 'destructive',
          title: '인증 실패',
          description: data.message || '인증번호가 일치하지 않습니다.',
        });
      }
    } catch (error: any) {
      console.error('Verify error:', error);
      toast({
        variant: 'destructive',
        title: '인증 오류',
        description: '인증 확인 중 오류가 발생했습니다.',
      });
    } finally {
      setIsVerifyingOtp(false);
    }
  }, [phoneNumber, countryCode, router, toast]);

  const reauthenticate = useCallback(async (otp: string) => {
    const cleanPhone = user?.phoneNumber?.replace(/[^0-9]/g, '') || '';
    if (!cleanPhone) throw new Error("전화번호 정보 부족");
    
    setIsVerifyingOtp(true);
    try {
      const res = await fetch('/api/auth/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', phoneNumber: cleanPhone, code: otp }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || '인증 실패');
      }
    } finally {
      setIsVerifyingOtp(false);
    }
  }, [user?.phoneNumber]);

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribeToPushNotifications = useCallback(async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
          toast({ variant: 'destructive', title: '푸시 알림 미지원', description: '이 브라우저는 푸시 알림을 지원하지 않습니다.' });
          return;
      }
      if (!user) return;

      try {
        if (typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') {
            toast({ variant: 'destructive', title: '알림 권한 필요', description: '푸시 알림을 받으시려면 브라우저 알림 권한을 허용해주세요.' });
            return;
          }
        }

        let registration = await navigator.serviceWorker.getRegistration();
        if (!registration) {
          registration = await navigator.serviceWorker.register('/sw.js');
        }
        await navigator.serviceWorker.ready;

        let subscription = await registration.pushManager.getSubscription();

        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidPublicKey) {
            console.error('VAPID public key is not defined in .env file.');
            toast({ variant: 'destructive', title: '설정 오류', description: '푸시 알림 설정에 오류가 발생했습니다.' });
            return;
        }

        const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: convertedVapidKey
          });
        }

        const subJson = subscription.toJSON();
        const isAlreadySaved = user.pushSubscriptions?.some(sub => sub.endpoint === subscription!.endpoint);
        if (!isAlreadySaved) {
            await updateUser({
                pushSubscriptions: [...(user.pushSubscriptions || []), subJson]
            });
        }

        // Send a welcome test notification to confirm it's working immediately
        sendWelcomePush(subJson).catch(() => {});
        
        toast({ title: '알림이 성공적으로 설정되었습니다.', description: '새로운 매치와 메시지 소식을 실시간으로 받아보실 수 있습니다.' });
      } catch (error) {
          console.error('Failed to subscribe to push notifications:', error);
          toast({ variant: 'destructive', title: '구독 실패', description: '푸시 알림 구독에 실패했습니다. 다시 시도해주세요.' });
      }
  }, [user, updateUser, toast]);

  // Auto-sync push subscription silently if browser permission is already granted
  useEffect(() => {
    if (!user?.id || typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

    navigator.serviceWorker.ready.then(async (registration) => {
      try {
        let subscription = await registration.pushManager.getSubscription();
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!subscription && vapidPublicKey) {
          const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedVapidKey,
          });
        }
        if (subscription) {
          const subJson = subscription.toJSON();
          const isAlreadySaved = user.pushSubscriptions?.some(
            (sub) => sub.endpoint === subscription!.endpoint
          );
          if (!isAlreadySaved) {
            updateUser({
              pushSubscriptions: [...(user.pushSubscriptions || []), subJson],
            });
          }
        }
      } catch (err) {
        // Silently catch background subscription check
      }
    }).catch(() => {});
  }, [user?.id]);


  const effectiveAuthUser: AuthUser | null = user
    ? {
        uid: user.id,
        phoneNumber: user.phoneNumber || '',
        email: user.email || '',
        displayName: user.name || '',
      }
    : (typeof window !== 'undefined' && localStorage.getItem('aura_temp_uid'))
    ? {
        uid: localStorage.getItem('aura_temp_uid')!,
        phoneNumber: localStorage.getItem('aura_signup_phone') || '',
        email: '',
        displayName: '',
      }
    : null;

  const value: UserContextType = {
    user,
    authUser: effectiveAuthUser,
    firestore: null,
    updateUser,
    notificationSettings,
    updateNotificationSettings,
    filters,
    updateFilters,
    resetFilters,
    isLoaded,
    totalUnreadCount,
    phoneAuth: {
      phoneNumber,
      setPhoneNumber,
      countryCode,
      setCountryCode,
      confirmationResult,
      sendVerificationCode,
      verifyOtp,
      reauthenticate,
      isSendingOtp,
      isVerifyingOtp,
      mockOtp,
      setMockOtp,
    },
    isSignupFlowActive,
    setIsSignupFlowActive,
    matches,
    isMatchesLoading,
    peopleILiked,
    peopleWhoLikedMe,
    isLikesLoading,
    subscribeToPushNotifications,
    refreshLikes,
    refreshMatches,
    swipeUser,
    isActionGateOpen,
    actionGateTitle,
    openActionGate,
    closeActionGate,
    requireActiveAdmission,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
      <VipActionGateModal
        isOpen={isActionGateOpen}
        onClose={closeActionGate}
        queuePosition={user?.queuePosition || 1}
        referralCode={user?.referralCode || 'AURA-VIP'}
        actionTitle={actionGateTitle}
      />
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
