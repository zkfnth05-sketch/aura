'use client';

import React, { useState } from 'react';
import { Sparkles, ChevronRight, Clock, ArrowRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

import { MagazineArticle } from '@/lib/magazine-types';
import { MagazineStore, MAGAZINE_UPDATED_EVENT } from '@/lib/magazine-store';

export type { MagazineArticle };

export function LoungeMagazineCarousel() {
  const [articles, setArticles] = useState<MagazineArticle[]>(() => MagazineStore.getArticles());
  const [selectedArticle, setSelectedArticle] = useState<MagazineArticle | null>(null);

  React.useEffect(() => {
    const handleUpdate = () => {
      setArticles(MagazineStore.getArticles());
    };
    window.addEventListener(MAGAZINE_UPDATED_EVENT, handleUpdate);
    return () => {
      window.removeEventListener(MAGAZINE_UPDATED_EVENT, handleUpdate);
    };
  }, []);

  if (!articles || articles.length === 0) return null;

  return (
    <section aria-label="Aura 2030 매거진" className="w-full mb-5 text-left">
      {/* Header with Title and Link */}
      <div className="flex items-center justify-between mb-2.5 px-0.5">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-rose-500/30 to-amber-500/30 border border-rose-500/40 text-xs">
            💖
          </span>
          <h2 className="text-sm sm:text-base font-extrabold tracking-tight text-zinc-100 flex items-center gap-1.5">
            <span>Aura 2030 매거진</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300">
              에디터 PICK
            </span>
          </h2>
        </div>

        <button
          type="button"
          onClick={() => setSelectedArticle(articles[0])}
          className="inline-flex items-center gap-0.5 text-xs text-zinc-400 hover:text-amber-300 font-medium transition-colors"
        >
          <span>전체보기</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Horizontal Carousel (Smooth Swipeable Cards) */}
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 pt-0.5 -mx-4 px-4 sm:mx-0 sm:px-0 scroll-smooth">
        {articles.map((article) => (
          <article
            key={article.id}
            onClick={() => setSelectedArticle(article)}
            className={`flex-shrink-0 w-[240px] sm:w-[260px] rounded-2xl p-4 bg-gradient-to-b ${article.gradient} border ${article.borderColor} shadow-lg shadow-black/40 cursor-pointer relative overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] group flex flex-col justify-between`}
          >
            {/* Ambient Corner Glow */}
            <div
              className={`absolute -top-10 -right-10 w-24 h-24 ${article.accentGlow} rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-500`}
            />

            <div>
              {/* Category & Read Time */}
              <div className="flex items-center justify-between mb-2.5">
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${article.badgeBg} ${article.badgeText} border border-white/5`}
                >
                  <span>{article.categoryIcon}</span>
                  <span>{article.categoryBadge}</span>
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] text-zinc-400 font-medium">
                  <Clock className="w-3 h-3 text-zinc-400" />
                  <span>{article.readTime}</span>
                </span>
              </div>

              {/* Title */}
              <h3 className="text-xs sm:text-sm font-bold text-zinc-100 line-clamp-2 leading-snug group-hover:text-amber-200 transition-colors mb-1.5">
                {article.title}
              </h3>

              {/* Subtitle */}
              <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed mb-3">
                {article.subtitle}
              </p>
            </div>

            {/* Bottom Meta & Arrow */}
            <div className="pt-2.5 border-t border-zinc-800/60 flex items-center justify-between text-[11px]">
              <span className="text-zinc-400 text-[10px] font-medium truncate max-w-[150px]">
                {article.tags[0]} {article.tags[1]}
              </span>
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-zinc-800/90 text-zinc-300 group-hover:bg-amber-400 group-hover:text-black transition-colors">
                <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </article>
        ))}
      </div>

      {/* Full Article Reader Dialog */}
      <Dialog open={!!selectedArticle} onOpenChange={(open) => !open && setSelectedArticle(null)}>
        {selectedArticle && (
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto bg-zinc-950 text-zinc-100 border border-zinc-800 rounded-3xl p-6 shadow-2xl no-scrollbar text-left">
            <DialogHeader className="text-left pb-3 border-b border-zinc-800/80">
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full ${selectedArticle.badgeBg} ${selectedArticle.badgeText} border border-white/10`}
                >
                  <span>{selectedArticle.categoryIcon}</span>
                  <span>{selectedArticle.categoryBadge}</span>
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-zinc-400 font-medium">
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{selectedArticle.readTime}</span>
                </span>
              </div>
              <DialogTitle className="text-lg sm:text-xl font-extrabold text-zinc-100 leading-snug">
                {selectedArticle.title}
              </DialogTitle>
              <p className="text-xs text-zinc-400 mt-1">
                💖 Aura 2030 매거진 공식 에디토리얼 칼럼
              </p>
            </DialogHeader>

            {/* Article Body */}
            <div className="space-y-4 py-3 text-xs sm:text-sm text-zinc-300 leading-relaxed">
              <p className="text-zinc-300 bg-zinc-900/60 p-3.5 rounded-2xl border border-zinc-800/60 italic">
                {selectedArticle.content.intro}
              </p>

              {selectedArticle.content.sections.map((sec, idx) => (
                <div key={idx} className="space-y-1.5 pt-1">
                  <h4 className="font-bold text-zinc-100 text-sm flex items-center gap-1.5 text-amber-300">
                    <span>{sec.heading}</span>
                  </h4>
                  <p className="text-zinc-300 pl-1">{sec.body}</p>
                </div>
              ))}

              {/* In-Article Aura Feature Callout Box */}
              <div className="mt-5 p-4 rounded-2xl bg-gradient-to-r from-rose-950/40 via-zinc-900 to-amber-950/40 border border-rose-500/30 text-left">
                <div className="flex items-center gap-2 text-rose-300 font-bold text-xs mb-1.5">
                  <Sparkles className="w-4 h-4 text-rose-400" />
                  <span>{selectedArticle.content.auraFeature}</span>
                </div>
                <p className="text-[11px] text-zinc-300 leading-relaxed mb-3">
                  {selectedArticle.content.auraFeatureDesc}
                </p>
                <Button
                  size="sm"
                  onClick={() => setSelectedArticle(null)}
                  className="w-full rounded-full bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-black font-extrabold text-xs shadow-md shadow-rose-500/20"
                >
                  👉 Aura에서 실시간 분석 체험하기
                </Button>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-zinc-800/60">
                {selectedArticle.tags.map((tag, i) => (
                  <span key={i} className="text-[11px] px-2.5 py-1 rounded-full bg-zinc-900 text-zinc-400 border border-zinc-800">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </section>
  );
}
