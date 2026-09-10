export function normalizePhone(phone: string): { domestic: string; standard: string; isKorean: boolean } {
  const digits = phone.replace(/[^0-9]/g, '');

  let domestic = digits;
  let standard = digits;
  let isKorean = false;

  if (digits.startsWith('82') && digits.length >= 11) {
    domestic = '0' + digits.slice(2);
    standard = digits;
    isKorean = true;
  } else if (digits.startsWith('010') || digits.startsWith('011') || digits.startsWith('016') || digits.startsWith('017') || digits.startsWith('018') || digits.startsWith('019')) {
    domestic = digits;
    standard = '82' + digits.slice(1);
    isKorean = true;
  } else if ((digits.startsWith('10') || digits.startsWith('11')) && (digits.length === 10 || digits.length === 11)) {
    // 한국 번호인데 앞자리 0이 빠진 경우 (예: 1012345678)
    domestic = '0' + digits;
    standard = '82' + digits;
    isKorean = true;
  }

  return { domestic, standard, isKorean };
}
