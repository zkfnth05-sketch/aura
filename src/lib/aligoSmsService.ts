import { supabaseAdmin } from './supabaseServer';

interface SendSmsOptions {
  receiver: string;
  code: string;
  msg?: string;
}

interface AligoResponse {
  result_code: string | number;
  message: string;
  msg_id?: string;
  success_cnt?: number;
  error_cnt?: number;
}

export class AligoSmsService {
  private static readonly API_URL = 'https://apis.aligo.co.kr/send/';

  /**
   * 6자리 인증번호 생성
   */
  public static generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * 알리고를 통한 SMS 발송
   */
  public static async sendSms({ receiver, code, msg }: SendSmsOptions): Promise<{ success: boolean; message: string; testMode?: boolean }> {
    const apiKey = process.env.ALIGO_API_KEY;
    const userId = process.env.ALIGO_USER_ID;
    const sender = process.env.ALIGO_SENDER;
    const isTestMode = process.env.ALIGO_TEST_MODE === 'Y' || !apiKey || !userId;

    const formattedReceiver = receiver.replace(/[^0-9]/g, '');
    const smsMessage = msg || `[AURA] 인증번호는 [${code}] 입니다. 타인에게 노출하지 마세요.`;

    // 개발/테스트 환경이거나 알리고 키 미설정 시 콘솔 출력 후 통과
    if (isTestMode) {
      console.log(`[SMS TEST MODE] 수신: ${formattedReceiver}, 인증코드: ${code}`);
      return {
        success: true,
        message: `테스트 모드 발송 성공 (인증코드: ${code})`,
        testMode: true,
      };
    }

    try {
      const formData = new URLSearchParams();
      formData.append('key', apiKey!);
      formData.append('user_id', userId!);
      formData.append('sender', sender || '01000000000');
      formData.append('receiver', formattedReceiver);
      formData.append('msg', smsMessage);
      formData.append('title', 'AURA 인증번호');

      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      if (!response.ok) {
        throw new Error(`Aligo HTTP error: ${response.status}`);
      }

      const data: AligoResponse = await response.json();

      if (String(data.result_code) === '1') {
        return { success: true, message: '인증번호가 발송되었습니다.' };
      } else {
        console.error('Aligo API Error:', data);
        return { success: false, message: data.message || '문자 발송에 실패했습니다.' };
      }
    } catch (error: any) {
      console.error('Aligo Send Error:', error);
      return { success: false, message: error.message || '문자 발송 중 오류가 발생했습니다.' };
    }
  }

  /**
   * 슈퍼베이스에 인증코드 저장 (5분 유효)
   */
  public static async saveVerificationCode(phoneNumber: string, code: string): Promise<boolean> {
    if (!supabaseAdmin) {
      console.error('supabaseAdmin is not configured');
      return false;
    }

    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    // 기존 발송 코드 삭제 후 새 코드 추가
    await supabaseAdmin
      .from('sms_verifications')
      .delete()
      .eq('phone_number', cleanPhone);

    const { error } = await supabaseAdmin
      .from('sms_verifications')
      .insert({
        phone_number: cleanPhone,
        code,
        expires_at: expiresAt,
      });

    if (error) {
      console.error('Failed to save verification code:', error);
      return false;
    }

    return true;
  }

  /**
   * 인증코드 검증
   */
  public static async verifyCode(phoneNumber: string, code: string): Promise<{ valid: boolean; message?: string }> {
    if (!supabaseAdmin) {
      return { valid: false, message: '서버 DB 설정 오류' };
    }

    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');

    const { data, error } = await supabaseAdmin
      .from('sms_verifications')
      .select('*')
      .eq('phone_number', cleanPhone)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return { valid: false, message: '인증번호 요청 내역이 없습니다.' };
    }

    // 만료 시간 확인
    if (new Date(data.expires_at).getTime() < Date.now()) {
      return { valid: false, message: '인증번호 유효 시간이 만료되었습니다. 다시 요청해 주세요.' };
    }

    // 코드 일치 확인
    if (data.code !== code) {
      return { valid: false, message: '인증번호가 일치하지 않습니다.' };
    }

    // 사용 완료된 인증코드 삭제
    await supabaseAdmin
      .from('sms_verifications')
      .delete()
      .eq('phone_number', cleanPhone);

    return { valid: true };
  }
}
