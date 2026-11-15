import * as pdfjsLib from "pdfjs-dist";
import { createWorker } from "tesseract.js";
import { normalizePersianText } from "../lib/persianNormalizer";
import { buildEpubBlob } from "../lib/epubBuilder";

// Setup PDF.js worker from CDN or local
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface DetectedHeading {
  title: string;
  pageNum: number;
}

interface OutlineNode {
  title: string;
  dest: any;
  items?: OutlineNode[];
}

const CHAPTER_PATTERNS = [
  /^\s*(فصل\s+[\u06F0-\u06F90-9\u0621-\u0628\u062A-\u063A\u0641-\u0642\u0644-\u0648\u06CC\u067E\u0686\u06AF\u0698\s\-:–—]+)/i,
  /^\s*(بخش\s+[\u06F0-\u06F90-9\u0621-\u0628\u062A-\u063A\u0641-\u0642\u0644-\u0648\u06CC\u067E\u0686\u06AF\u0698\s\-:–—]+)/i,
  /^\s*(گفتار\s+[\u06F0-\u06F90-9\u0621-\u0628\u062A-\u063A\u0641-\u0642\u0644-\u0648\u06CC\u067E\u0686\u06AF\u0698\s\-:–—]+)/i,
  /^\s*(مقدمه|پیش‌گفتار|پیشگفتار|نتیجه‌گیری|نتیجه\s*گیری|پیوست|ضمیمه)\b/i,
  /^\s*(Chapter\s+[\dA-Za-zIVXLCDM\s\-:–—]+)/i,
  /^\s*(Section\s+[\dA-Za-zIVXLCDM\s\-:–—]+)/i,
  /^\s*(Part\s+[\dA-Za-zIVXLCDM\s\-:–—]+)/i,
  /^\s*(Preface|Introduction|Conclusion|Appendix)\b/i,
];

async function resolveDestToPageNum(pdf: any, dest: any): Promise<number | null> {
  try {
    let explicitDest = dest;
    if (typeof dest === "string") {
      explicitDest = await pdf.getDestination(dest);
    }
    if (!Array.isArray(explicitDest) || explicitDest.length === 0) {
      return null;
    }
    const destRef = explicitDest[0];
    if (typeof destRef === "object" && destRef !== null) {
      const pageIndex = await pdf.getPageIndex(destRef);
      if (typeof pageIndex === "number" && !isNaN(pageIndex)) {
        return pageIndex + 1; // 1-based page index
      }
    } else if (typeof destRef === "number") {
      return destRef + 1;
    }
  } catch (err) {
    // If destination resolution fails, gracefully return null
  }
  return null;
}

async function extractOutlineHeadings(pdf: any): Promise<DetectedHeading[]> {
  const result: DetectedHeading[] = [];
  try {
    const outline = (await pdf.getOutline()) as OutlineNode[] | null;
    if (!outline || !Array.isArray(outline) || outline.length === 0) {
      return result;
    }

    async function traverse(items: OutlineNode[]) {
      for (const item of items) {
        if (item.dest && item.title) {
          const pageNum = await resolveDestToPageNum(pdf, item.dest);
          if (pageNum !== null) {
            result.push({
              title: item.title.trim().replace(/\s+/g, " "),
              pageNum,
            });
          }
        }
        if (item.items && Array.isArray(item.items) && item.items.length > 0) {
          await traverse(item.items);
        }
      }
    }

    await traverse(outline);
    result.sort((a, b) => a.pageNum - b.pageNum);
  } catch (err) {
    console.warn("Failed to extract PDF outline:", err);
  }
  return result;
}

