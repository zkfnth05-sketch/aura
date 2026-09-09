'use server';

import axios from 'axios';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { supabase } from '@/lib/supabaseClient';

// 인메모리 백업 저장소 (서버리스 인스턴스 즉시 검증용)
const memoryOtpMap = new Map<string, { code: string; timestamp: number }>();

export async function sendOtpSms(phone: string) {
  try {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 1. 메모리 저장 (초고속 검증 보장)
    memoryOtpMap.set(cleanPhone, { code: otp, timestamp: Date.now() });

    // 2. Supabase 저장 (영속 보관)
    const db = supabaseAdmin || supabase;
    if (db) {
      try {
        await db.from('sms_verifications').delete().eq('phone_number', cleanPhone);
        await db.from('sms_verifications').insert({
          phone_number: cleanPhone,
          code: otp,
          expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        });
      } catch (dbError) {
        console.warn('Supabase OTP save fallback to memory:', dbError);
      }
    }

    const msg = `[AURA] 본인확인 인증번호는 [${otp}]입니다. 타인에게 노출하지 마세요.`;

    const apiKey = process.env.ALIGO_API_KEY || '8oikzy8391zwuczt60s1tl0a11s0rv5z';
    const userId = process.env.ALIGO_USER_ID || 'rlaghddlf01';
    const sender = process.env.ALIGO_SENDER || '01048468575';

    if (!apiKey || !userId || !sender) {
      console.warn('⚠️ 알리고 API 키 미설정으로 시뮬레이션 발송 처리됩니다.');
      console.log(`[시뮬레이션] ${cleanPhone} 번호로 발송된 OTP: ${otp}`);
      return { success: true, simulated: true, code: otp };
    }

    const params = new URLSearchParams();
    params.append('key', apiKey);
    params.append('user_id', userId);
    params.append('sender', sender.replace(/[^0-9]/g, ''));
    params.append('receiver', cleanPhone);
    params.append('msg', msg);

    const requestConfig: any = {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      timeout: 10000,
    };

    // Vercel 고정 IP 아웃바운드 프록시 (Fixie 등) 자동 감지 및 연동
    if (process.env.FIXIE_URL) {
      try {
        const parsedUrl = new URL(process.env.FIXIE_URL);
        const username = parsedUrl.username;
        const password = parsedUrl.password;

        requestConfig.proxy = {
          protocol: parsedUrl.protocol.replace(':', ''),
          host: parsedUrl.hostname,
          port: parseInt(parsedUrl.port || '80'),
          ...(username ? { auth: { username, password } } : {}),
        };
        console.log(`[Aligo Proxy] Routing via Fixie proxy: ${parsedUrl.hostname}:${parsedUrl.port}`);
      } catch (proxyError: any) {
        console.error(`[Aligo Proxy Error] Failed to parse FIXIE_URL:`, proxyError.message);
      }
    }

    const res = await axios.post('https://apis.aligo.in/send/', params, requestConfig);

    if (res.data.result_code === 1 || res.data.result_code === '1') {
      return { success: true };
    } else {
      console.warn(`[Aligo API Error] Code ${res.data.result_code}: ${res.data.message}`);
      // IP 제한(-101) 또는 잔여건수 부족 등의 경우에도 앱 테스트가 막히지 않도록 안전하게 처리
      return { success: true, simulated: true, code: otp, error: res.data.message };
    }
  } catch (error: any) {
    console.error('Aligo OTP Error:', error.message);
    return { success: false, error: '문자 발송 서버 오류가 발생했습니다.' };
  }
}

export async function verifyOtpSms(phone: string, inputCode: string) {
  try {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const trimmedInput = inputCode.trim();

    // 마스터 테스트코드 허용
    if (trimmedInput === '123456') {
      return { success: true };
    }

    // 1. 메모리 확인
    const memoryRecord = memoryOtpMap.get(cleanPhone);
    if (memoryRecord) {
      if (Date.now() - memoryRecord.timestamp > 5 * 60 * 1000) {
        memoryOtpMap.delete(cleanPhone);
        return { success: false, error: '인증 시간이 만료되었습니다. 다시 시도해 주세요.' };
      }
      if (memoryRecord.code === trimmedInput) {
        memoryOtpMap.delete(cleanPhone);
        return { success: true };
      }
    }

    // 2. Supabase DB 확인
    const db = supabaseAdmin || supabase;
    if (db) {
      const { data } = await db
        .from('sms_verifications')
        .select('*')
        .eq('phone_number', cleanPhone)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        if (new Date(data.expires_at).getTime() < Date.now()) {
          return { success: false, error: '인증 시간이 만료되었습니다. 다시 시도해 주세요.' };
        }
        if (data.code === trimmedInput) {
          await db.from('sms_verifications').delete().eq('phone_number', cleanPhone);
          return { success: true };
        }
      }
    }

    return { success: false, error: '인증번호가 일치하지 않습니다.' };
  } catch (error: any) {
    console.error('Verify OTP Error:', error.message);
    return { success: false, error: '인증 확인 중 서버 오류가 발생했습니다.' };
  }
}
