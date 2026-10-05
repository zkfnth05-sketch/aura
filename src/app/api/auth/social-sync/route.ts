import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { supabase } from '@/lib/supabaseClient';
import { toSupabaseUser, fromSupabaseUser } from '@/lib/supabaseMappers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, email, avatarUrl, gender, age, referredBy } = body;

    if (!userId) {
      return NextResponse.json({ success: false, message: 'User ID is required' }, { status: 400 });
    }

    const db = supabaseAdmin || supabase;
    if (!db) {
      return NextResponse.json({ success: false, message: 'Database client not available' }, { status: 500 });
    }

    // 1. 기존 유저 확인
    const { data: existingUser } = await db
      .from('users')
      .select('*')
      .or(`id.eq.${userId}${email ? `,email.eq.${email}` : ''}`)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json({
        success: true,
        isNewUser: false,
        user: fromSupabaseUser(existingUser),
      });
    }

    // 2. 신규 유저 생성
    const now = new Date().toISOString();
    const parsedGender = gender === '남성' ? '남성' : '여성';
    const parsedAge = typeof age === 'number' && age > 0 ? age : 25;

    const newUserObj: any = {
      id: userId,
      name: name || '아우라 회원',
      email: email || '',
      phoneNumber: '',
      gender: parsedGender,
      age: parsedAge,
      location: '서울 강남구',
      lat: 37.4979,
      lng: 127.0276,
      bio: '반갑습니다! 아우라에서 좋은 인연을 찾고 있어요 ✨',
      hobbies: ['카페투어', '영화감상', '맛집탐방'],
      interests: ['연애/결혼', '취미공유'],
      photoUrls: avatarUrl ? [avatarUrl] : ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600'],
      videoUrls: [],
      relationship: [],
      values: [],
      communication: [],
      lifestyle: [],
      blockedUsers: [],
      completedCoachMarks: [],
      pushSubscriptions: [],
      admissionStatus: 'active',
      referredBy: referredBy || '',
      createdAt: now,
      lastSeen: now,
    };

    const dbRow = toSupabaseUser(newUserObj);
    const { data: createdUser, error: insertError } = await db
      .from('users')
      .upsert(dbRow)
      .select()
      .single();

    if (insertError) {
      console.error('Admin user insert error:', insertError);
      return NextResponse.json({ success: false, message: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      isNewUser: true,
      user: createdUser ? fromSupabaseUser(createdUser) : newUserObj,
    });
  } catch (err: any) {
    console.error('Social sync API exception:', err);
    return NextResponse.json({ success: false, message: err.message || 'Server error' }, { status: 500 });
  }
}
