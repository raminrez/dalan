// Normalizes Persian and Arabic text extracted from PDFs or OCR
export function normalizePersianText(text: string): string {
  if (!text) return "";

  // 1. Unify Arabic Ye / Ke to Persian
  let normalized = text
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/ـ/g, ""); // strip tatweel

  // 2. Preserve & standardize Zero-Width Non-Joiner (ZWNJ / نیم‌فاصله \u200c)
  // For prefixes like می, نمی, بی
  normalized = normalized.replace(/\b(می|نمی|بی)\s+/gu, "$1\u200c");

  // For common plural suffixes like ها, های, هایم, هایت
  normalized = normalized.replace(/\s+(ها|های|هایم|هایت|هایش|هایمان|هایتان|هایشان)\b/gu, "\u200c$1");

  // For possessive/verbal suffixes like ام, ات, اش, ایم, اید, اند
  normalized = normalized.replace(/\b([آ-ی]+)\s+(ام|ات|اش|ایم|اید|اند)\b/gu, "$1\u200c$2");

  // Clean redundant whitespace around ZWNJ
  normalized = normalized.replace(/[ \t]*\u200c[ \t]*/g, "\u200c");

  // 3. Convert English/Arabic digits to Persian standard digits
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  const arabicIndicDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];

  // Replace Arabic-Indic digits
  for (let i = 0; i < 10; i++) {
    normalized = normalized.replaceAll(arabicIndicDigits[i], persianDigits[i]);
  }

  // 4. Clean consecutive spaces
  normalized = normalized.replace(/[ \t]+/g, " ");

  return normalized.trim();
}
