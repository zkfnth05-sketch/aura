'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/contexts/user-context';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { MapPin, X, Loader2, ShieldAlert, PhoneCall, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import ImageCarouselDialog from '@/components/image-carousel-dialog';
import AuraCharmReportDialog from '@/components/aura-charm-report-dialog';
import type { AuraCharmOutput } from '@/actions/ai-actions';
import Header from '@/components/layout/header';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/language-context';
import { useEscapeCall } from '@/contexts/escape-call-context';
import { TranslationKeys } from '@/lib/locales';
import CoachMarkGuide from '@/components/coach-mark-guide';
import { profileGuide } from '@/lib/coachmark-steps';
import { VipWaitingBanner } from '@/components/vip-waiting-banner';
import FeedbackModal from '@/components/feedback-modal';

// Helper components for page structure
const ProfileSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="py-4">
    <h3 className="font-semibold text-primary text-sm mb-3">{title}</h3>
    {children}
  </div>
);

const ProfileToggle = ({ label, id, checked, onCheckedChange, isLast = false, disabled = false }: { label: string, id: string, checked: boolean, onCheckedChange: (checked: boolean) => void, isLast?: boolean, disabled?: boolean }) => (
    <div className={cn("flex items-center justify-between py-4", !isLast && "border-b")}>
      <label htmlFor={id} className={cn("text-foreground/80", disabled && "opacity-50")}>{label}</label>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </div>
  );


