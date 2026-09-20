'use client';

import { MagazineArticle, INITIAL_MAGAZINE_ARTICLES } from './magazine-types';

const STORAGE_KEY = 'aura_magazine_articles_v1';
export const MAGAZINE_UPDATED_EVENT = 'aura_magazine_updated';

export class MagazineStore {
  /**
   * Get all magazine articles.
   * Returns cached/saved articles from localStorage, or falls back to default articles.
   */
  public static getArticles(): MagazineArticle[] {
    if (typeof window === 'undefined') {
      return INITIAL_MAGAZINE_ARTICLES;
    }

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load magazine articles from localStorage:', e);
    }

    // Default initialization
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MAGAZINE_ARTICLES));
    } catch {}

    return INITIAL_MAGAZINE_ARTICLES;
  }

  /**
   * Get a single magazine article by ID.
   */
  public static getArticleById(id: number): MagazineArticle | undefined {
    const articles = this.getArticles();
    return articles.find((a) => a.id === id);
  }

  /**
   * Save full list of articles to storage and dispatch update event.
   */
  public static saveArticles(articles: MagazineArticle[]): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(articles));
      window.dispatchEvent(new CustomEvent(MAGAZINE_UPDATED_EVENT, { detail: articles }));
    } catch (e) {
      console.error('Failed to save magazine articles to localStorage:', e);
    }
  }

  /**
   * Create a new magazine article.
   */
  public static createArticle(data: Omit<MagazineArticle, 'id'>): MagazineArticle {
    const articles = this.getArticles();
    const nextId = articles.length > 0 ? Math.max(...articles.map((a) => a.id)) + 1 : 1;
    const newArticle: MagazineArticle = {
      ...data,
      id: nextId,
    };

    const updated = [newArticle, ...articles];
    this.saveArticles(updated);
    return newArticle;
  }

  /**
   * Update an existing magazine article.
   */
  public static updateArticle(updatedArticle: MagazineArticle): boolean {
    const articles = this.getArticles();
    const index = articles.findIndex((a) => a.id === updatedArticle.id);
    if (index === -1) return false;

    articles[index] = updatedArticle;
    this.saveArticles(articles);
    return true;
  }

  /**
   * Delete an article by ID.
   */
  public static deleteArticle(id: number): boolean {
    const articles = this.getArticles();
    const filtered = articles.filter((a) => a.id !== id);
    if (filtered.length === articles.length) return false;

    this.saveArticles(filtered);
    return true;
  }

  /**
   * Reset all magazine articles to initial factory defaults.
   */
  public static resetToDefault(): MagazineArticle[] {
    this.saveArticles(INITIAL_MAGAZINE_ARTICLES);
    return INITIAL_MAGAZINE_ARTICLES;
  }
}