function detectHeadingInPage(text: string, maxFontSize?: number, avgFontSize?: number): string | null {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return null;

  // Check top 5 lines for chapter keyword patterns
  const candidateLines = lines.slice(0, 5);
  for (const line of candidateLines) {
    for (const pattern of CHAPTER_PATTERNS) {
      if (pattern.test(line)) {
        return line.slice(0, 80);
      }
    }
  }

  // If text prominence heuristic is provided (e.g. font size is significantly larger than body text)
  if (maxFontSize && avgFontSize && maxFontSize >= avgFontSize * 1.35) {
    const firstLine = candidateLines[0];
    if (firstLine && firstLine.length <= 60 && !/^[0-9\u06F0-\u06F9]+$/.test(firstLine)) {
      return firstLine;
    }
  }

  return null;
}

self.onmessage = async (e: MessageEvent) => {
  const { fileBuffer, options } = e.data;
  const { lang = "fas+ara", mode = "auto", title = "کتاب صوتی", author = "نامشخص" } = options || {};

  try {
    self.postMessage({ type: "progress", stage: "parsing", percent: 5, message: "بارگذاری سند PDF..." });

    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(fileBuffer) });
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;

    self.postMessage({ type: "progress", stage: "parsing", percent: 8, message: "بررسی ساختار و سرفصل‌های کتاب..." });
    const outlineHeadings = await extractOutlineHeadings(pdf);
    const outlineMap = new Map<number, string>();
    for (const h of outlineHeadings) {
      if (!outlineMap.has(h.pageNum)) {
        outlineMap.set(h.pageNum, h.title);
      }
    }

    let tesseractWorker: any = null;
    const needsOcr = mode === "ocr";

    const origin = self.location.origin;
    const tessdataPath = `${origin}/tessdata`;

    if (needsOcr) {
      self.postMessage({ type: "progress", stage: "ocr_init", percent: 10, message: "آماده‌سازی موتور پردازش تصویر (OCR)..." });
      tesseractWorker = await createWorker(lang, 1, {
        langPath: tessdataPath,
        cacheMethod: "readOnly",
        gzip: false,
      });
    }

    const pagesData: { pageNum: number; text: string; headingTitle?: string }[] = [];

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const currentPercent = Math.round(10 + (pageNum / numPages) * 75);
      self.postMessage({
        type: "progress",
        stage: "processing",
        percent: currentPercent,
        page: pageNum,
        totalPages: numPages,
        message: `پردازش صفحه ${pageNum} از ${numPages}...`,
      });

      const page = await pdf.getPage(pageNum);
      let pageText = "";
      let maxFontSize = 0;
      let totalFontSize = 0;
      let fontCount = 0;

      // Try reading embedded text first if not pure OCR mode
      if (mode !== "ocr") {
        const textContent = await page.getTextContent();
        const items = textContent.items as any[];
        if (items && items.length > 0) {
          const lineMap = new Map<number, any[]>();
          for (const item of items) {
            const y = Math.round(item.transform[5]);
            if (!lineMap.has(y)) lineMap.set(y, []);
            lineMap.get(y)!.push(item);

            const fontSize = Math.hypot(item.transform[0] || 0, item.transform[1] || 0) || Math.abs(item.height || 0);
            if (fontSize > 0) {
              if (fontSize > maxFontSize) maxFontSize = fontSize;
              totalFontSize += fontSize;
              fontCount++;
            }
          }

          // Sort descending Y (top to bottom)
          const sortedYs = Array.from(lineMap.keys()).sort((a, b) => b - a);
          const lines: string[] = [];

          for (const y of sortedYs) {
            const row = lineMap.get(y)!;
            // In Persian RTL, row runs right to left
            row.sort((a, b) => b.transform[4] - a.transform[4]);
            lines.push(row.map((it) => it.str).join(" "));
          }
          pageText = lines.join("\n");
        }
      }

      // If page has no text or is scanned image, run OCR
      if (!pageText.trim()) {
        if (!tesseractWorker) {
          self.postMessage({ type: "progress", stage: "ocr_init", percent: currentPercent, message: "آماده‌سازی OCR..." });
          tesseractWorker = await createWorker(lang, 1, {
            langPath: tessdataPath,
            cacheMethod: "readOnly",
            gzip: false,
          });
        }

        // Render page to canvas
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = new OffscreenCanvas(viewport.width, viewport.height);
        const ctx = canvas.getContext("2d")!;
        await page.render({ canvasContext: ctx as any, viewport }).promise;

        const blob = await canvas.convertToBlob();

        // Emit thumbnail for live UI feedback
        try {
          const reader = new FileReader();
          reader.onloadend = () => {
            self.postMessage({
              type: "thumbnail",
              page: pageNum,
              dataUrl: reader.result,
            });
          };
          reader.readAsDataURL(blob);
        } catch (e) {
          // ignore thumbnail errors
        }

        const { data } = await tesseractWorker.recognize(blob);
        pageText = data.text;
      }

      const cleanPageText = normalizePersianText(pageText);
      const avgFontSize = fontCount > 0 ? totalFontSize / fontCount : undefined;

      // Determine chapter title for this page if it marks a boundary
      let headingTitle: string | undefined = outlineMap.get(pageNum);
      if (!headingTitle && outlineHeadings.length === 0) {
        // Fall back to semantic heuristics
        const detected = detectHeadingInPage(cleanPageText, maxFontSize, avgFontSize);
        if (detected) {
          headingTitle = detected;
        }
      }

      pagesData.push({
        pageNum,
        text: cleanPageText,
        headingTitle,
      });
    }

    if (tesseractWorker) {
      await tesseractWorker.terminate();
    }

    // Group pages into chapters based on detected outlines/headings or safe interval fallback
    const chapters: { title: string; content: string }[] = [];
    let currentChapterTitle = pagesData[0]?.headingTitle || "بخش ۱";
    let currentChapterPages: string[] = [];
    let chapterIndex = 1;
    let pagesInCurrentChapter = 0;

    for (let i = 0; i < pagesData.length; i++) {
      const p = pagesData[i];
      const isNewHeading = Boolean(p.headingTitle) && (i > 0);
      const isTooLongFallback = (outlineHeadings.length === 0 && !p.headingTitle && pagesInCurrentChapter >= 15);

      if (isNewHeading || isTooLongFallback) {
        const content = currentChapterPages.join("\n\n").trim();
        if (content) {
          chapters.push({
            title: currentChapterTitle,
            content,
          });
        }
        chapterIndex++;
        currentChapterTitle = p.headingTitle || `بخش ${chapterIndex}`;
        currentChapterPages = [p.text];
        pagesInCurrentChapter = 1;
      } else {
        if (i === 0 && p.headingTitle) {
          currentChapterTitle = p.headingTitle;
        }
        currentChapterPages.push(p.text);
        pagesInCurrentChapter++;
      }
    }

    if (currentChapterPages.length > 0) {
      const content = currentChapterPages.join("\n\n").trim();
      if (content || chapters.length === 0) {
        chapters.push({
          title: currentChapterTitle,
          content,
        });
      }
    }

    // Final safety check: if everything ended up in empty chapters
    if (chapters.length === 0) {
      chapters.push({
        title: "کتاب کامل",
        content: pagesData.map((p) => p.text).join("\n\n").trim(),
      });
    }

    self.postMessage({ type: "progress", stage: "packaging", percent: 90, message: "تولید فایل کتاب‌خوان (EPUB)..." });

    // Fetch embedded Vazirmatn font from public
    let fontBuffer: ArrayBuffer | undefined;
    try {
      const fontRes = await fetch("/Vazirmatn-Regular.ttf");
      if (fontRes.ok) fontBuffer = await fontRes.arrayBuffer();
    } catch (e) {
      console.warn("Could not load local font:", e);
    }

    const epubBlob = await buildEpubBlob(chapters, { title, author, language: "fa" }, fontBuffer);

    self.postMessage({
      type: "complete",
      epubBlob,
      filename: `${title.replace(/[\/\\?%*:|"<>]/g, "_")}.epub`,
      totalPages: numPages,
    });
  } catch (err: any) {
    self.postMessage({ type: "error", error: err?.message || String(err) });
  }
};
