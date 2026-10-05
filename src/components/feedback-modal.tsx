'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { submitCustomerFeedback } from '@/lib/supabaseDataService';
import { useUser } from '@/contexts/user-context';
import { useLanguage } from '@/contexts/language-context';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Upload, X, Loader2, Sparkles, AlertTriangle, Bug, Lightbulb, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';

interface FeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function FeedbackModal({ open, onOpenChange }: FeedbackModalProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const { t } = useLanguage();

  const [category, setCategory] = useState<'error_bug' | 'feature_idea' | 'ui_ux' | 'other'>('error_bug');
  const [content, setContent] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 스크린샷 업로드 핸들러
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: t('feedback_file_size_error_title'),
        description: t('feedback_file_size_error_desc'),
        variant: 'destructive',
      });
      return;
    }

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'feedbacks');

      const res = await fetch('/api/storage/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Upload failed');
      }

      const data = await res.json();
      if (data.url) {
        setScreenshotUrl(data.url);
        toast({
          title: t('feedback_upload_success_title'),
          description: t('feedback_upload_success_desc'),
        });
      }
    } catch (err: any) {
      toast({
        title: t('feedback_upload_error_title'),
        description: t('feedback_upload_error_desc'),
        variant: 'destructive',
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  // 피드백 전송 핸들러
  const handleSubmit = async () => {
    if (!content.trim() || content.trim().length < 5) {
      toast({
        title: t('feedback_min_length_title'),
        description: t('feedback_min_length_desc'),
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // 기기 및 브라우저 정보 자동 수집
      const ua = typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown';
      const screenRes = typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : '';
      const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
      const deviceInfo = `device: ${ua} | res: ${screenRes} | url: ${currentUrl}`;

      const res = await submitCustomerFeedback({
        user_id: user?.id || null,
        user_name: user?.name || 'Anonymous',
        user_phone: user?.phoneNumber || null,
        category,
        content: content.trim(),
        screenshot_url: screenshotUrl,
        device_info: deviceInfo,
      });

      if (res.success) {
        toast({
          title: t('feedback_success_title'),
          description: t('feedback_success_desc'),
        });
        setContent('');
        setScreenshotUrl(null);
        onOpenChange(false);
      } else {
        toast({
          title: t('feedback_fail_title'),
          description: res.error || t('feedback_fail_desc'),
          variant: 'destructive',
        });
      }
    } catch (e: any) {
      toast({
        title: t('feedback_fail_title'),
        description: e.message || t('feedback_fail_desc'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[92vw] bg-neutral-900 border-neutral-800 text-white rounded-3xl p-6 shadow-2xl">
        <DialogHeader className="text-left space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold">
              💬
            </span>
            <DialogTitle className="text-xl font-bold text-white tracking-tight">
              {t('feedback_title')}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-neutral-400 leading-relaxed">
            {t('feedback_desc')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* 분류 탭 */}
          <div>
            <label className="text-xs font-semibold text-neutral-300 block mb-2">{t('feedback_category_label')}</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCategory('error_bug')}
                className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border ${
                  category === 'error_bug'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/60 shadow-sm'
                    : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white'
                }`}
              >
                <Bug className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{t('feedback_cat_bug')}</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('feature_idea')}
                className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border ${
                  category === 'feature_idea'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-sm'
                    : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white'
                }`}
              >
                <Lightbulb className="h-4 w-4 shrink-0 text-amber-400" />
                <span>{t('feedback_cat_idea')}</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('ui_ux')}
                className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border ${
                  category === 'ui_ux'
                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/60 shadow-sm'
                    : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white'
                }`}
              >
                <AlertTriangle className="h-4 w-4 shrink-0 text-sky-400" />
                <span>{t('feedback_cat_ux')}</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('other')}
                className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border ${
                  category === 'other'
                    ? 'bg-primary/20 text-primary border-primary/60 shadow-sm'
                    : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white'
                }`}
              >
                <Sparkles className="h-4 w-4 shrink-0 text-primary" />
                <span>{t('feedback_cat_other')}</span>
              </button>
            </div>
          </div>

          {/* 상세 내용 작성 */}
          <div>
            <label className="text-xs font-semibold text-neutral-300 block mb-2">{t('feedback_content_label')}</label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t('feedback_content_placeholder')}
              className="w-full h-28 bg-neutral-950 border-neutral-800 text-neutral-100 placeholder:text-neutral-600 rounded-2xl resize-none text-xs leading-relaxed focus:border-primary"
            />
          </div>

          {/* 스크린샷 첨부 */}
          <div>
            <label className="text-xs font-semibold text-neutral-300 block mb-2">{t('feedback_screenshot_label')}</label>
            {screenshotUrl ? (
              <div className="relative w-full h-32 rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-950 flex items-center justify-center">
                <Image src={screenshotUrl} alt="Screenshot" fill className="object-contain" />
                <button
                  type="button"
                  onClick={() => setScreenshotUrl(null)}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-rose-600 text-white transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 w-full p-4 rounded-2xl border border-dashed border-neutral-800 bg-neutral-950/60 hover:border-primary/50 cursor-pointer transition-all">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUploadingImage}
                  className="hidden"
                />
                {isUploadingImage ? (
                  <div className="flex items-center gap-2 text-xs text-primary font-medium">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{t('feedback_uploading')}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-neutral-400 font-medium">
                    <Upload className="h-4 w-4 text-neutral-500" />
                    <span>{t('feedback_upload_hint')}</span>
                  </div>
                )}
              </label>
            )}
          </div>

          <div className="p-3 rounded-xl bg-neutral-950/80 border border-neutral-800/80 flex items-center gap-2 text-[11px] text-neutral-400">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span>{t('feedback_device_info_notice')}</span>
          </div>

          {/* 제출 버튼 */}
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || isUploadingImage}
            className="w-full h-12 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm shadow-lg shadow-primary/25 gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{t('feedback_submitting')}</span>
              </>
            ) : (
              <>
                <span>{t('feedback_submit_btn')}</span>
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
