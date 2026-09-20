'use client';

import React, { useState, useEffect } from 'react';
import { MagazineArticle, MagazineSection } from '@/lib/magazine-types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Sparkles, BookOpen } from 'lucide-react';

interface ArticleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (articleData: Omit<MagazineArticle, 'id'> | MagazineArticle) => void;
  article: MagazineArticle | null;
}

const COLOR_PRESETS = [
  {
    name: '로즈 (Rose)',
    badgeBg: 'bg-rose-500/20',
    badgeText: 'text-rose-300',
    borderColor: 'border-rose-500/30 hover:border-rose-400/60',
    gradient: 'from-rose-950/70 via-zinc-900 to-black',
    accentGlow: 'bg-rose-500/15',
  },
  {
    name: '앰버 (Amber)',
    badgeBg: 'bg-amber-500/20',
    badgeText: 'text-amber-300',
    borderColor: 'border-amber-500/30 hover:border-amber-400/60',
    gradient: 'from-amber-950/70 via-zinc-900 to-black',
    accentGlow: 'bg-amber-500/15',
  },
  {
    name: '퍼플 (Purple)',
    badgeBg: 'bg-purple-500/20',
    badgeText: 'text-purple-300',
    borderColor: 'border-purple-500/30 hover:border-purple-400/60',
    gradient: 'from-purple-950/70 via-zinc-900 to-black',
    accentGlow: 'bg-purple-500/15',
  },
  {
    name: '핑크 (Pink)',
    badgeBg: 'bg-pink-500/20',
    badgeText: 'text-pink-300',
    borderColor: 'border-pink-500/30 hover:border-pink-400/60',
    gradient: 'from-pink-950/70 via-zinc-900 to-black',
    accentGlow: 'bg-pink-500/15',
  },
  {
    name: '에메랄드 (Emerald)',
    badgeBg: 'bg-emerald-500/20',
    badgeText: 'text-emerald-300',
    borderColor: 'border-emerald-500/30 hover:border-emerald-400/60',
    gradient: 'from-emerald-950/70 via-zinc-900 to-black',
    accentGlow: 'bg-emerald-500/15',
  },
  {
    name: '시안 (Cyan)',
    badgeBg: 'bg-cyan-500/20',
    badgeText: 'text-cyan-300',
    borderColor: 'border-cyan-500/30 hover:border-cyan-400/60',
    gradient: 'from-cyan-950/70 via-zinc-900 to-black',
    accentGlow: 'bg-cyan-500/15',
  },
];

