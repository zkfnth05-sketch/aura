'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { PhoneOff, Mic, MicOff, Video, VideoOff, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/language-context';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { supabase } from '@/lib/supabaseClient';
import { updateMatchCallStatus } from '@/lib/supabaseDataService';

// Public STUN servers for WebRTC peer connection
const configuration: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
  ],
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
  const hasSentOffer = useRef(false);

  const [hasPermissions, setHasPermissions] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isConnecting, setIsConnecting] = useState(true);

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

    const sendOffer = async (peerConn: RTCPeerConnection) => {
      try {
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

                channel.send({
                  type: 'broadcast',
                  event: 'answer',
                  payload: {
                    answer: { type: answer.type, sdp: answer.sdp },
                    senderId: localUser.id,
                  },
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
      if (pingTimer) clearInterval(pingTimer);
      if (fallbackTimer) clearTimeout(fallbackTimer);

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
          <p className="text-white text-lg font-medium">{t('chat_connecting').replace('...', '')}</p>
          <p className="text-zinc-400 text-sm mt-1">{remoteUser.name}님과 연결 중...</p>
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

      {/* Bottom Floating Control Bar */}
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
