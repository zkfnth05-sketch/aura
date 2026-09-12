'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { submitCustomerFeedback } from '@/lib/supabaseDataService';
import { useUser } from '@/contexts/user-context';
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
        title: '용량 초과',
        description: '이미지는 최대 5MB까지만 첨부할 수 있습니다.',
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
        throw new Error('업로드 실패');
      }

      const data = await res.json();
      if (data.url) {
        setScreenshotUrl(data.url);
        toast({
          title: '첨부 완료',
          description: '스크린샷이 성공적으로 첨부되었습니다.',
        });
      }
    } catch (err: any) {
      toast({
        title: '업로드 오류',
        description: '사진 업로드 중 오류가 발생했습니다. 다시 시도해 주세요.',
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
        title: '내용을 입력해 주세요',
        description: '최소 5자 이상 상세히 적어주시면 빠른 개선에 큰 도움이 됩니다.',
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
      const deviceInfo = `기기: ${ua} | 해상도: ${screenRes} | URL: ${currentUrl}`;

      const res = await submitCustomerFeedback({
        user_id: user?.id || null,
        user_name: user?.name || '익명 사용자',
        user_phone: user?.phoneNumber || null,
        category,
        content: content.trim(),
        screenshot_url: screenshotUrl,
        device_info: deviceInfo,
      });

      if (res.success) {
        toast({
          title: '소중한 의견이 접수되었습니다! ✨',
          description: '보내주신 내용을 관리자가 꼼꼼히 확인하여 서비스에 적극 반영하겠습니다.',
        });
        setContent('');
        setScreenshotUrl(null);
        onOpenChange(false);
      } else {
        toast({
          title: '접수 실패',
          description: res.error || '의견 제출 중 오류가 발생했습니다.',
          variant: 'destructive',
        });
      }
    } catch (e: any) {
      toast({
        title: '오류 발생',
        description: e.message || '접수 중 오류가 발생했습니다.',
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
              문제 신고 및 의견 보내기
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-neutral-400 leading-relaxed">
            오류나 불편한 점, 또는 “이런 기능이 있으면 좋겠어요” 하는 의견을 자유롭게 남겨주세요! 관리자가 직접 확인 후 빠르게 개선하겠습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* 분류 탭 */}
          <div>
            <label className="text-xs font-semibold text-neutral-300 block mb-2">분류 선택</label>
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
                <span>앱 오류 / 버그</span>
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
                <span>새로운 기능 제안</span>
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
                <span>이용 불편 사항</span>
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
                <span>기타 의견 및 칭찬</span>
              </button>
            </div>
          </div>

          {/* 상세 내용 작성 */}
          <div>
            <label className="text-xs font-semibold text-neutral-300 block mb-2">상세 내용</label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="어떤 상황에서 문제가 생겼나요? 혹은 추가되었으면 하는 기능이 있나요? 자세히 적어주시면 서비스 개선에 큰 힘이 됩니다."
              className="w-full h-28 bg-neutral-950 border-neutral-800 text-neutral-100 placeholder:text-neutral-600 rounded-2xl resize-none text-xs leading-relaxed focus:border-primary"
            />
          </div>

          {/* 스크린샷 첨부 */}
          <div>
            <label className="text-xs font-semibold text-neutral-300 block mb-2">스크린샷 사진 첨부 (선택)</label>
            {screenshotUrl ? (
              <div className="relative w-full h-32 rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-950 flex items-center justify-center">
                <Image src={screenshotUrl} alt="첨부 스크린샷" fill className="object-contain" />
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
                    <span>사진 업로드 중...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-neutral-400 font-medium">
                    <Upload className="h-4 w-4 text-neutral-500" />
                    <span>오류 화면이나 참고 사진 올리기 (최대 5MB)</span>
                  </div>
                )}
              </label>
            )}
          </div>

          <div className="p-3 rounded-xl bg-neutral-950/80 border border-neutral-800/80 flex items-center gap-2 text-[11px] text-neutral-400">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span>원활한 원인 파악을 위해 기기 사양 및 브라우저 정보가 자동 포함됩니다.</span>
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
                <span>의견 전송 중...</span>
              </>
            ) : (
              <>
                <span>의견 보내기</span>
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
