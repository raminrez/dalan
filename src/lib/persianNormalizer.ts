/**
 * Persian / Arabic Text Normalizer for Dalan
 * Incorporates Persian orthography and Paknevis/Davat copy-editing standards:
 * - Unicode NFKC normalization (crucial to fold Arabic Presentation Forms U+FB50..U+FEFF into standard Persian characters)
 * - Standardize Arabic Yeh (ي -> ی) and Kaf (ك -> ک)
 * - Strip diacritics / harakat and tatweel / keshide (ـ)
 * - Persian punctuation rules (?, ;, , -> ؟, ؛, ، and "..." -> «...»)
 * - Standardize Zero-Width Non-Joiner (ZWNJ / نیم‌فاصله \u200c) for verb prefixes (می, نمی),
 *   plural suffixes (ها, های...), superlative/comparative suffixes (ترین, تر), and possessives
 * - Persian numerals (۰-۹)
 */

export function normalizePersianText(text: string): string {
  if (!text) return "";
  const ZWNJ = "\u200c";

  // Step 1: Unicode NFKC Normalization
  // Digital PDFs often store Persian as raw presentation glyphs (e.g. ﻣﺎﺷﯿﻦ -> 0xFEE1 0xFE8E...)
  // NFKC folds these into canonical Persian Unicode points.
  let s = text.normalize("NFKC");

  // Step 2: Canonical Persian character mappings
  const charMap: Record<string, string> = {
    "\u064A": "\u06CC", // Arabic Yeh -> Persian Yeh (ي -> ی)
    "\u0643": "\u06A9", // Arabic Kaf -> Persian Kaf (ك -> ک)
    "\u0625": "\u0627", // Arabic Alef with hamza below -> Alef (إ -> ا)
    "\u0629": "\u0647", // Ta marbuta -> Heh (ة -> ه)
    "\u0670": "",       // Superscript Alef -> drop
    "\u0640": "",       // Tatweel / Keshide (ـ) -> drop
  };
  s = s.replace(/[\u064A\u0643\u0625\u0629\u0670\u0640]/g, (ch) => charMap[ch] ?? ch);

  // Step 3: Remove Arabic diacritics / harakat (fathatan, dammatan, fatha, damma, kasra, shadda, sukun)
  s = s.replace(/[\u064B-\u0652\u0653\u0655]/g, "");

  // Step 4: Persian punctuation mapping
  s = s.replace(/(?<=[0-9۰-۹]),(?=[0-9۰-۹])/g, "\u066C"); // Persian thousands separator
  s = s.replace(/\?/g, "؟").replace(/;/g, "؛").replace(/,/g, "،");

  // Paired double quotes to guillemets « »
  let inQuote = false;
  s = s.replace(/"/g, () => {
    inQuote = !inQuote;
    return inQuote ? "«" : "»";
  });

  // Step 5: Ellipsis normalization (... or . . . -> …)
  s = s.replace(/(?:\.\s*){2,}\./g, "…").replace(/\.{4,}/g, "…").replace(/…{2,}/g, "…");

  // Step 6: Fix punctuation spacing (within line)
  s = s.replace(/[ \t]+([!?؟:;,؛،.])/g, "$1");
  s = s.replace(/([،؛:!?.])[ \t]{2,4}(?![ \t])/g, "$1 ");

  // Step 7: ZWNJ for verb prefixes (می, نمی)
  s = s.replace(/(^|[\s«\(\[])(ن?می)\s+([\u0621-\u06CC]{2,})/gu, `$1$2${ZWNJ}$3`);

  // Step 8: ZWNJ for plural and superlative suffixes
  const boundary = "(?=[\\s\\u060C\\u061B\\u061F.،؛!؟»\\)\\]]|$)";
  const pluralRegex = new RegExp(`([\\u0621-\\u06CC]+)\\s+(ها(?:ی(?:م|ت|ش|مان|تان|شان)?|یی)?)${boundary}`, "gu");
  s = s.replace(pluralRegex, `$1${ZWNJ}$2`);

  // Superlative suffix "ترین"
  const supRegex = new RegExp(`([\\u0621-\\u06CC]{2,})\\s+(ترین)${boundary}`, "gu");
  s = s.replace(supRegex, `$1${ZWNJ}$2`);

  // Comparative suffix "تر" (preserves idiom pairs like "تر و تمیز", "تر و تازه")
  const compRegex = new RegExp(`([\\u0621-\\u06CC]{2,})\\s+تر${boundary}`, "gu");
  s = s.replace(compRegex, (match, word, offset, str) => {
    const tail = str.slice(offset + match.length, offset + match.length + 30);
    if (/^\s+و\s+(تمیز|تازه|فرز|خشک)(?=[\s\u060C\u061B\u061F.،؛!؟»\)\],]|$)/u.test(tail)) {
      return match;
    }
    return `${word}${ZWNJ}تر`;
  });

  // Step 9: Possessives after heh (خانه ام -> خانه‌ام)
  const possRegex = new RegExp(`([هة])\\s+(ام|ات|اش|مان|تان|شان|ای)${boundary}`, "gu");
  s = s.replace(possRegex, `$1${ZWNJ}$2`);

  // Ezafe after heh (خانه‌ی -> خانهٔ)
  const ezRegex = new RegExp(`([هة])\\u200cی${boundary}`, "gu");
  s = s.replace(ezRegex, "$1\u0654");

  // Clean redundant whitespace around ZWNJ
  s = s.replace(/[ \t]*\u200c[ \t]*/g, ZWNJ);

  // Step 10: Convert digits to Persian standard
  const enDigits = "0123456789";
  const arDigits = "٠١٢٣٤٥٦٧٨٩";
  const faDigits = "۰۱۲۳۴۵۶۷۸۹";
  for (let i = 0; i < 10; i++) {
    s = s.replaceAll(enDigits[i], faDigits[i]).replaceAll(arDigits[i], faDigits[i]);
  }

  // Step 11: Extra spaces (collapse multiple spaces/tabs into one)
  s = s.replace(/[ \t]{2,}/g, " ");

  return s.trim();
}
