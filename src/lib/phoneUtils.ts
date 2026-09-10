export function normalizePhone(phone: string): { domestic: string; standard: string } {
  const digits = phone.replace(/[^0-9]/g, '');

  let domestic = digits;
  if (digits.startsWith('82') && digits.length >= 11) {
    domestic = '0' + digits.slice(2);
  } else if (!digits.startsWith('0') && (digits.length === 10 || digits.length === 11)) {
    domestic = '0' + digits;
  }

  let standard = digits;
  if (domestic.startsWith('010') || domestic.startsWith('011') || domestic.startsWith('016') || domestic.startsWith('017') || domestic.startsWith('018') || domestic.startsWith('019')) {
    standard = '82' + domestic.slice(1);
  }

  return { domestic, standard };
}
