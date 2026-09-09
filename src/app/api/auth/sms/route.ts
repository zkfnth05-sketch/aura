import { NextRequest, NextResponse } from 'next/server';
import { AligoSmsService } from '@/lib/aligoSmsService';
import { supabaseAdmin } from '@/lib/supabaseServer';

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

    // 1. 인증번호 발송 요청
    if (action === 'send') {
      const authCode = AligoSmsService.generateVerificationCode();
      const saved = await AligoSmsService.saveVerificationCode(cleanPhone, authCode);

      if (!saved) {
        return NextResponse.json(
          { success: false, message: '인증코드 저장에 실패했습니다.' },
          { status: 500 }
        );
      }

      const sendResult = await AligoSmsService.sendSms({
        receiver: cleanPhone,
        code: authCode,
      });

      return NextResponse.json({
        success: sendResult.success,
        message: sendResult.message,
        // 테스트 모드일 때 편의상 authCode 반환
        ...(sendResult.testMode ? { testAuthCode: authCode } : {}),
      });
    }

    // 2. 인증번호 확인 요청
    if (action === 'verify') {
      if (!code) {
        return NextResponse.json(
          { success: false, message: '인증번호가 필요합니다.' },
          { status: 400 }
        );
      }

      const verifyResult = await AligoSmsService.verifyCode(cleanPhone, code);

      if (!verifyResult.valid) {
        return NextResponse.json(
          { success: false, message: verifyResult.message || '인증번호가 일치하지 않습니다.' },
          { status: 400 }
        );
      }

      // 기존 가입 회원인지 Supabase users 테이블에서 확인
      let isExistingUser = false;
      let existingUser = null;

      if (supabaseAdmin) {
        const { data: user } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('phone_number', cleanPhone)
          .maybeSingle();

        if (user) {
          isExistingUser = true;
          existingUser = user;
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
      { success: false, message: '유효하지 않은 요청(action)입니다.' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('SMS API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
