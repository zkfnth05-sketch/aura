import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import type { User, QuestPin } from '@/lib/types';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { QuestPinMarker } from './quest-pin-marker';
import CreateQuestDialog from './create-quest-dialog';
import QuestDetailModal from './quest-detail-modal';
import { Button } from './ui/button';
import { Zap, Users, Sparkles } from 'lucide-react';
import { useUser } from '@/contexts/user-context';
import { useLanguage } from '@/contexts/language-context';
import { VipWaitingBanner } from './vip-waiting-banner';

interface MapClientProps {
  users: User[];
  currentUser: User | null;
  initialCenter: { lat: number; lng: number };
  questPins?: QuestPin[];
  setQuestPins?: React.Dispatch<React.SetStateAction<QuestPin[]>>;
}

const mapStyles: google.maps.MapTypeStyle[] = [
    { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
    {
      featureType: 'administrative.locality',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#d59563' }],
    },
    {
      featureType: 'poi',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#d59563' }],
    },
    {
      featureType: 'poi.park',
      elementType: 'geometry',
      stylers: [{ color: '#263c3f' }],
    },
    {
      featureType: 'poi.park',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#6b9a76' }],
    },
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [{ color: '#38414e' }],
    },
    {
      featureType: 'road',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#212a37' }],
    },
    {
      featureType: 'road',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#9ca5b3' }],
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry',
      stylers: [{ color: '#746855' }],
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#1f2835' }],
    },
    {
      featureType: 'road.highway',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#f3d19c' }],
    },
    {
      featureType: 'transit',
      elementType: 'geometry',
      stylers: [{ color: '#2f3948' }],
    },
    {
      featureType: 'transit.station',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#d59563' }],
    },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#17263c' }],
    },
    {
      featureType: 'water',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#515c6d' }],
    },
    {
      featureType: 'water',
      elementType: 'labels.text.stroke',
      stylers: [{ color: '#17263c' }],
    },
];

const distanceOptions = [
    { label: '1km', zoom: 14 },
    { label: '5km', zoom: 12 },
    { label: '10km', zoom: 11 },
    { label: '25km', zoom: 10 },
    { label: '50km', zoom: 9 },
    { label: '100km', zoom: 8 },
];

const MemoizedAdvancedMarker = React.memo(function MemoizedAdvancedMarker({
  user,
  isCurrentUser,
  onClick,
}: {
  user: User;
  isCurrentUser: boolean;
  onClick: (userId: string) => void;
}) {
  if (typeof user.lat !== 'number' || typeof user.lng !== 'number') return null;

  return (
    <AdvancedMarker
      position={{ lat: user.lat, lng: user.lng }}
      onClick={() => onClick(user.id)}
    >
      <div 
        className={cn(
            "relative w-10 h-10 rounded-full border-2 shadow-md cursor-pointer transition-transform duration-200 hover:scale-110 will-change-transform",
            isCurrentUser ? "border-primary z-20" : "border-white z-10"
        )}
      >
        <Image
          src={user.photoUrls?.[0] || '/default-avatar.png'}
          alt={user.name}
          fill
          sizes="40px"
          priority={isCurrentUser}
          className="object-cover rounded-full"
        />
      </div>
    </AdvancedMarker>
  );
});
MemoizedAdvancedMarker.displayName = 'MemoizedAdvancedMarker';


