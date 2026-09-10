'use client';

import { LoungePost, LoungeComment, INITIAL_LOUNGE_POSTS, ANONYMOUS_AVATAR } from './lounge-types';
import { supabase } from './supabaseClient';

const STORAGE_KEY = 'aura_lounge_posts_v4';

export class LoungeStore {
  public static getPosts(): LoungePost[] {
    if (typeof window === 'undefined') {
      return INITIAL_LOUNGE_POSTS;
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
      console.warn('Failed to load lounge posts from storage:', e);
    }

    // Default initialize with real database virtual member posts
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_LOUNGE_POSTS));
    } catch {}
    return INITIAL_LOUNGE_POSTS;
  }

  /**
   * Sync and hydrate lounge posts with registered virtual members from Supabase.
   */
  public static async syncWithRealMembers(): Promise<LoungePost[]> {
    if (typeof window === 'undefined' || !supabase) {
      return this.getPosts();
    }

    try {
      const { data: dbUsers, error } = await supabase
        .from('users')
        .select('id, name, age, gender, location, photo_urls')
        .not('photo_urls', 'is', null)
        .limit(30);

      if (!error && dbUsers && dbUsers.length > 0) {
        const validUsers = dbUsers.filter(u => u.photo_urls && u.photo_urls.length > 0);
        if (validUsers.length > 0) {
          const currentPosts = this.getPosts();
          let modified = false;

          const updatedPosts = currentPosts.map((post, idx) => {
            // Keep anonymous posts strictly anonymous!
            if (post.isAnonymous) {
              return post;
            }

            // If post user is a dummy or not from db, link it to a real virtual user
            const matchingDbUser = validUsers.find(u => u.id === post.userId);
            if (matchingDbUser) {
              return {
                ...post,
                userName: matchingDbUser.name || post.userName,
                userAge: matchingDbUser.age || post.userAge,
                userGender: matchingDbUser.gender || post.userGender,
                userLocation: matchingDbUser.location || post.userLocation,
                userAvatar: matchingDbUser.photo_urls[0] || post.userAvatar,
              };
            }

            // Otherwise assign from valid users round-robin
            const assignedUser = validUsers[idx % validUsers.length];
            modified = true;
            return {
              ...post,
              userId: assignedUser.id,
              userName: assignedUser.name || post.userName,
              userAge: assignedUser.age || post.userAge,
              userGender: assignedUser.gender || post.userGender,
              userLocation: assignedUser.location || post.userLocation,
              userAvatar: assignedUser.photo_urls[0] || post.userAvatar,
            };
          });

          if (modified) {
            this.savePosts(updatedPosts);
            return updatedPosts;
          }
        }
      }
    } catch (err) {
      console.warn('Lounge real member sync error:', err);
    }

    return this.getPosts();
  }

  public static savePosts(posts: LoungePost[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
      // Dispatch custom event for cross-component reactivity
      window.dispatchEvent(new CustomEvent('aura_lounge_updated'));
    } catch (e) {
      console.error('Failed to save lounge posts:', e);
    }
  }

  public static createPost({
    userId,
    userName,
    userAvatar,
    userAge,
    userGender,
    userLocation,
    content,
    imageUrls,
    tags,
    isAnonymous,
    anonymousAlias,
  }: {
    userId: string;
    userName: string;
    userAvatar: string;
    userAge?: number;
    userGender?: '남성' | '여성' | '기타';
    userLocation?: string;
    content: string;
    imageUrls?: string[];
    tags?: string[];
    isAnonymous?: boolean;
    anonymousAlias?: string;
  }): LoungePost {
    const finalUserName = isAnonymous ? '익명의 오라' : userName;
    const finalAvatar = isAnonymous ? ANONYMOUS_AVATAR : (userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80');
    const finalLocation = isAnonymous ? '비밀 공간' : (userLocation || '서울');

    const newPost: LoungePost = {
      id: `post-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: isAnonymous ? `anon-${Date.now()}` : userId,
      userName: finalUserName,
      userAvatar: finalAvatar,
      userAge: isAnonymous ? undefined : (userAge || 26),
      userGender: isAnonymous ? undefined : (userGender || '여성'),
      userLocation: finalLocation,
      content,
      imageUrls: imageUrls || [],
      tags: tags || ['일상'],
      likesCount: 0,
      isLiked: false,
      commentsCount: 0,
      comments: [],
      createdAt: '방금 전',
      isVip: true,
      auraScore: 95,
      isAnonymous: Boolean(isAnonymous),
      anonymousAlias: anonymousAlias || (isAnonymous ? '익명회원' : undefined),
    };

    const currentPosts = this.getPosts();
    const updated = [newPost, ...currentPosts];
    this.savePosts(updated);
    return newPost;
  }

  public static toggleLike(postId: string): boolean {
    const posts = this.getPosts();
    const target = posts.find((p) => p.id === postId);
    if (!target) return false;

    target.isLiked = !target.isLiked;
    target.likesCount = target.isLiked ? target.likesCount + 1 : Math.max(0, target.likesCount - 1);

    this.savePosts(posts);
    return target.isLiked;
  }

  public static addComment({
    postId,
    userId,
    userName,
    userAvatar,
    userGender,
    content,
    isAnonymous,
    anonymousAlias,
  }: {
    postId: string;
    userId: string;
    userName: string;
    userAvatar: string;
    userGender?: '남성' | '여성' | '기타';
    content: string;
    isAnonymous?: boolean;
    anonymousAlias?: string;
  }): LoungeComment | null {
    const posts = this.getPosts();
    const target = posts.find((p) => p.id === postId);
    if (!target) return null;

    const finalName = isAnonymous ? (anonymousAlias || `익명 조언러 ${(target.comments?.length || 0) + 1}`) : userName;
    const finalAvatar = isAnonymous ? ANONYMOUS_AVATAR : (userAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80');

    const newComment: LoungeComment = {
      id: `comment-${Date.now()}`,
      postId,
      userId: isAnonymous ? `anon-${Date.now()}` : userId,
      userName: finalName,
      userAvatar: finalAvatar,
      userGender: isAnonymous ? undefined : userGender,
      content,
      createdAt: '방금 전',
      isAnonymous: Boolean(isAnonymous),
      anonymousAlias: finalName,
    };

    if (!target.comments) target.comments = [];
    target.comments.push(newComment);
    target.commentsCount = target.comments.length;

    this.savePosts(posts);
    return newComment;
  }
}
