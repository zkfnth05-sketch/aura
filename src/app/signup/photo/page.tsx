'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useUser } from '@/contexts/user-context';
import { useLanguage } from '@/contexts/language-context';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Plus, Loader2, Camera, ImageIcon, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getEnhancedPhoto } from '@/actions/ai-actions';
import { compressImage } from '@/lib/utils';
import { uploadDataUri } from '@/lib/supabaseStorageService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import CameraDialog from '@/components/camera-dialog';
import { getDefaultAvatarByGender } from '@/lib/avatar-utils';

type PhotoState = {
  uri: string | null;
  isEnhancing: boolean;
};

export default function UploadPhotoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, updateUser, isLoaded, authUser, setIsSignupFlowActive } = useUser();
  const { t } = useLanguage();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<PhotoState>({ uri: null, isEnhancing: false });
  const [aiEnhancement, setAiEnhancement] = useState(true);
  const [isCameraDialogOpen, setIsCameraDialogOpen] = useState(false);
  const [isPhotoSourceDialogOpen, setIsPhotoSourceDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // This is a protected route.
    if (isLoaded) {
      if (!authUser) {
        // Not authenticated, should be on the initial signup page.
        router.replace('/signup');
      } else if (!user) {
        // Authenticated but no profile, should be creating profile first.
        router.replace('/signup/profile');
      }
    }
  }, [isLoaded, authUser, user, router]);

  const processAndAddImage = async (dataUri: string) => {
    const compressedForUpload = await compressImage(dataUri);

    if (aiEnhancement) {
      setPhoto({ uri: compressedForUpload, isEnhancing: true });
      try {
        const urlGender = searchParams.get('gender') as '여성' | '남성' | '기타' | null;
        const finalGender = urlGender || user?.gender || '기타';
        const result = await getEnhancedPhoto({ photoDataUri: compressedForUpload, gender: finalGender });
        const finalCompressedUri = await compressImage(result.enhancedPhotoDataUri);
        setPhoto({ uri: finalCompressedUri, isEnhancing: false });
      } catch (error: any) {
        console.error("AI photo enhancement failed:", error);
        toast({
            variant: "destructive",
            title: t('ai_enhance_failed_title'),
            description: "AI 보정에 실패하여 원본 사진이 사용됩니다.AI 보정을 원하시면 다시 시도해주세요",
        });
        setPhoto({ uri: compressedForUpload, isEnhancing: false });
      }
    } else {
        setPhoto({ uri: compressedForUpload, isEnhancing: false });
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setIsPhotoSourceDialogOpen(false);
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          processAndAddImage(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
      event.target.value = ''; // Reset file input
    }
  };
  
  const handlePhotoTaken = (dataUri: string) => {
    setIsCameraDialogOpen(false);
    processAndAddImage(dataUri);
  };

  // 사진을 등록하고 완료하는 기존 로직 (AI 보정 적용)
  const handleComplete = async () => {
    if (!photo.uri) {
      toast({
        variant: "destructive",
        title: t('photo_required_title'),
        description: t('photo_required_desc'),
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const cdnUrl = await uploadDataUri(photo.uri, 'profiles');
      await updateUser({
        photoUrls: [cdnUrl],
      });
      setIsSignupFlowActive(false); // Signal that the signup flow is now complete
      router.push('/profile');
    } catch (error) {
      console.error("Failed to complete signup:", error);
      toast({
        variant: "destructive",
        title: t('signup_failed_title'),
        description: t('signup_failed_desc')
      });
      setIsSubmitting(false); // Re-enable button on error
    }
  };

  // 사진이 당장 없는 유저를 위한 1초 스킵 완료 로직 (기본 실루엣 그래픽 아바타 적용)
  const handleSkipPhoto = async () => {
    setIsSubmitting(true);
    try {
      const defaultAvatar = getDefaultAvatarByGender(user?.gender);

      await updateUser({
        photoUrls: [defaultAvatar],
      });
      setIsSignupFlowActive(false);
      toast({
        title: '🎉 아우라에 오신 것을 환영합니다!',
        description: '기본 프로필로 가입이 완료되었습니다. 언제든 [프로필]에서 내 사진을 등록하실 수 있습니다.',
      });
      router.push('/profile');
    } catch (error) {
      console.error("Failed to complete signup with default avatar:", error);
      toast({
        variant: "destructive",
        title: t('signup_failed_title'),
        description: t('signup_failed_desc')
      });
      setIsSubmitting(false);
    }
  };
  
  // While auth state is loading, or user data is missing show a loader to prevent flicker or incorrect redirects.
  if (!isLoaded || !user) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }


  return (
    <>
    <div className="flex flex-col min-h-screen bg-black text-white px-8 py-12">
      <header className="flex-shrink-0">
        <h1 className="text-2xl font-bold text-center">{t('create_profile_title')}</h1>
        <Progress value={75} className="w-full mt-4 h-1 bg-zinc-800" />
      </header>

      <main className="flex-1 overflow-y-auto py-8">
        <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-zinc-400 mb-6">{t('add_profile_photo_title')}</p>
            
            <Dialog open={isPhotoSourceDialogOpen} onOpenChange={setIsPhotoSourceDialogOpen}>
            <DialogTrigger asChild>
                <div
                className="relative w-48 h-48 flex items-center justify-center border-2 border-dashed border-zinc-700 rounded-lg cursor-pointer bg-zinc-900/50"
                >
                {photo.uri ? (
                    <Image src={photo.uri} alt="Profile preview" fill className="object-cover rounded-lg" />
                ) : (
                    <Plus className="w-10 h-10 text-zinc-500" />
                )}
                {photo.isEnhancing && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    </div>
                )}
                </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-card border-primary/20">
                <DialogHeader>
                <DialogTitle>{t('add_photo')}</DialogTitle>
                <DialogDescription>
                    {t('choose_photo_method')}
                </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                <Button variant="outline" onClick={() => { setIsCameraDialogOpen(true); setIsPhotoSourceDialogOpen(false); }}>
                    <Camera className="mr-2 h-4 w-4" />
                    {t('take_photo')}
                </Button>
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <ImageIcon className="mr-2 h-4 w-4" />
                    {t('from_album')}
                </Button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*,image/heic,image/heif"
                />
                </div>
            </DialogContent>
            </Dialog>

            {/* AI 자동 보정 토글 스위치 (100% 정상 보존) */}
            <div className="flex items-center justify-center gap-4 mt-8">
              <label htmlFor="ai-enhancement" className="text-sm font-medium text-zinc-400">
                  {t('ai_enhancement')}
              </label>
              <Switch
                  id="ai-enhancement"
                  checked={aiEnhancement}
                  onCheckedChange={setAiEnhancement}
              />
            </div>

            {/* 사진이 없는 유저를 위한 빠른 스킵 텍스트 힌트 */}
            {!photo.uri && (
              <button
                type="button"
                onClick={handleSkipPhoto}
                disabled={isSubmitting}
                className="mt-6 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-zinc-900 border border-amber-500/30 text-amber-300 hover:text-amber-200 hover:bg-zinc-800 text-xs font-semibold shadow-md transition-all active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>지금 사진이 없으신가요? 기본 아바타로 먼저 시작하기</span>
              </button>
            )}
        </div>
      </main>

      {/* 하단 버튼 영역: 사진 업로드 여부에 따른 스마트 분기 */}
      <footer className="flex-shrink-0 pt-8 flex gap-3">
        <Button
            onClick={() => router.back()}
            className="w-1/3 h-14 bg-zinc-800 text-zinc-300 font-bold rounded-full text-base hover:bg-zinc-700"
            disabled={isSubmitting || photo.isEnhancing}
        >
            {t('previous_button')}
        </Button>

        {photo.uri ? (
          <Button
            onClick={handleComplete}
            disabled={photo.isEnhancing || isSubmitting}
            className="w-2/3 h-14 bg-gradient-to-r from-[#E5A934] via-[#DE9F2B] to-[#C7871E] text-black font-extrabold rounded-full text-base hover:brightness-110 shadow-[0_4px_20px_rgba(229,169,52,0.35)] transition-all"
          >
            {(photo.isEnhancing || isSubmitting) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('complete_button')}
          </Button>
        ) : (
          <Button
            onClick={handleSkipPhoto}
            disabled={isSubmitting}
            className="w-2/3 h-14 bg-gradient-to-r from-zinc-800 via-zinc-800 to-zinc-900 border border-amber-500/40 text-amber-300 hover:text-amber-200 hover:border-amber-400 font-extrabold rounded-full text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-lg active:scale-98 transition-all"
          >
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-400" />}
            <span>나중에 올릴게요 (1초 시작)</span>
          </Button>
        )}
      </footer>
    </div>
    <CameraDialog isOpen={isCameraDialogOpen} onClose={() => setIsCameraDialogOpen(false)} onPhotoTaken={handlePhotoTaken} />
    </>
  );
}