export default function MapClient({
  users,
  currentUser,
  initialCenter,
  questPins = [],
  setQuestPins,
}: MapClientProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const { requireActiveAdmission, openActionGate } = useUser();
  const [zoom, setZoom] = useState(11);
  const [viewMode, setViewMode] = useState<'all' | 'users' | 'quests'>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedQuest, setSelectedQuest] = useState<QuestPin | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  const handleMarkerClick = useCallback((userId: string) => {
    if (currentUser && userId === currentUser.id) {
      router.push('/profile');
    } else {
      router.push(`/users/${userId}`);
    }
  }, [router, currentUser?.id]);

  const handleQuestClick = useCallback((quest: QuestPin) => {
    setSelectedQuest(quest);
    setIsDetailOpen(true);
  }, []);

  const handleQuestCreated = useCallback((newQuest: QuestPin) => {
    setQuestPins?.(prev => [newQuest, ...prev]);
  }, [setQuestPins]);

  const handleQuestDeleted = useCallback((deletedId: string) => {
    setQuestPins?.(prev => prev.filter(q => q.id !== deletedId));
  }, [setQuestPins]);

  return (
    <div className="w-full h-full relative overflow-hidden">
      {/* Top Filter Bar */}
      <div className="absolute top-4 left-0 right-0 z-10 px-4 space-y-2 pointer-events-none">
        {/* Distance Zoom Chips */}
        <div className="max-w-md mx-auto bg-black/60 backdrop-blur-md rounded-full p-1 flex justify-around items-center text-white pointer-events-auto border border-white/10 shadow-lg">
          {distanceOptions.map(option => (
            <button
              key={option.label}
              onClick={() => setZoom(option.zoom)}
              className={cn(
                'py-1.5 px-3 rounded-full text-xs font-medium transition-all duration-200 flex-1',
                zoom === option.zoom ? 'bg-primary text-white shadow-sm' : 'hover:bg-white/10'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* View Mode Switcher (All / Users / Quests) */}
        <div className="max-w-xs mx-auto bg-zinc-950/80 backdrop-blur-md rounded-full p-1 flex justify-around items-center text-white pointer-events-auto border border-white/15 shadow-xl text-xs">
          <button
            onClick={() => setViewMode('all')}
            className={cn(
              'py-1 px-3 rounded-full font-semibold transition-all flex items-center gap-1.5',
              viewMode === 'all' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('map_filter_all')}</span>
          </button>
          <button
            onClick={() => setViewMode('users')}
            className={cn(
              'py-1 px-3 rounded-full font-semibold transition-all flex items-center gap-1.5',
              viewMode === 'users' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{t('map_filter_profiles')}</span>
          </button>
          <button
            onClick={() => setViewMode('quests')}
            className={cn(
              'py-1 px-3 rounded-full font-semibold transition-all flex items-center gap-1.5',
              viewMode === 'quests' ? 'bg-primary text-white shadow-sm' : 'text-primary hover:text-primary/90'
            )}
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>{t('map_filter_quests').replace('{count}', String(questPins.length))}</span>
          </button>
        </div>
      </div>

      {/* Top Waiting Banner for Queued Users */}
      {currentUser?.admissionStatus === 'queued' && (
        <div className="absolute top-0 left-0 right-0 z-30">
          <VipWaitingBanner
            queuePosition={currentUser.queuePosition || 1}
            onOpenInviteModal={() => openActionGate(t('map_quest_gate_title'))}
          />
        </div>
      )}

      {/* Floating Action Button (FAB) for Creating Quest */}
      {currentUser && (
        <div className="absolute bottom-6 right-6 z-20">
          <Button
            onClick={() => {
              const allowed = requireActiveAdmission(() => setIsCreateOpen(true), t('map_quest_register_gate'));
              if (allowed) setIsCreateOpen(true);
            }}
            className="h-14 px-5 rounded-full bg-gradient-to-r from-primary via-orange-500 to-amber-500 text-white font-bold shadow-2xl shadow-primary/40 hover:scale-105 transition-all flex items-center gap-2 border border-white/20"
          >
            <Zap className="w-5 h-5 fill-current animate-bounce" />
            <span className="text-sm tracking-wide">{t('map_fab_quest')}</span>
          </Button>
        </div>
      )}

      {/* Google Maps Container */}
      <Map
        defaultCenter={initialCenter}
        zoom={zoom}
        onZoomChanged={(e) => setZoom(e.detail.zoom)}
        mapId={'dating-app-map-style'}
        disableDefaultUI={true}
        gestureHandling={'greedy'}
        reuseMaps={true}
      >
        {/* Render Users */}
        {viewMode !== 'quests' && users.map((user) => (
          <MemoizedAdvancedMarker
            key={user.id}
            user={user}
            isCurrentUser={!!currentUser && user.id === currentUser.id}
            onClick={handleMarkerClick}
          />
        ))}

        {/* Render Quest Pins */}
        {viewMode !== 'users' && questPins.map((quest) => (
          <QuestPinMarker
            key={quest.id}
            quest={quest}
            isMyQuest={!!currentUser && quest.creatorId === currentUser.id}
            onClick={handleQuestClick}
          />
        ))}
      </Map>

      {/* Create Quest Modal */}
      {currentUser && (
        <CreateQuestDialog
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          creatorId={currentUser.id}
          currentUser={currentUser}
          currentLat={currentUser.lat || initialCenter.lat}
          currentLng={currentUser.lng || initialCenter.lng}
          onQuestCreated={handleQuestCreated}
        />
      )}

      {/* Quest Details & 1:1 Chat / Delete Modal */}
      <QuestDetailModal
        quest={selectedQuest}
        currentUser={currentUser}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onQuestDeleted={handleQuestDeleted}
      />
    </div>
  );
}

