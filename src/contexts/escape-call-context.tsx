'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { escapeCallAudio } from '@/lib/escapeCallAudio';
import { useToast } from '@/hooks/use-toast';

export type EscapePersonaKey = 'boss' | 'mom' | 'friend' | 'vet';

export interface EscapePersona {
  key: EscapePersonaKey;
  callerName: string;
  subtitle: string;
  tag: string;
  spokenAudio: string;
  teleprompterScript: string;
  avatarText: string;
  iconBg: string;
}

export const ESCAPE_PERSONAS: Record<EscapePersonaKey, EscapePersona> = {
  boss: {
    key: 'boss',
    callerName: '회사 김팀장님',
    subtitle: '직장 · 긴급',
    tag: '업무 비상',
    spokenAudio: '어 김대리님? 지금 고객사 긴급 장애 터져서 팀원들 다 모이고 있어요. 혹시 지금 바로 사무실 복귀 가능하세요?',
    teleprompterScript: '아 팀장님! 지금요? 네 알겠습니다, 큰일이네요.. 지금 바로 택시 잡고 들어가겠습니다!',
    avatarText: '👔',
    iconBg: 'bg-blue-500/20 text-blue-400',
  },
  mom: {
    key: 'mom',
    callerName: '엄마 ❤️',
    subtitle: '가족 · 긴급',
    tag: '본가 비상',
    spokenAudio: '딸~ 지금 집에 보일러 배관 터져서 물난리 났어! 너 언제 와? 빨리 와서 이것 좀 잠가야 해!',
    teleprompterScript: '어 엄마?! 물이 샌다고? 알았어 지금 바로 갈게, 밸브부터 잠그고 있어!',
    avatarText: '👩',
    iconBg: 'bg-pink-500/20 text-pink-400',
  },
  friend: {
    key: 'friend',
    callerName: '자취방 룸메 지은이 👭',
    subtitle: '친구',
    tag: '친구 SOS',
    spokenAudio: '야! 나 현관문 도어락 배터리 방전돼서 밖에서 갇혔어 ㅠㅠ 비상키 어디 있어? 나 얼어 죽겠어 빨리 와줘 제발!',
    teleprompterScript: '야 너 도어락 또 방전됐어? ㅠㅠ 알았어 지금 바로 갈 테니까 1층 카페에 들어가 있어!',
    avatarText: '👭',
    iconBg: 'bg-amber-500/20 text-amber-400',
  },
  vet: {
    key: 'vet',
    callerName: '24시 동물병원 원장님 🏥',
    subtitle: '병원',
    tag: '반려동물 비상',
    spokenAudio: '보호자님, 낮에 받으신 검사 결과에 급히 상의드릴 부분이 있어서요. 가능하시면 지금 바로 내원 부탁드립니다.',
    teleprompterScript: '원장님! 우리 아기 상태가 안 좋은가요? 네, 지금 바로 병원으로 가겠습니다!',
    avatarText: '🐾',
    iconBg: 'bg-emerald-500/20 text-emerald-400',
  },
};

interface EscapeCallContextType {
  isConfigOpen: boolean;
  isRinging: boolean;
  isInCall: boolean;
  personaKey: EscapePersonaKey;
  countdown: number | null;
  openConfigModal: () => void;
  closeConfigModal: () => void;
  setPersonaKey: (key: EscapePersonaKey) => void;
  scheduleCall: (seconds: number, persona?: EscapePersonaKey) => void;
  cancelScheduledCall: () => void;
  acceptCall: () => void;
  endCall: () => void;
}

const EscapeCallContext = createContext<EscapeCallContextType | undefined>(undefined);

export function EscapeCallProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isRinging, setIsRinging] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [personaKey, setPersonaKey] = useState<EscapePersonaKey>('boss');
  const [countdown, setCountdown] = useState<number | null>(null);

  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 컴포넌트 언마운트 시 오디오 및 타이머 정리
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      escapeCallAudio.stopRinging();
      escapeCallAudio.stopVoiceScript();
    };
  }, []);

  const openConfigModal = () => setIsConfigOpen(true);
  const closeConfigModal = () => setIsConfigOpen(false);

  const triggerCallNow = (selectedPersonaKey: EscapePersonaKey) => {
    setIsRinging(true);
    setIsInCall(false);
    escapeCallAudio.startRinging();
  };

  const scheduleCall = (seconds: number, customPersona?: EscapePersonaKey) => {
    const targetPersona = customPersona || personaKey;
    if (customPersona) {
      setPersonaKey(customPersona);
    }

    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    setCountdown(seconds);
    setIsConfigOpen(false);

    toast({
      title: '🚨 안심 탈출 전화가 예약되었습니다!',
      description: `${seconds}초 뒤 [${ESCAPE_PERSONAS[targetPersona].callerName}]에게서 실제 수신 전화가 걸려옵니다.`,
    });

    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          triggerCallNow(targetPersona);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const cancelScheduledCall = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setCountdown(null);
    toast({
      title: '탈출 전화 예약 취소',
      description: '예약된 가짜 전화가 취소되었습니다.',
    });
  };

  const acceptCall = () => {
    setIsRinging(false);
    setIsInCall(true);
    escapeCallAudio.stopRinging();

    const persona = ESCAPE_PERSONAS[personaKey];
    // 통화 연결 0.6초 후 음성 재생
    setTimeout(() => {
      escapeCallAudio.speakVoiceScript(persona.spokenAudio);
    }, 600);
  };

  const endCall = () => {
    setIsRinging(false);
    setIsInCall(false);
    escapeCallAudio.stopRinging();
    escapeCallAudio.stopVoiceScript();

    toast({
      title: '🎉 탈출 완료를 응원합니다!',
      description: '상대방에게 자연스럽게 작별을 고하고 조심히 귀가하세요 ☕',
    });
  };

  return (
    <EscapeCallContext.Provider
      value={{
        isConfigOpen,
        isRinging,
        isInCall,
        personaKey,
        countdown,
        openConfigModal,
        closeConfigModal,
        setPersonaKey,
        scheduleCall,
        cancelScheduledCall,
        acceptCall,
        endCall,
      }}
    >
      {children}
    </EscapeCallContext.Provider>
  );
}

export function useEscapeCall() {
  const context = useContext(EscapeCallContext);
  if (!context) {
    throw new Error('useEscapeCall must be used within an EscapeCallProvider');
  }
  return context;
}
