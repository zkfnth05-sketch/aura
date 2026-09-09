// Web Audio API Ringtone & Vibration & Web Speech API Voice Engine

class EscapeCallAudioManager {
  private audioCtx: AudioContext | null = null;
  private ringtoneInterval: NodeJS.Timeout | null = null;
  private vibrationInterval: NodeJS.Timeout | null = null;
  private isRinging: boolean = false;

  private getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  /**
   * 벨소리 1회 버스트 합성 재생 (Web Audio API)
   * 아이폰 / 최신 스마트폰의 맑고 고급스러운 마림바 벨소리 화음 시퀀스
   */
  private playRingChime() {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;

      // 마림바/벨 화음 멜로디 (E5, G#5, B5, E6 음계)
      const notes = [
        { freq: 659.25, time: 0.0, dur: 0.2 },  // E5
        { freq: 830.61, time: 0.18, dur: 0.2 }, // G#5
        { freq: 987.77, time: 0.36, dur: 0.25 }, // B5
        { freq: 1318.51, time: 0.56, dur: 0.5 }, // E6
        // 2차 반음계 울림
        { freq: 987.77, time: 0.9, dur: 0.2 },
        { freq: 1318.51, time: 1.1, dur: 0.4 },
      ];

      notes.forEach(({ freq, time, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // 둥글고 부드러운 사인파 + 삼각파 결합
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + time);

        // 벨 어택 & 디케이 엔벨로프
        gain.gain.setValueAtTime(0.001, now + time);
        gain.gain.exponentialRampToValueAtTime(0.35, now + time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + time);
        osc.stop(now + time + dur);
      });
    } catch (e) {
      console.error('Failed to synthesize ring chime:', e);
    }
  }

  /**
   * 벨소리 및 스마트폰 진동 반복 루프 시작
   */
  public startRinging() {
    if (this.isRinging) return;
    this.isRinging = true;

    // 1. 벨소리 즉시 1회 재생 및 2.4초 간격 반복
    this.playRingChime();
    this.ringtoneInterval = setInterval(() => {
      if (this.isRinging) {
        this.playRingChime();
      }
    }, 2400);

    // 2. 스마트폰 실제 진동 루프 (1초 울림, 0.4초 쉼, 1초 울림)
    const triggerVibration = () => {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate([1000, 400, 1000, 400]);
        } catch (_) {}
      }
    };

    triggerVibration();
    this.vibrationInterval = setInterval(triggerVibration, 2800);
  }

  /**
   * 벨소리 및 진동 중지
   */
  public stopRinging() {
    this.isRinging = false;
    if (this.ringtoneInterval) {
      clearInterval(this.ringtoneInterval);
      this.ringtoneInterval = null;
    }
    if (this.vibrationInterval) {
      clearInterval(this.vibrationInterval);
      this.vibrationInterval = null;
    }
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(0);
      } catch (_) {}
    }
  }

  /**
   * 통화 수락 시: 수화기 너머 실제 상대방 음성 재생 (Web Speech API)
   */
  public speakVoiceScript(text: string, onEnd?: () => void) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    try {
      window.speechSynthesis.cancel(); // 이전 음성 정리

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ko-KR';
      utterance.rate = 1.08; // 약간 다급한 톤
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // 한국어 음성 탐색
      const voices = window.speechSynthesis.getVoices();
      const koVoice = voices.find((v) => v.lang === 'ko-KR' || v.lang.startsWith('ko'));
      if (koVoice) {
        utterance.voice = koVoice;
      }

      if (onEnd) {
        utterance.onend = onEnd;
      }

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error('Failed to speak escape voice script:', e);
    }
  }

  /**
   * 음성 재생 중지
   */
  public stopVoiceScript() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (_) {}
    }
  }
}

export const escapeCallAudio = new EscapeCallAudioManager();
