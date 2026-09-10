import { NextRequest, NextResponse } from 'next/server';
import { sendOtpSms, verifyOtpSms } from '@/ai/flows/aligo-sms';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, phoneNumber, code } = body;

    if (!phoneNumber) {
      return NextResponse.json(
        { success: false, message: '전화번호가 필요합니다.' },
        { status: 400 }
      );
    }

    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');

    // 1. 인증번호 발송
    if (action === 'send') {
      const result: any = await sendOtpSms(cleanPhone);

      return NextResponse.json({
        success: result.success,
        message: result.message || (result.error ? `인증번호 발송 실패: ${result.error}` : '인증번호가 발송되었습니다.'),
        simulated: result.simulated || false,
        code: result.code,
        ...(result.code ? { testAuthCode: result.code } : {}),
      });
    }

    // 2. 인증번호 확인 (easy-tax-refund와 100% 동일 로직)
    if (action === 'verify') {
      if (!code) {
        return NextResponse.json(
          { success: false, message: '인증번호가 필요합니다.' },
          { status: 400 }
        );
      }

      const verifyResult = await verifyOtpSms(cleanPhone, code);

      if (!verifyResult.success) {
        return NextResponse.json(
          { success: false, message: verifyResult.error || '인증번호가 일치하지 않습니다.' },
          { status: 400 }
        );
      }

      // 기존 가입 회원 여부 확인
      let isExistingUser = false;
      let existingUser = null;

      const db = supabaseAdmin || supabase;
      if (db) {
        try {
          const { data: user } = await db
            .from('users')
            .select('*')
            .eq('phone_number', cleanPhone)
            .maybeSingle();

          if (user) {
            isExistingUser = true;
            existingUser = user;
          }
        } catch (dbErr) {
          console.warn('User lookup warning:', dbErr);
        }
      }

      return NextResponse.json({
        success: true,
        message: '인증이 완료되었습니다.',
        isExistingUser,
        user: existingUser,
        phoneNumber: cleanPhone,
      });
    }

    return NextResponse.json(
      { success: false, message: '유효하지 않은 요청입니다.' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('SMS Route Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
