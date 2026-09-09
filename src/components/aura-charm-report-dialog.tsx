'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  Download,
  Share2,
  RefreshCw,
  Crown,
  Heart,
  Coffee,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import type { User } from '@/lib/types';
import { getAuraCharmReport, type AuraCharmOutput } from '@/actions/ai-actions';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

interface AuraCharmReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
  initialReport?: AuraCharmOutput | null;
  onReportSaved?: (report: AuraCharmOutput) => void;
}

export default function AuraCharmReportDialog({
  open,
  onOpenChange,
  user,
  initialReport,
  onReportSaved,
}: AuraCharmReportDialogProps) {
  const { toast } = useToast();
  const [report, setReport] = useState<AuraCharmOutput | null>(initialReport || null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Load or trigger initial report
  useEffect(() => {
    if (initialReport) {
      setReport(initialReport);
    } else if (open && !report && !isLoading) {
      handleGenerateReport();
    }
  }, [open, initialReport]);

  const handleGenerateReport = async () => {
    setIsLoading(true);
    try {
      const result = await getAuraCharmReport({
        name: user.name,
        gender: user.gender,
        age: user.age,
        bio: user.bio,
        photoUrl: user.photoUrls?.[0],
        hobbies: user.hobbies,
        interests: user.interests,
        lifestyle: user.lifestyle,
        values: user.values,
      });

      setReport(result);
      if (onReportSaved) {
        onReportSaved(result);
      }
      // Save in localStorage for fast re-access
      try {
        localStorage.setItem(`aura_charm_report_${user.id}`, JSON.stringify(result));
      } catch (_) {}
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: '분석 실패',
        description: err?.message || '아우라 매력 진단 중 오류가 발생했습니다.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * HTML5 Canvas를 이용한 1080x1920 인스타그램 스토리 규격 고해상도 이미지 생성
   */
  const renderCardToCanvas = async (): Promise<HTMLCanvasElement> => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d')!;

    // 1. 배경 그라데이션
    const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1920);
    bgGrad.addColorStop(0, '#090514');
    bgGrad.addColorStop(0.3, '#190a2c');
    bgGrad.addColorStop(0.7, '#120520');
    bgGrad.addColorStop(1, '#05020a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1080, 1920);

    // 2. 오라 후광 원형 그라데이션
    const glow = ctx.createRadialGradient(540, 680, 50, 540, 680, 600);
    glow.addColorStop(0, 'rgba(236, 72, 153, 0.35)');
    glow.addColorStop(0.5, 'rgba(168, 85, 247, 0.2)');
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 1080, 1920);

    // 3. 상단 헤더
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ec4899';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('✨  A U R A   P E R S O N A L   R E P O R T  ✨', 540, 160);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '28px sans-serif';
    ctx.fillText('GEMINI AI 공식 매력 진단 리포트', 540, 210);

    // 4. 유저 프로필 사진 렌더링 (원형 클리핑 + 골드/핑크 테두리)
    const userImgUrl = user.photoUrls?.[0];
    if (userImgUrl) {
      try {
        const img = new (window.Image as any)();
        img.crossOrigin = 'anonymous';
        await new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve; // fail-safe
          img.src = userImgUrl;
        });

        const centerX = 540;
        const centerY = 520;
        const radius = 220;

        // 원형 테두리 글로우
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius + 8, 0, Math.PI * 2);
        ctx.fillStyle = '#ec4899';
        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = 30;
        ctx.fill();
        ctx.restore();

        // 원형 클리핑 사진
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, centerX - radius, centerY - radius, radius * 2, radius * 2);
        ctx.restore();
      } catch (_) {}
    }

    // 5. 아우라 점수 & 칭호 뱃지
    if (report) {
      // 점수 캡슐
      ctx.fillStyle = 'rgba(236, 72, 153, 0.2)';
      ctx.strokeStyle = '#ec4899';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(540 - 240, 800, 480, 80, 40);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText(`👑 아우라 지수: ${report.auraScore}점 (상위 ${report.percentile}%)`, 540, 852);

      // 타이틀
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 54px sans-serif';
      ctx.fillText(`[ ${report.title} ]`, 540, 960);

      // 키워드 해시태그
      ctx.fillStyle = '#f472b6';
      ctx.font = 'bold 34px sans-serif';
      ctx.fillText(report.keywords.join('    '), 540, 1030);

      // 6. 분석 코멘트 박스
      ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(100, 1100, 880, 260, 32);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '32px sans-serif';
      wrapText(ctx, report.analysis, 140, 1170, 800, 48);

      // 7. 궁합 99% 최고의 이성 스타일 박스
      ctx.fillStyle = 'rgba(236, 72, 153, 0.12)';
      ctx.strokeStyle = 'rgba(236, 72, 153, 0.4)';
      ctx.beginPath();
      ctx.roundRect(100, 1400, 880, 160, 28);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f43f5e';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText('🔮 나와 궁합 99% 최고의 이성 스타일:', 140, 1450);

      ctx.fillStyle = '#ffffff';
      ctx.font = '30px sans-serif';
      wrapText(ctx, `"${report.bestMatchStyle}"`, 140, 1500, 800, 42);

      // 8. 추천 첫 데이트 코스
      ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
      ctx.beginPath();
      ctx.roundRect(100, 1600, 880, 140, 28);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText('☕ 추천 첫 데이트 무드:', 140, 1648);

      ctx.fillStyle = '#ffffff';
      ctx.font = '30px sans-serif';
      wrapText(ctx, report.dateRecommendation, 140, 1695, 800, 42);
    }

    // 9. 하단 브랜딩 푸터
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.font = '26px sans-serif';
    ctx.fillText('💎 AURA Private Lounge · 50:50 성비 평형 라운지 · aura.dating', 540, 1830);

    return canvas;
  };

  const wrapText = (
    context: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number
  ) => {
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = context.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        context.fillText(line, x, currentY);
        line = words[n] + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    context.fillText(line, x, currentY);
  };

  /**
   * 화보 이미지 갤러리 다운로드
   */
  const handleDownloadImage = async () => {
    setIsExporting(true);
    try {
      const canvas = await renderCardToCanvas();
      const link = document.createElement('a');
      link.download = `AURA_매력리포트_${user.name}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      toast({
        title: '💾 인스타 화보 카드 저장 완료!',
        description: '스마트폰 갤러리에 1080×1920 스토리 규격으로 저장되었습니다.',
      });
    } catch (e) {
      toast({
        variant: 'destructive',
        title: '저장 실패',
        description: '이미지 저장 중 오류가 발생했습니다.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * 인스타그램 스토리 / 외부 공유 (Web Share API)
   */
  const handleShareStory = async () => {
    setIsExporting(true);
    try {
      const canvas = await renderCardToCanvas();
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `AURA_매력리포트_${user.name}.png`, { type: 'image/png' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              title: `✨ ${user.name}님의 AURA 매력 진단 리포트`,
              text: `제미나이 AI가 분석한 나의 아우라 점수: ${report?.auraScore}점 [${report?.title}] ☕`,
              files: [file],
            });
            return;
          } catch (_) {}
        }

        // Web Share 파일 미지원 시 이미지 자동 다운로드 + 클립보드 복사
        const link = document.createElement('a');
        link.download = `AURA_매력리포트_${user.name}.png`;
        link.href = URL.createObjectURL(blob);
        link.click();

        toast({
          title: '📸 화보 카드가 갤러리에 저장되었습니다!',
          description: '인스타그램 앱을 열고 스토리 추가에서 방금 저장된 화보를 선택해 공유해보세요!',
        });
      }, 'image/png');
    } catch (e) {
      toast({
        variant: 'destructive',
        title: '공유 오류',
        description: '스토리 공유 준비 중 오류가 발생했습니다.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-zinc-950 border border-pink-500/30 text-white p-5 sm:p-6 rounded-3xl shadow-2xl backdrop-blur-2xl max-h-[95vh] overflow-y-auto">
        <DialogHeader className="space-y-1 text-center">
          <DialogTitle className="flex items-center justify-center gap-2 text-xl font-bold">
            <span className="p-1.5 rounded-xl bg-gradient-to-tr from-pink-500 to-rose-400 text-white shadow-lg shadow-pink-500/25">
              <Sparkles className="w-4 h-4" />
            </span>
            <span>나의 아우라(Aura) 매력 진단</span>
          </DialogTitle>
          <DialogDescription className="text-zinc-400 text-xs">
            제미나이 AI 비전이 내 사진과 프로필을 정밀 분석한 1장짜리 화보 리포트
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-pink-500/30 border-t-pink-500 animate-spin" />
              <Sparkles className="w-6 h-6 text-pink-400 absolute inset-0 m-auto animate-pulse" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-white">제미나이 AI가 회원님의 매력을 분석 중입니다...</p>
              <p className="text-xs text-zinc-400">사진의 분위기, 표정, 프로필 취향을 읽어내는 중 💫</p>
            </div>
          </div>
        ) : report ? (
          <div className="space-y-4 pt-1">
            {/* 9:16 Instagram Story Preview Card */}
            <div
              ref={cardRef}
              className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-purple-950/60 via-zinc-900 to-black border-2 border-pink-500/40 p-5 shadow-2xl space-y-4"
            >
              {/* Top Bar */}
              <div className="flex items-center justify-between text-[11px] text-pink-400 font-bold tracking-wider uppercase border-b border-white/10 pb-2.5">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AURA PERSONAL REPORT</span>
                </span>
                <span className="text-zinc-400 font-normal">aura.dating</span>
              </div>

              {/* Photo & Score Area */}
              <div className="flex flex-col items-center text-center space-y-3 pt-1">
                <div className="relative">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-pink-500 shadow-xl shadow-pink-500/30 relative">
                    <Image
                      src={user.photoUrls?.[0] || '/default-avatar.png'}
                      alt={user.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-2 inset-x-0 mx-auto w-max px-2.5 py-0.5 rounded-full bg-gradient-to-r from-pink-600 to-rose-500 text-white text-[10px] font-bold shadow-md">
                    상위 {report.percentile}% 아우라
                  </div>
                </div>

                <div className="space-y-0.5 pt-1">
                  <div className="flex items-center justify-center gap-1.5 text-amber-400 font-bold text-sm">
                    <Crown className="w-4 h-4 fill-current" />
                    <span>아우라 지수: {report.auraScore}점</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                    [ {report.title} ]
                  </h3>
                  <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                    {report.keywords.map((kw, i) => (
                      <span
                        key={i}
                        className="text-[11px] px-2 py-0.5 rounded-full bg-pink-500/15 text-pink-300 font-medium"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Analysis Text Box */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 text-xs text-zinc-300 leading-relaxed">
                {report.analysis}
              </div>

              {/* Match Style Box */}
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-3 space-y-1 text-xs">
                <div className="flex items-center gap-1.5 text-rose-400 font-bold text-[11px]">
                  <Heart className="w-3.5 h-3.5 fill-current" />
                  <span>나와 궁합 99% 최고의 이성 스타일</span>
                </div>
                <p className="text-white font-medium pl-5">{report.bestMatchStyle}</p>
              </div>

              {/* Date Course Recommendation */}
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 space-y-1 text-xs">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px]">
                  <Coffee className="w-3.5 h-3.5" />
                  <span>추천 첫 데이트 무드</span>
                </div>
                <p className="text-white font-medium pl-5">{report.dateRecommendation}</p>
              </div>

              {/* Footer Badge */}
              <div className="pt-1 text-center text-[10px] text-zinc-500">
                💎 AURA Private Lounge · 50:50 성비 평형 라운지
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <Button
                type="button"
                onClick={handleShareStory}
                disabled={isExporting}
                className="w-full py-5 rounded-2xl bg-gradient-to-r from-pink-600 via-rose-500 to-purple-600 text-white font-bold text-xs sm:text-sm shadow-xl shadow-pink-500/20 hover:opacity-95 flex items-center justify-center gap-2"
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Share2 className="w-4 h-4" />
                )}
                <span>📸 인스타그램 스토리에 공유하기</span>
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDownloadImage}
                  disabled={isExporting}
                  className="py-4 rounded-xl border-zinc-800 bg-zinc-900 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 flex items-center justify-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>화보 이미지 저장</span>
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleGenerateReport}
                  disabled={isLoading}
                  className="py-4 rounded-xl text-zinc-400 hover:text-white text-xs flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>다시 진단받기</span>
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