export default function ProfilePage() {
  const { user: currentUser, notificationSettings, updateNotificationSettings, subscribeToPushNotifications, openActionGate } = useUser();
  const { openConfigModal: openEscapeModal } = useEscapeCall();
  const [isCarouselOpen, setIsCarouselOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isAuraDialogOpen, setIsAuraDialogOpen] = useState(false);
  const [savedAuraReport, setSavedAuraReport] = useState<AuraCharmOutput | null>(null);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    if (currentUser?.id) {
      try {
        const cached = localStorage.getItem(`aura_charm_report_${currentUser.id}`);
        if (cached) {
          setSavedAuraReport(JSON.parse(cached));
        }
      } catch (_) {}
    }
  }, [currentUser?.id]);

  const handleSettingChange = async (id: keyof typeof notificationSettings, checked: boolean) => {
    updateNotificationSettings({ [id]: checked });

    // If notifications toggle is turned on, ensure push subscription is active
    if ((id === 'all' || id === 'newMatch' || id === 'newMessage' || id === 'videoCall') && checked) {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        setIsSubscribing(true);
        try {
          await subscribeToPushNotifications();
        } catch (e) {
          console.error('Error during push subscription:', e);
        } finally {
          setIsSubscribing(false);
        }
      }
    }
  };
  
  // Render immediately if we have user data, otherwise show a loader.
  if (!currentUser) {
    return (
      <div className="flex flex-col h-full">
        <Header/>
        <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  const allPhotos = currentUser.photoUrls || [];

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    setIsCarouselOpen(true);
  }

  return (
    <>
      <CoachMarkGuide guide={profileGuide} />
      <div className="bg-background text-foreground">
        <Header />
        {currentUser.admissionStatus === 'queued' && (
          <VipWaitingBanner
            queuePosition={currentUser.queuePosition || 1}
            onOpenInviteModal={() => openActionGate('1:1 대화 및 매칭')}
          />
        )}
        <main>
          <div className="relative w-full aspect-[3/4] max-h-[70vh] cursor-pointer" onClick={() => handleImageClick(0)}>
            {allPhotos[0] && (
              <Image
                src={allPhotos[0]}
                alt={`Profile of ${currentUser.name}`}
                fill
                className="object-cover"
                data-ai-hint="person portrait"
                priority
              />
            )}
          </div>
          
          <div className="container relative z-10 px-4">
            <div className="grid grid-cols-3 gap-2 mt-4">
                {allPhotos.slice(1).map((photoUrl, index) => (
                    <div key={index} className="relative aspect-square rounded-md overflow-hidden cursor-pointer" onClick={() => handleImageClick(index + 1)}>
                        <Image 
                            src={photoUrl}
                            alt={`More photo of ${currentUser.name} ${index + 1}`}
                            fill
                            className="object-cover"
                            data-ai-hint="person portrait"
                        />
                    </div>
                ))}
            </div>
            <div className="text-left mt-4">
                <h1 className="text-3xl font-bold">
                    {currentUser.name}, {currentUser.age}, {t(currentUser.gender as TranslationKeys) || currentUser.gender}
                </h1>
                <p className="text-muted-foreground">{currentUser.location}</p>

                {/* 50:50 Status Card */}
                <div className="mt-4 p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{currentUser.admissionStatus === 'queued' ? '⏳' : '👑'}</span>
                      <div>
                        <span className="text-xs font-bold text-white">
                          {currentUser.admissionStatus === 'queued'
                            ? t('profile_vip_queue_badge').replace('{pos}', String(currentUser.queuePosition || 1))
                            : t('profile_vip_member_badge')}
                        </span>
                        <p className="text-[11px] text-zinc-400">
                          {currentUser.admissionStatus === 'queued'
                            ? t('profile_vip_queue_hint')
                            : t('profile_vip_member_hint')}
                        </p>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openActionGate('1:1 대화 및 초대')}
                      className="border-amber-500/40 text-amber-300 hover:bg-amber-500/20 text-xs h-8 px-3 rounded-lg"
                    >
                      {currentUser.admissionStatus === 'queued' ? t('profile_invite_friend_btn') : t('profile_invite_code_btn')}
                    </Button>
                  </div>

                  {currentUser.referralCode && (
                    <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                      <span className="text-zinc-500 font-medium">{t('profile_my_invite_code_label')}</span>
                      <span className="font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        {currentUser.referralCode}
                      </span>
                    </div>
                  )}
                </div>

                {/* ✨ 제미나이 AI 나의 아우라 매력 진단 카드 */}
                <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-purple-950/60 via-pink-950/40 to-zinc-900 border border-pink-500/40 shadow-xl space-y-2.5 relative overflow-hidden">
                  <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-pink-500/10 rounded-full blur-2xl pointer-events-none" />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="p-2 rounded-xl bg-pink-500/20 text-pink-400">
                        <Sparkles className="w-4 h-4 animate-pulse" />
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white">{t('charm_title')}</span>
                          <span className="text-[10px] bg-gradient-to-r from-pink-500 to-rose-500 text-white font-extrabold px-1.5 py-0.2 rounded-full shadow-sm">
                            {t('profile_charm_insta_hot')}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400">
                          {savedAuraReport
                            ? `아우라 ${savedAuraReport.auraScore}점 [${savedAuraReport.title}]`
                            : t('profile_charm_banner_desc')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={() => setIsAuraDialogOpen(true)}
                    className="w-full bg-gradient-to-r from-pink-600 via-rose-500 to-purple-600 hover:opacity-95 text-white font-bold text-xs rounded-xl py-4 shadow-lg shadow-pink-500/20 flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>
                      {savedAuraReport
                        ? t('profile_charm_view_btn')
                        : t('profile_charm_diagnose_btn')}
                    </span>
                  </Button>
                </div>
            </div>
          </div>

          <div className="container relative z-10 px-4 mt-6">
            <div className={cn(
                "text-sm rounded-lg p-3 flex items-center justify-between mb-6",
                notificationSettings.locationShared
                    ? "bg-blue-900/50 border border-blue-400 text-blue-200"
                    : "bg-zinc-800/50 border border-zinc-700 text-zinc-400"
            )}>
              <div className="flex items-center gap-2">
                <MapPin className={cn("h-4 w-4", notificationSettings.locationShared ? "text-blue-300" : "text-zinc-500")} />
                <span>
                  {notificationSettings.locationShared
                    ? t('profile_location_sharing_on_desc')
                    : t('profile_location_sharing_off_desc')}
                </span>
              </div>
              <Switch
                id="location-banner-toggle"
                checked={notificationSettings.locationShared}
                onCheckedChange={(checked) => handleSettingChange('locationShared', checked)}
                className={cn(notificationSettings.locationShared ? 'data-[state=checked]:bg-blue-400' : 'data-[state=unchecked]:bg-zinc-700')}
              />
            </div>

            <div className="bg-card p-4 rounded-lg">

              <ProfileSection title={t('bio_section_title')}>
                <p className="text-sm text-foreground/80">{currentUser.bio}</p>
              </ProfileSection>

              {currentUser.relationship && currentUser.relationship.length > 0 && (
                <ProfileSection title={t('relationship_section_title')}>
                  <div className="flex flex-wrap gap-2">
                    {currentUser.relationship.map(item => (
                      <Badge key={item} variant="secondary" className="bg-accent text-accent-foreground font-normal">{t(item as TranslationKeys)}</Badge>
                    ))}
                  </div>
                </ProfileSection>
              )}

              {currentUser.values && currentUser.values.length > 0 && (
                <ProfileSection title={t('values_section_title')}>
                  <div className="flex flex-wrap gap-2">
                    {currentUser.values.map(item => (
                      <Badge key={item} variant="secondary" className="bg-accent text-accent-foreground font-normal">{t(item as TranslationKeys)}</Badge>
                    ))}
                  </div>
                </ProfileSection>
              )}

              {currentUser.communication && currentUser.communication.length > 0 && (
                <ProfileSection title={t('communication_section_title')}>
                  <div className="flex flex-wrap gap-2">
                    {currentUser.communication.map(item => (
                      <Badge key={item} variant="secondary" className="bg-accent text-accent-foreground font-normal">{t(item as TranslationKeys)}</Badge>
                    ))}
                  </div>
                </ProfileSection>
              )}

              {currentUser.lifestyle && currentUser.lifestyle.length > 0 && (
                <ProfileSection title={t('lifestyle_section_title')}>
                  <div className="flex flex-wrap gap-2">
                    {currentUser.lifestyle.map(item => (
                      <Badge key={item} variant="secondary" className="bg-accent text-accent-foreground font-normal">{t(item as TranslationKeys)}</Badge>
                    ))}
                  </div>
                </ProfileSection>
              )}

              {currentUser.interests && currentUser.interests.length > 0 && (
                <ProfileSection title={t('interests_section_title')}>
                  <div className="flex flex-wrap gap-2">
                    {currentUser.interests.map(interest => (
                      <Badge key={interest} variant="secondary" className="bg-accent text-accent-foreground font-normal">{t(interest as TranslationKeys)}</Badge>
                    ))}
                  </div>
                </ProfileSection>
              )}

              {currentUser.hobbies && currentUser.hobbies.length > 0 && (
                <ProfileSection title={t('hobbies_section_title')}>
                  <div className="flex flex-wrap gap-2">
                    {currentUser.hobbies.map(hobby => (
                      <Badge key={hobby} variant="secondary" className="bg-accent text-accent-foreground font-normal">{t(hobby as TranslationKeys)}</Badge>
                    ))}
                  </div>
                </ProfileSection>
              )}

              {/* 🛡️ 여성 안심 라운지 & 가짜 탈출 전화 카드 */}
              <div className="my-6 bg-gradient-to-r from-pink-950/40 via-purple-950/30 to-zinc-950 border border-pink-500/30 rounded-3xl p-5 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2.5 rounded-2xl bg-pink-500/20 text-pink-400">
                      <ShieldAlert className="w-5 h-5" />
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                        <span>{t('profile_escape_title')}</span>
                        <span className="text-[10px] bg-pink-500 text-white font-bold px-1.5 py-0.2 rounded-full">HOT</span>
                      </h3>
                      <p className="text-xs text-zinc-400">{t('profile_escape_subtitle')}</p>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed">
                  {t('profile_escape_desc')}
                </p>

                <div className="pt-1">
                  <Button
                    type="button"
                    onClick={openEscapeModal}
                    className="w-full bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-500 hover:to-rose-400 text-white font-bold text-xs rounded-2xl py-5 shadow-lg shadow-pink-500/20 flex items-center justify-center gap-2"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>{t('profile_escape_btn')}</span>
                  </Button>
                </div>
              </div>

              <ProfileSection title={t('profile_settings_section')}>
                  <ProfileToggle 
                    id="location"
                    label={t('profile_location_sharing')} 
                    checked={notificationSettings.locationShared}
                    onCheckedChange={(checked) => handleSettingChange('locationShared', checked)}
                  />
                  <ProfileToggle 
                    id="notifications"
                    label={t('profile_notifications')} 
                    checked={notificationSettings.all}
                    onCheckedChange={(checked) => handleSettingChange('all', checked)}
                    disabled={isSubscribing}
                  />
                  <ProfileToggle 
                    id="newMatch"
                    label={t('profile_new_match_noti')} 
                    checked={notificationSettings.newMatch}
                    onCheckedChange={(checked) => handleSettingChange('newMatch', checked)}
                  />
                  <ProfileToggle 
                    id="newMessage"
                    label={t('profile_new_message_noti')} 
                    checked={notificationSettings.newMessage}
                    onCheckedChange={(checked) => handleSettingChange('newMessage', checked)}
                  />
                  <ProfileToggle 
                    id="videoCall"
                    label={t('profile_video_call_noti')} 
                    checked={notificationSettings.videoCall}
                    onCheckedChange={(checked) => handleSettingChange('videoCall', checked)}
                    isLast={true}
                  />
              </ProfileSection>

              {/* 문제 신고 및 의견 보내기 버튼 */}
              <div className="pt-2 pb-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFeedbackOpen(true)}
                  className="w-full h-12 bg-neutral-900/80 hover:bg-neutral-800 border-neutral-800 text-neutral-200 hover:text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <span className="text-base">💬</span>
                  <span>문제 신고 및 의견 보내기</span>
                </Button>
              </div>
            </div>

            <div className="py-6">
              <Button asChild className="w-full h-12 bg-primary text-primary-foreground rounded-full font-bold text-base">
                  <Link href="/profile/edit" prefetch={true}>{t('profile_edit_button')}</Link>
              </Button>
            </div>
          </div>
        </main>
      </div>

      <ImageCarouselDialog 
        isOpen={isCarouselOpen}
        onClose={() => setIsCarouselOpen(false)}
        images={allPhotos}
        startIndex={selectedImageIndex}
      />

      {currentUser && (
        <AuraCharmReportDialog
          open={isAuraDialogOpen}
          onOpenChange={setIsAuraDialogOpen}
          user={currentUser}
          initialReport={savedAuraReport}
          onReportSaved={setSavedAuraReport}
        />
      )}

      <FeedbackModal
        open={isFeedbackOpen}
        onOpenChange={setIsFeedbackOpen}
      />
    </>
  );
}