export function ArticleDialog({ isOpen, onClose, onSave, article }: ArticleDialogProps) {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [category, setCategory] = useState('');
  const [categoryBadge, setCategoryBadge] = useState('');
  const [categoryIcon, setCategoryIcon] = useState('💬');
  const [readTime, setReadTime] = useState('3분 읽기');
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
  const [tagsString, setTagsString] = useState('');
  const [intro, setIntro] = useState('');
  const [sections, setSections] = useState<MagazineSection[]>([
    { heading: '1. 핵심 팁 첫 번째', body: '' },
  ]);
  const [auraFeature, setAuraFeature] = useState('Aura AI 카톡 코칭 & 분석기');
  const [auraFeatureDesc, setAuraFeatureDesc] = useState('Aura의 AI 분석을 통해 실시간 솔루션을 경험해 보세요.');

  useEffect(() => {
    if (article) {
      setTitle(article.title);
      setSubtitle(article.subtitle);
      setCategory(article.category);
      setCategoryBadge(article.categoryBadge);
      setCategoryIcon(article.categoryIcon);
      setReadTime(article.readTime);
      setTagsString(article.tags.join(', '));
      setIntro(article.content.intro);
      setSections(article.content.sections || []);
      setAuraFeature(article.content.auraFeature);
      setAuraFeatureDesc(article.content.auraFeatureDesc);

      // Match preset
      const matchIdx = COLOR_PRESETS.findIndex((p) => p.badgeText === article.badgeText);
      setSelectedPresetIndex(matchIdx !== -1 ? matchIdx : 0);
    } else {
      // Default empty form
      setTitle('');
      setSubtitle('');
      setCategory('dating_tips');
      setCategoryBadge('연애 꿀팁');
      setCategoryIcon('💖');
      setReadTime('3분 읽기');
      setSelectedPresetIndex(0);
      setTagsString('#소개팅, #Aura매거진, #연애팁');
      setIntro('');
      setSections([
        { heading: '1. 소제목을 입력하세요', body: '본문 내용을 입력하세요.' },
      ]);
      setAuraFeature('Aura AI 맞춤 데이팅 기능');
      setAuraFeatureDesc('Aura의 AI 매칭 및 분석 서비스를 직접 체험해 보세요.');
    }
  }, [article, isOpen]);

  const handleAddSection = () => {
    setSections((prev) => [
      ...prev,
      { heading: `${prev.length + 1}. 새로운 소제목`, body: '' },
    ]);
  };

  const handleRemoveSection = (index: number) => {
    setSections((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSectionChange = (index: number, field: keyof MagazineSection, val: string) => {
    setSections((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const preset = COLOR_PRESETS[selectedPresetIndex];
    const parsedTags = tagsString
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
      .map((t) => (t.startsWith('#') ? t : `#${t}`));

    const payload = {
      ...(article ? { id: article.id } : {}),
      category: category.trim() || 'tips',
      categoryBadge: categoryBadge.trim() || '매거진',
      categoryIcon: categoryIcon.trim() || '✨',
      title: title.trim(),
      subtitle: subtitle.trim(),
      readTime: readTime.trim() || '3분 읽기',
      gradient: preset.gradient,
      borderColor: preset.borderColor,
      badgeBg: preset.badgeBg,
      badgeText: preset.badgeText,
      accentGlow: preset.accentGlow,
      tags: parsedTags,
      content: {
        intro: intro.trim(),
        sections: sections.filter((s) => s.heading.trim() || s.body.trim()),
        auraFeature: auraFeature.trim(),
        auraFeatureDesc: auraFeatureDesc.trim(),
      },
    };

    onSave(payload as any);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-neutral-950 text-neutral-100 border-neutral-800 p-6 rounded-2xl">
        <DialogHeader className="pb-3 border-b border-neutral-800 text-left">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <span>{article ? '💖 Aura 공식 매거진 수정' : '✨ 새 공식 매거진 작성'}</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-3 text-left">
          {/* 1. 기본 정보 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-neutral-400">카테고리 아이콘</Label>
              <Input
                value={categoryIcon}
                onChange={(e) => setCategoryIcon(e.target.value)}
                placeholder="💬, 🍷, 🧠, 💘 등"
                className="bg-neutral-900 border-neutral-800 text-sm"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-neutral-400">카테고리 뱃지명</Label>
              <Input
                value={categoryBadge}
                onChange={(e) => setCategoryBadge(e.target.value)}
                placeholder="예: 카톡 시그널"
                className="bg-neutral-900 border-neutral-800 text-sm"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-neutral-400">읽기 소요 시간</Label>
              <Input
                value={readTime}
                onChange={(e) => setReadTime(e.target.value)}
                placeholder="예: 3분 읽기"
                className="bg-neutral-900 border-neutral-800 text-sm"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-neutral-400">카테고리 슬러그 (영문 식별자)</Label>
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="예: kakaotalk_signals, date_spots 등"
              className="bg-neutral-900 border-neutral-800 text-sm"
              required
            />
          </div>

          {/* 2. 제목 & 부제목 */}
          <div className="space-y-1.5">
            <Label className="text-xs text-neutral-400 font-semibold">아티클 메인 제목</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="소개팅 첫 카톡 읽씹을 피하는 호감형 첫인사 멘트 5가지"
              className="bg-neutral-900 border-neutral-800 text-sm font-bold"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-neutral-400">부제목 (요약 설명)</Label>
            <Input
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="단답형 대화를 살려내는 실전 티키타카 핑퐁 법칙"
              className="bg-neutral-900 border-neutral-800 text-sm"
              required
            />
          </div>

          {/* 3. 테마 컬러 프리셋 */}
          <div className="space-y-2">
            <Label className="text-xs text-neutral-400">카드 디자인 테마 (컬러 프리셋)</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {COLOR_PRESETS.map((preset, idx) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => setSelectedPresetIndex(idx)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                    selectedPresetIndex === idx
                      ? 'border-amber-400 bg-amber-500/10 text-amber-300 ring-1 ring-amber-400'
                      : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <span className={`w-3 h-3 rounded-full ${preset.badgeBg}`} />
                  <span>{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 4. 태그 목록 */}
          <div className="space-y-1.5">
            <Label className="text-xs text-neutral-400">태그 (쉼표로 구분)</Label>
            <Input
              value={tagsString}
              onChange={(e) => setTagsString(e.target.value)}
              placeholder="#소개팅첫카톡, #읽씹방지, #티키타카"
              className="bg-neutral-900 border-neutral-800 text-sm"
            />
          </div>

          {/* 5. 본문 인트로 */}
          <div className="space-y-1.5">
            <Label className="text-xs text-neutral-400 font-semibold">도입부 인트로 (Intro)</Label>
            <Textarea
              value={intro}
              onChange={(e) => setIntro(e.target.value)}
              rows={3}
              placeholder="칼럼의 시작을 여는 흥미로운 도입부 텍스트를 작성해 주세요."
              className="bg-neutral-900 border-neutral-800 text-sm leading-relaxed"
              required
            />
          </div>

          {/* 6. 본문 섹션들 */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-neutral-400 font-semibold">
                본문 섹션 목록 ({sections.length}개)
              </Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleAddSection}
                className="h-7 text-xs border-neutral-700 bg-neutral-900 hover:bg-neutral-800 text-amber-300"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                섹션 추가
              </Button>
            </div>

            {sections.map((section, sIdx) => (
              <div
                key={sIdx}
                className="p-3.5 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-2 relative"
              >
                <div className="flex items-center justify-between gap-2">
                  <Input
                    value={section.heading}
                    onChange={(e) => handleSectionChange(sIdx, 'heading', e.target.value)}
                    placeholder="소제목 (예: 1. 단순 질문 대신 공감 한 스푼 얹기)"
                    className="bg-neutral-950 border-neutral-800 text-xs font-bold text-amber-300"
                    required
                  />
                  {sections.length > 1 && (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemoveSection(sIdx)}
                      className="h-8 w-8 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <Textarea
                  value={section.body}
                  onChange={(e) => handleSectionChange(sIdx, 'body', e.target.value)}
                  rows={3}
                  placeholder="섹션의 상세 설명 내용을 입력하세요."
                  className="bg-neutral-950 border-neutral-800 text-xs leading-relaxed"
                  required
                />
              </div>
            ))}
          </div>

          {/* 7. Aura AI 연동 박스 (CTA) */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-rose-950/30 via-neutral-900 to-amber-950/30 border border-amber-500/30 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Aura 인앱 AI 기능 연동 (CTA 박스)</span>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-neutral-400">연동 기능 타이틀</Label>
              <Input
                value={auraFeature}
                onChange={(e) => setAuraFeature(e.target.value)}
                placeholder="예: Aura AI 카톡 답장 코칭 & 템포 분석기"
                className="bg-neutral-950 border-neutral-800 text-xs font-semibold"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-neutral-400">기능 설명 문구</Label>
              <Textarea
                value={auraFeatureDesc}
                onChange={(e) => setAuraFeatureDesc(e.target.value)}
                rows={2}
                placeholder="예: 상대방의 카톡 캡처 한 장으로 속마음 호감도와 센스 있는 답장을 추천받아보세요."
                className="bg-neutral-950 border-neutral-800 text-xs"
                required
              />
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-neutral-800 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-neutral-800 text-neutral-300 hover:bg-neutral-900"
            >
              취소
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-[#FFF3D1] via-[#E5A934] to-[#C98718] text-black font-bold hover:brightness-110"
            >
              {article ? '수정사항 저장' : '새 매거진 등록'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
