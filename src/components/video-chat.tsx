'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { PhoneOff, Mic, MicOff, Video, VideoOff, Loader2, Languages } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/language-context';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { supabase } from '@/lib/supabaseClient';
import { updateMatchCallStatus } from '@/lib/supabaseDataService';
import { getChatTranslation } from '@/actions/ai-actions';
import { cn } from '@/lib/utils';

// Public STUN servers for WebRTC peer connection
const configuration: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
  ],
};

const STT_LANG_MAP: Record<string, string> = {
  ko: 'ko-KR',
  en: 'en-US',
  ja: 'ja-JP',
  es: 'es-ES',
};

const TARGET_LANG_NAME_MAP: Record<string, string> = {
  ko: 'Korean',
  en: 'English',
  ja: 'Japanese',
  es: 'Spanish',
};

const LANG_DISPLAY_NAME: Record<string, string> = {
  ko: '한국어',
  en: 'English',
  ja: '日本語',
  es: 'Español',
};

interface VideoChatProps {
  localUser: User;
  remoteUser: User;
  matchId: string;
  isCaller?: boolean;
  onEndCall: () => void;
}

export default function VideoChat({
  localUser,
  remoteUser,
  matchId,
  isCaller: initialIsCaller,
  onEndCall,
}: VideoChatProps) {
  const { toast } = useToast();
  const { t } = useLanguage();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pc = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const remoteCandidateQueue = useRef<RTCIceCandidate[]>([]);
  const localCandidateQueue = useRef<RTCIceCandidate[]>([]);
  const hasSentOffer = useRef(false);

  const [hasPermissions, setHasPermissions] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isConnecting, setIsConnecting] = useState(true);

  // 실시간 AI 동시통역 자막 상태 및 참조
  const [isSubtitlesEnabled, setIsSubtitlesEnabled] = useState(true);
  const [remoteSubtitle, setRemoteSubtitle] = useState<{
    text: string;
    original: string;
    senderName: string;
    timestamp: number;
  } | null>(null);
  const [localSpeechText, setLocalSpeechText] = useState<string>('');

  const subtitleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const localSpeechTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);
  const channelRef = useRef<any>(null);

  const handleEndCall = useCallback(() => {
    updateMatchCallStatus(matchId, 'idle', null);
    onEndCall();
  }, [matchId, onEndCall]);

  useEffect(() => {
    if (!matchId || !supabase) return;
    const client = supabase;

    let isMounted = true;
    let pingTimer: NodeJS.Timeout | null = null;
    let fallbackTimer: NodeJS.Timeout | null = null;

    const channel = client.channel(`call_signaling_${matchId}`, {
      config: { broadcast: { self: false } },
    });
    channelRef.current = channel;

    const sendOffer = async (peerConn: RTCPeerConnection) => {
      try {
        if (peerConn.signalingState === 'have-local-offer' && peerConn.localDescription) {
          await channel.send({
            type: 'broadcast',
            event: 'offer',
            payload: {
              offer: { type: peerConn.localDescription.type, sdp: peerConn.localDescription.sdp },
              senderId: localUser.id,
            },
          });
          return;
        }

        if (hasSentOffer.current && peerConn.signalingState !== 'stable') return;
        hasSentOffer.current = true;

        const offer = await peerConn.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });
        await peerConn.setLocalDescription(offer);

        await channel.send({
          type: 'broadcast',
          event: 'offer',
          payload: {
            offer: { type: offer.type, sdp: offer.sdp },
            senderId: localUser.id,
          },
        });
      } catch (err) {
        console.error('Failed to create/send offer:', err);
      }
    };

    const initWebRTC = async () => {
      try {
        // 1. Get user media (with graceful fallback)
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
            audio: true,
          });
        } catch (mediaErr) {
          // If camera fails, fallback to audio only
          try {
            stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
            setIsCameraOn(false);
          } catch (audioErr) {
            console.error('No media devices available:', mediaErr, audioErr);
            setHasPermissions(false);
            return;
          }
        }

        streamRef.current = stream;
        setHasPermissions(true);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // 2. Create RTCPeerConnection
        const peerConn = new RTCPeerConnection(configuration);
        pc.current = peerConn;

        // Add local tracks to peer connection
        stream.getTracks().forEach((track) => {
          peerConn.addTrack(track, stream);
        });

        // Remote stream received
        peerConn.ontrack = (event) => {
          if (remoteVideoRef.current && event.streams[0]) {
            remoteVideoRef.current.srcObject = event.streams[0];
            setIsConnecting(false);
          }
        };

        // Local ICE candidate generated -> send to peer
        peerConn.onicecandidate = (event) => {
          if (event.candidate) {
            localCandidateQueue.current.push(event.candidate);
            channel.send({
              type: 'broadcast',
              event: 'candidate',
              payload: {
                candidate: event.candidate.toJSON(),
                senderId: localUser.id,
              },
            });
          }
        };

        // Connection state changed
        peerConn.onconnectionstatechange = () => {
          if (peerConn.connectionState === 'connected') {
            setIsConnecting(false);
            if (pingTimer) clearInterval(pingTimer);
          }
        };

        // Check if current user is the caller
        let isCaller = initialIsCaller ?? false;
        if (initialIsCaller === undefined) {
          const { data: matchData } = await client
            .from('matches')
            .select('caller_id')
            .eq('id', matchId)
            .maybeSingle();
          isCaller = matchData?.caller_id === localUser.id;
        }

        // 3. Listen for signaling broadcast events
        channel
          // Peer ping: Caller pings Callee until connection is ready
          .on('broadcast', { event: 'peer_ping' }, ({ payload }) => {
            if (payload.senderId !== localUser.id) {
              // Callee responds to ping with peer_ready
              channel.send({
                type: 'broadcast',
                event: 'peer_ready',
                payload: { senderId: localUser.id },
              });
            }
          })
          // Peer ready: Peer entered call -> Caller creates offer
          .on('broadcast', { event: 'peer_ready' }, async ({ payload }) => {
            if (payload.senderId !== localUser.id && isCaller && pc.current) {
              if (pingTimer) clearInterval(pingTimer);
              await sendOffer(pc.current);
            }
          })
          // Offer received: Callee accepts offer and sends answer
          .on('broadcast', { event: 'offer' }, async ({ payload }) => {
            if (payload.senderId !== localUser.id && pc.current) {
              try {
                await pc.current.setRemoteDescription(new RTCSessionDescription(payload.offer));

                // Flush queued remote ICE candidates
                while (remoteCandidateQueue.current.length > 0) {
                  const queuedCand = remoteCandidateQueue.current.shift();
                  if (queuedCand) {
                    await pc.current.addIceCandidate(queuedCand).catch(console.warn);
                  }
                }

                const answer = await pc.current.createAnswer();
                await pc.current.setLocalDescription(answer);

                await channel.send({
                  type: 'broadcast',
                  event: 'answer',
                  payload: {
                    answer: { type: answer.type, sdp: answer.sdp },
                    senderId: localUser.id,
                  },
                });

                // Flush any generated local ICE candidates to caller
                localCandidateQueue.current.forEach((cand) => {
                  channel.send({
                    type: 'broadcast',
                    event: 'candidate',
                    payload: {
                      candidate: cand.toJSON(),
                      senderId: localUser.id,
                    },
                  });
                });
              } catch (err) {
                console.error('Failed to handle remote offer:', err);
              }
            }
          })
          // Answer received: Caller sets remote description
          .on('broadcast', { event: 'answer' }, async ({ payload }) => {
            if (payload.senderId !== localUser.id && pc.current) {
              try {
                if (pc.current.signalingState === 'have-local-offer') {
                  await pc.current.setRemoteDescription(new RTCSessionDescription(payload.answer));

                  // Flush queued remote ICE candidates
                  while (remoteCandidateQueue.current.length > 0) {
                    const queuedCand = remoteCandidateQueue.current.shift();
                    if (queuedCand) {
                      await pc.current.addIceCandidate(queuedCand).catch(console.warn);
                    }
                  }

                  // Flush any generated local ICE candidates to peer
                  localCandidateQueue.current.forEach((cand) => {
                    channel.send({
                      type: 'broadcast',
                      event: 'candidate',
                      payload: {
                        candidate: cand.toJSON(),
                        senderId: localUser.id,
                      },
                    });
                  });
                }
              } catch (err) {
                console.error('Failed to set remote answer:', err);
              }
            }
          })
          // Remote ICE Candidate received
          .on('broadcast', { event: 'candidate' }, async ({ payload }) => {
            if (payload.senderId !== localUser.id && pc.current) {
              const candidate = new RTCIceCandidate(payload.candidate);
              if (pc.current.remoteDescription && pc.current.remoteDescription.type) {
                await pc.current.addIceCandidate(candidate).catch(console.warn);
              } else {
                remoteCandidateQueue.current.push(candidate);
              }
            }
          })
          // End call event from peer
          .on('broadcast', { event: 'end_call' }, () => {
            if (isMounted) {
              onEndCall();
            }
          })
          // Live voice subtitle event from peer
          .on('broadcast', { event: 'live_subtitle' }, ({ payload }) => {
            if (payload.senderId !== localUser.id) {
              setRemoteSubtitle({
                text: payload.translatedText || payload.originalText,
                original: payload.originalText,
                senderName: payload.senderName,
                timestamp: Date.now(),
              });

              if (subtitleTimerRef.current) clearTimeout(subtitleTimerRef.current);
              subtitleTimerRef.current = setTimeout(() => {
                setRemoteSubtitle(null);
              }, 6000);
            }
          })
          // Subscribed to Realtime channel
          .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
              if (isCaller) {
                // Caller sends ping every 1.5s until Callee responds
                pingTimer = setInterval(() => {
                  if (pc.current?.connectionState === 'connected') {
                    if (pingTimer) clearInterval(pingTimer);
                    return;
                  }
                  channel.send({
                    type: 'broadcast',
                    event: 'peer_ping',
                    payload: { senderId: localUser.id },
                  });
                }, 1500);

                // Fallback: If no response after 3s, send offer directly
                fallbackTimer = setTimeout(() => {
                  if (pc.current && !hasSentOffer.current) {
                    sendOffer(pc.current);
                  }
                }, 3000);
              } else {
                // Callee announces readiness immediately
                channel.send({
                  type: 'broadcast',
                  event: 'peer_ready',
                  payload: { senderId: localUser.id },
                });
              }
            }
          });
      } catch (err: any) {
        console.warn('WebRTC init error:', err);
        setHasPermissions(false);
      }
    };

    initWebRTC();

    return () => {
      isMounted = false;
      channelRef.current = null;
      if (pingTimer) clearInterval(pingTimer);
      if (fallbackTimer) clearTimeout(fallbackTimer);
      if (subtitleTimerRef.current) clearTimeout(subtitleTimerRef.current);
      if (localSpeechTimerRef.current) clearTimeout(localSpeechTimerRef.current);

      channel.send({
        type: 'broadcast',
        event: 'end_call',
        payload: { senderId: localUser.id },
      });

      client.removeChannel(channel);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      pc.current?.close();
    };
  }, [matchId, localUser.id, initialIsCaller, onEndCall]);

  // 실시간 음성 인식 (STT) 및 AI 번역 파이프라인
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      console.warn('SpeechRecognition is not supported in this browser environment.');
      return;
    }

    if (!isSubtitlesEnabled || !isMicOn) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
        recognitionRef.current = null;
      }
      return;
    }

    let isDestroyed = false;
    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = STT_LANG_MAP[localUser.language || 'ko'] || 'ko-KR';

    recognition.onresult = async (event: any) => {
      if (isDestroyed) return;
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      if (interim.trim()) {
        setLocalSpeechText(interim.trim());
      }

      if (final.trim()) {
        const textToTranslate = final.trim();
        setLocalSpeechText(textToTranslate);

        if (localSpeechTimerRef.current) clearTimeout(localSpeechTimerRef.current);
        localSpeechTimerRef.current = setTimeout(() => {
          setLocalSpeechText('');
        }, 4000);

        try {
          const isSameLanguage = (localUser.language || 'ko') === (remoteUser.language || 'ko');
          let translatedText = textToTranslate;

          if (!isSameLanguage) {
            const targetLang = TARGET_LANG_NAME_MAP[remoteUser.language || 'ko'] || 'Korean';
            const translationResult = await getChatTranslation({
              text: textToTranslate,
              targetLanguage: targetLang,
            });
            if (translationResult.translatedText) {
              translatedText = translationResult.translatedText;
            }
          }

          if (channelRef.current) {
            await channelRef.current.send({
              type: 'broadcast',
              event: 'live_subtitle',
              payload: {
                senderId: localUser.id,
                senderName: localUser.name,
                originalText: textToTranslate,
                translatedText,
                timestamp: Date.now(),
              },
            });
          }
        } catch (err) {
          console.warn('Live subtitle translation / broadcast error:', err);
        }
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'no-speech' || event.error === 'aborted') {
        return;
      }
      console.warn('SpeechRecognition error:', event.error);
    };

    recognition.onend = () => {
      if (!isDestroyed && isSubtitlesEnabled && isMicOn) {
        try {
          recognition.start();
        } catch (_) {}
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.warn('Failed to start SpeechRecognition:', err);
    }

    return () => {
      isDestroyed = true;
      try {
        recognition.abort();
      } catch (_) {}
      recognitionRef.current = null;
      if (localSpeechTimerRef.current) clearTimeout(localSpeechTimerRef.current);
    };
  }, [isSubtitlesEnabled, isMicOn, localUser.language, remoteUser.language, localUser.id, localUser.name]);

  const toggleSubtitles = () => {
    const SpeechRecognitionClass = typeof window !== 'undefined'
      ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      : null;

    if (!SpeechRecognitionClass) {
      toast({
        variant: "destructive",
        title: t('live_subtitle_badge'),
        description: t('live_subtitle_unsupported'),
      });
      return;
    }

    const nextState = !isSubtitlesEnabled;
    setIsSubtitlesEnabled(nextState);
    toast({
      title: nextState ? t('live_subtitle_on') : t('live_subtitle_off'),
      description: nextState 
        ? `${LANG_DISPLAY_NAME[localUser.language || 'ko'] || '한국어'} ⇄ ${LANG_DISPLAY_NAME[remoteUser.language || 'ko'] || 'English'} AI 실시간 통역이 활성화되었습니다.`
        : '자막 및 음성 인식이 일시 중지되었습니다.',
    });
  };

  const toggleMic = () => {
    if (streamRef.current) {
      const enabled = !isMicOn;
      streamRef.current.getAudioTracks().forEach((t) => (t.enabled = enabled));
      setIsMicOn(enabled);
    }
  };

  const toggleCamera = () => {
    if (streamRef.current) {
      const enabled = !isCameraOn;
      streamRef.current.getVideoTracks().forEach((t) => (t.enabled = enabled));
      setIsCameraOn(enabled);
    }
  };

  return (
    <div className="relative h-screen w-full bg-zinc-950 flex flex-col items-center justify-center overflow-hidden">
      {/* Remote Video Stream (Main) */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Live AI Interpretation Top Badge */}
      <div className="absolute top-6 left-6 z-30 flex items-center gap-2.5 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/15 shadow-xl text-xs font-semibold text-white">
        <span className="relative flex h-2.5 w-2.5">
          {isSubtitlesEnabled ? (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </>
          ) : (
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-zinc-500"></span>
          )}
        </span>
        <span className="font-bold tracking-wide">
          {t('live_subtitle_badge')}
        </span>
        <span className="text-[11px] text-zinc-300/80 font-normal">
          ({LANG_DISPLAY_NAME[localUser.language || 'ko'] || '한국어'} ⇄ {LANG_DISPLAY_NAME[remoteUser.language || 'ko'] || 'English'})
        </span>
      </div>

      {/* Permission Denied / Device Not Found Alert */}
      {!hasPermissions && (
        <div className="absolute inset-0 h-full w-full bg-zinc-900 flex flex-col items-center justify-center p-4 z-20">
          <Alert variant="destructive" className="max-w-sm">
            <AlertTitle>{t('camera_permission_denied_title')}</AlertTitle>
            <AlertDescription>{t('media_device_not_found_desc')}</AlertDescription>
          </Alert>
          <Button onClick={handleEndCall} className="mt-4" variant="secondary">
            {t('back_button')}
          </Button>
        </div>
      )}

      {/* Connecting Overlay with Spinner */}
      {isConnecting && hasPermissions && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-20">
          <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
          <p className="text-white text-lg font-medium">{(t('chat_connecting') || '').replace('...', '')}</p>
          <p className="text-zinc-400 text-sm mt-1">{remoteUser?.name || '상대방'}님과 연결 중...</p>
        </div>
      )}

      {/* Local Video Stream (Picture-in-Picture) */}
      <div className="absolute top-6 right-6 w-32 h-44 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl z-30 bg-zinc-900">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover scale-x-[-1]"
        />
        {!isCameraOn && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-800">
            <VideoOff className="w-8 h-8 text-zinc-500" />
          </div>
        )}
      </div>

      {/* Live Voice Subtitle Overlay (Netflix Glassmorphism Style) */}
      {isSubtitlesEnabled && (
        <div className="absolute bottom-32 left-4 right-4 md:left-1/4 md:right-1/4 flex flex-col items-center justify-center z-30 pointer-events-none space-y-2">
          {/* Local speaking live preview pill */}
          {localSpeechText && (
            <div className="bg-primary/25 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-primary/40 text-xs font-medium text-white flex items-center gap-1.5 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-150">
              <span className="animate-pulse">🎙️</span>
              <span className="text-zinc-300 font-semibold">{t('live_subtitle_speaking')}</span>
              <span className="text-white truncate max-w-xs">{localSpeechText}</span>
            </div>
          )}

          {/* Remote peer incoming translated subtitle */}
          {remoteSubtitle && (
            <div className="bg-black/75 backdrop-blur-xl px-6 py-3.5 rounded-2xl border border-white/15 shadow-[0_12px_40px_rgba(0,0,0,0.6)] max-w-lg w-full text-center space-y-1 animate-in fade-in zoom-in-95 duration-200">
              <p className="text-base md:text-lg font-bold text-white tracking-wide leading-snug drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                {remoteSubtitle.text}
              </p>
              {remoteSubtitle.original && remoteSubtitle.original !== remoteSubtitle.text && (
                <p className="text-xs text-zinc-400 font-medium italic drop-shadow line-clamp-1">
                  {remoteSubtitle.original}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Bottom Floating Control Bar */}
      <div className="absolute bottom-12 flex items-center gap-4 md:gap-6 z-40">
        <Button
          onClick={toggleMic}
          variant="outline"
          size="icon"
          disabled={!hasPermissions}
          className={`w-14 h-14 rounded-full border-none ${
            isMicOn ? 'bg-white/10 hover:bg-white/20' : 'bg-red-500 hover:bg-red-600'
          } text-white backdrop-blur-md transition-all`}
        >
          {isMicOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
        </Button>

        {/* Live Subtitle (CC) Toggle Button */}
        <Button
          onClick={toggleSubtitles}
          variant="outline"
          size="icon"
          className={cn(
            "w-14 h-14 rounded-full border-none text-white backdrop-blur-md transition-all shadow-lg",
            isSubtitlesEnabled 
              ? "bg-primary hover:bg-primary/90 shadow-primary/40 ring-2 ring-primary/40" 
              : "bg-white/10 hover:bg-white/20 text-zinc-400"
          )}
          title={isSubtitlesEnabled ? t('live_subtitle_on') : t('live_subtitle_off')}
        >
          <Languages className="w-6 h-6" />
        </Button>

        <Button
          onClick={handleEndCall}
          variant="destructive"
          size="icon"
          className="w-16 h-16 rounded-full shadow-lg shadow-red-500/40 hover:scale-105 transition-transform"
        >
          <PhoneOff className="w-8 h-8 fill-current" />
        </Button>

        <Button
          onClick={toggleCamera}
          variant="outline"
          size="icon"
          disabled={!hasPermissions}
          className={`w-14 h-14 rounded-full border-none ${
            isCameraOn ? 'bg-white/10 hover:bg-white/20' : 'bg-red-500 hover:bg-red-600'
          } text-white backdrop-blur-md transition-all`}
        >
          {isCameraOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
        </Button>
      </div>
    </div>
  );
}
