'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  ShieldAlert,
  PhoneCall,
  Clock,
  Volume2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  XCircle,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useEscapeCall, ESCAPE_PERSONAS, EscapePersonaKey } from '@/contexts/escape-call-context';
import { cn } from '@/lib/utils';

const TIME_OPTIONS = [
  { seconds: 10, label: '10초 뒤', desc: '사전 테스트 / 즉시' },
  { seconds: 60, label: '⏱️ 1분 뒤', desc: '화장실 골든타임', recommended: true },
  { seconds: 180, label: '3분 뒤', desc: '식사 시작 후' },
  { seconds: 300, label: '5분 뒤', desc: '여유 있는 타이밍' },
];

export default function EscapeCallConfigDialog() {
  const {
    isConfigOpen,
    closeConfigModal,
    personaKey,
    setPersonaKey,
    scheduleCall,
    countdown,
    cancelScheduledCall,
  } = useEscapeCall();

  const [selectedSeconds, setSelectedSeconds] = useState(60);
  const [isGuideExpanded, setIsGuideExpanded] = useState(true);

  const activePersona = ESCAPE_PERSONAS[personaKey];

  const handleStartSchedule = () => {
    scheduleCall(selectedSeconds, personaKey);
  };

  return (
    <Dialog open={isConfigOpen} onOpenChange={(open) => !open && closeConfigModal()}>
      <DialogContent className="max-w-md bg-zinc-950/95 border border-pink-500/30 text-white p-6 rounded-3xl shadow-2xl backdrop-blur-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-2 text-left">
          <DialogTitle className="flex items-center gap-2.5 text-xl font-bold">
            <span className="p-2 rounded-2xl bg-gradient-to-tr from-pink-600 to-rose-500 text-white shadow-lg shadow-pink-500/20">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <span>여성 안심 탈출 가짜 전화</span>
          </DialogTitle>
          <DialogDescription className="text-zinc-400 text-xs leading-relaxed">
            첫 만남 자리가 어색하거나 위험할 때, 통화 수신과 음성 대본으로 상대방 기분 상하지 않게 100% 자연스럽게 빠져나갈 수 있는 안심 비상벨입니다.
          </DialogDescription>
        </DialogHeader>

        {/* Live Pending Banner (if active) */}
        {countdown !== null && (
          <div className="bg-pink-500/15 border border-pink-500/30 rounded-2xl p-4 flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-3">
              <PhoneCall className="w-5 h-5 text-pink-400 animate-bounce" />
              <div>
                <p className="text-xs font-semibold text-pink-300">
                  [{activePersona.callerName}] 전화 대기 중
                </p>
                <p className="text-lg font-mono font-bold text-white">
                  {countdown}초 뒤 자동 수신
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={cancelScheduledCall}
              className="text-xs text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              <XCircle className="w-4 h-4 mr-1 text-red-400" />
              예약 취소
            </Button>
          </div>
        )}

        {/* Expandable Guide Card */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden transition-all">
          <button
            type="button"
            onClick={() => setIsGuideExpanded(!isGuideExpanded)}
            className="w-full flex items-center justify-between p-3.5 text-left hover:bg-zinc-800/50 transition-colors"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-pink-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>실패 확률 0%! 3단계 실전 탈출 요령</span>
            </div>
            {isGuideExpanded ? (
              <ChevronUp className="w-4 h-4 text-zinc-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-zinc-400" />
            )}
          </button>

          {isGuideExpanded && (
            <div className="px-3.5 pb-4 space-y-2.5 text-xs text-zinc-300 border-t border-zinc-800/60 pt-3">
              <div className="flex items-start gap-2">
                <span className="flex-shrink-0 w-4 h-4 rounded-full bg-pink-500/20 text-pink-400 font-bold flex items-center justify-center text-[10px]">
                  1
                </span>
                <p className="leading-snug">
                  <strong>화장실 갈 때 예약</strong>: &ldquo;잠깐 화장실 다녀올게요~&rdquo; 하고 일어나며 <strong>[1분 뒤]</strong> 버튼을 누릅니다.
                </p>
              </div>

              <div className="flex items-start gap-2">
                <span className="flex-shrink-0 w-4 h-4 rounded-full bg-pink-500/20 text-pink-400 font-bold flex items-center justify-center text-[10px]">
                  2
                </span>
                <p className="leading-snug">
                  <strong>자연스럽게 착석</strong>: 손을 씻고 자리에 앉아 물 한 모금 마시면, 테이블 위에서 스마트폰이 진동과 함께 진짜 전화처럼 울립니다.
                </p>
              </div>

              <div className="flex items-start gap-2">
                <span className="flex-shrink-0 w-4 h-4 rounded-full bg-pink-500/20 text-pink-400 font-bold flex items-center justify-center text-[10px]">
                  3
                </span>
                <p className="leading-snug">
                  <strong>대본 읽고 탈출</strong>: 전화를 받으면 수화기에서 다급한 목소리가 나오고 화면에 대본이 뜹니다. &ldquo;네 팀장님! 바로 가겠습니다!&rdquo; 그대로 읽고 깔끔하게 일어나시면 됩니다.
                </p>
              </div>

              <div className="bg-pink-950/40 border border-pink-800/40 rounded-xl p-2.5 flex items-center gap-2 text-[11px] text-pink-300 mt-1">
                <Volume2 className="w-4 h-4 text-pink-400 flex-shrink-0" />
                <span>
                  <strong>볼륨 꿀팁</strong>: 미디어 음량을 40~50%로 맞춰두면 상대방 귀에도 급한 목소리가 살짝 들려 완벽한 신뢰를 줍니다.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Step 1: Persona Selection */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
            <span>1. 발신자 선택 (상황 맞춤 핑계)</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(ESCAPE_PERSONAS) as EscapePersonaKey[]).map((key) => {
              const p = ESCAPE_PERSONAS[key];
              const isSelected = personaKey === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setPersonaKey(key)}
                  className={cn(
                    'flex flex-col text-left p-3 rounded-2xl border transition-all relative',
                    isSelected
                      ? 'bg-pink-500/15 border-pink-500 shadow-md shadow-pink-500/10'
                      : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-400'
                  )}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-xl">{p.avatarText}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-medium">
                      {p.tag}
                    </span>
                  </div>
                  <span className={cn('text-xs font-bold', isSelected ? 'text-white' : 'text-zinc-300')}>
                    {p.callerName}
                  </span>
                  <span className="text-[10px] text-zinc-500 truncate">{p.subtitle}</span>
                  {isSelected && (
                    <CheckCircle2 className="w-4 h-4 text-pink-400 absolute top-2 right-2" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Time Option */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-pink-400" />
            <span>2. 언제 전화가 걸려오게 할까요?</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {TIME_OPTIONS.map((opt) => {
              const isSelected = selectedSeconds === opt.seconds;
              return (
                <button
                  key={opt.seconds}
                  type="button"
                  onClick={() => setSelectedSeconds(opt.seconds)}
                  className={cn(
                    'flex flex-col p-2.5 rounded-xl border text-left transition-all',
                    isSelected
                      ? 'bg-pink-500/20 border-pink-400 text-white shadow-sm'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">{opt.label}</span>
                    {opt.recommended && (
                      <span className="text-[9px] bg-pink-500 text-white px-1.5 py-0.2 rounded-full font-bold">
                        추천
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-500 mt-0.5">{opt.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 space-y-2">
          <Button
            type="button"
            onClick={handleStartSchedule}
            className="w-full py-6 rounded-2xl bg-gradient-to-r from-pink-600 via-rose-500 to-pink-500 text-white font-bold text-sm shadow-xl shadow-pink-500/25 hover:opacity-95 transition-all flex items-center justify-center gap-2"
          >
            <PhoneCall className="w-5 h-5 animate-pulse" />
            <span>{selectedSeconds}초 뒤 탈출 전화 예약하기</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={closeConfigModal}
            className="w-full text-zinc-400 hover:text-zinc-200 text-xs py-2"
          >
            닫기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
