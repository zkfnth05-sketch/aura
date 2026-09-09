'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { PhoneOff, Mic, MicOff, Video, VideoOff, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/language-context';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { supabase } from '@/lib/supabaseClient';

// WebRTC STUN/TURN configuration
const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    {
      urls: 'turn:relay.metered.ca:80',
      username: 'metered',
      credential: 'password',
    },
  ],
};

interface VideoChatProps {
  localUser: User;
  remoteUser: User;
  matchId: string;
  onEndCall: () => void;
}

export default function VideoChat({ localUser, remoteUser, matchId, onEndCall }: VideoChatProps) {
  const { toast } = useToast();
  const { t } = useLanguage();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pc = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [hasPermissions, setHasPermissions] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isConnecting, setIsConnecting] = useState(true);

  const cleanupCallData = useCallback(async () => {
    if (!matchId) return;
    try {
      if (supabase) {
        await supabase
          .from('matches')
          .update({
            call_status: 'idle',
            caller_id: null,
          })
          .eq('id', matchId);
      }
    } catch (error) {
      console.warn('데이터 정리 실패:', error);
    }
  }, [matchId]);

  useEffect(() => {
    if (!matchId || !supabase) return;
    const client = supabase;

    let isMounted = true;
    const channel = client.channel(`call_signaling_${matchId}`, {
      config: { broadcast: { self: false } },
    });

    const initWebRTC = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: true,
        });
        streamRef.current = stream;
        setHasPermissions(true);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        pc.current = new RTCPeerConnection(configuration);

        stream.getTracks().forEach((track) => {
          if (pc.current && streamRef.current) {
            pc.current.addTrack(track, streamRef.current);
          }
        });

        pc.current.ontrack = (event) => {
          console.log('상대방 스트림 수신 성공');
          if (remoteVideoRef.current && event.streams[0]) {
            remoteVideoRef.current.srcObject = event.streams[0];
            setIsConnecting(false);
          }
        };

        pc.current.onicecandidate = (event) => {
          if (event.candidate) {
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

        // Determine if current user is the caller from Supabase matches table
        const { data: matchData } = await client
          .from('matches')
          .select('caller_id')
          .eq('id', matchId)
          .maybeSingle();

        const isCaller = matchData?.caller_id === localUser.id;

        // Listen for peer signaling events via Supabase Realtime Broadcast
        channel
          .on('broadcast', { event: 'offer' }, async ({ payload }) => {
            if (payload.senderId !== localUser.id && pc.current) {
              try {
                await pc.current.setRemoteDescription(new RTCSessionDescription(payload.offer));
                const answer = await pc.current.createAnswer();
                await pc.current.setLocalDescription(answer);

                channel.send({
                  type: 'broadcast',
                  event: 'answer',
                  payload: {
                    answer: { type: answer.type, sdp: answer.sdp },
                    senderId: localUser.id,
                  },
                });

                await client.from('matches').update({ call_status: 'active' }).eq('id', matchId);
              } catch (err) {
                console.error('Failed to handle offer:', err);
              }
            }
          })
          .on('broadcast', { event: 'answer' }, async ({ payload }) => {
            if (payload.senderId !== localUser.id && pc.current && !pc.current.currentRemoteDescription) {
              try {
                await pc.current.setRemoteDescription(new RTCSessionDescription(payload.answer));
              } catch (err) {
                console.error('Failed to set remote answer:', err);
              }
            }
          })
          .on('broadcast', { event: 'candidate' }, async ({ payload }) => {
            if (payload.senderId !== localUser.id && pc.current) {
              try {
                await pc.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
              } catch (e) {
                console.error('ICE Candidate 추가 실패', e);
              }
            }
          })
          .on('broadcast', { event: 'end_call' }, () => {
            if (isMounted) {
              onEndCall();
            }
          })
          .subscribe(async (status) => {
            if (status === 'SUBSCRIBED' && isCaller && pc.current) {
              try {
                const offer = await pc.current.createOffer();
                await pc.current.setLocalDescription(offer);

                channel.send({
                  type: 'broadcast',
                  event: 'offer',
                  payload: {
                    offer: { type: offer.type, sdp: offer.sdp },
                    senderId: localUser.id,
                  },
                });
              } catch (err) {
                console.error('Failed to create offer:', err);
              }
            }
          });

      } catch (err: any) {
        console.warn('WebRTC 초기화 에러:', err);
        setHasPermissions(false);
        if (err.name === 'NotFoundError') {
          toast({
            variant: 'destructive',
            title: t('media_device_not_found_title'),
            description: t('media_device_not_found_desc'),
          });
        } else {
          toast({
            variant: 'destructive',
            title: t('camera_permission_denied_title'),
            description: t('camera_permission_denied_desc'),
          });
        }
      }
    };

    initWebRTC();

    return () => {
      isMounted = false;
      cleanupCallData();
      channel.send({
        type: 'broadcast',
        event: 'end_call',
        payload: { senderId: localUser.id },
      });
      client.removeChannel(channel);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      pc.current?.close();
    };
  }, [matchId, localUser.id, cleanupCallData, onEndCall, t, toast]);

  const handleEndCall = useCallback(async () => {
    onEndCall();
  }, [onEndCall]);

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
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />

      {!hasPermissions && (
        <div className="absolute inset-0 h-full w-full bg-zinc-900 flex flex-col items-center justify-center p-4 z-20">
          <Alert variant="destructive" className="max-w-sm">
            <AlertTitle>{t('camera_permission_denied_title')}</AlertTitle>
            <AlertDescription>{t('media_device_not_found_desc')}</AlertDescription>
          </Alert>
        </div>
      )}

      {isConnecting && hasPermissions && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-20">
          <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
          <p className="text-white text-lg font-medium">{t('chat_connecting').replace('...', '')}</p>
        </div>
      )}

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

      <div className="absolute bottom-12 flex items-center gap-6 z-40">
        <Button
          onClick={toggleMic}
          variant="outline"
          size="icon"
          disabled={!hasPermissions}
          className={`w-14 h-14 rounded-full border-none ${
            isMicOn ? 'bg-white/10 hover:bg-white/20' : 'bg-red-500 hover:bg-red-600'
          } text-white backdrop-blur-md`}
        >
          {isMicOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
        </Button>

        <Button
          onClick={handleEndCall}
          variant="destructive"
          size="icon"
          className="w-16 h-16 rounded-full shadow-lg shadow-red-500/40"
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
          } text-white backdrop-blur-md`}
        >
          {isCameraOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
        </Button>
      </div>
    </div>
  );
}
