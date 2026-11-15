import * as pdfjsLib from "pdfjs-dist";
import { createWorker } from "tesseract.js";
import { normalizePersianText } from "../lib/persianNormalizer";
import { buildEpubBlob } from "../lib/epubBuilder";

// Setup PDF.js worker from CDN or local
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

self.onmessage = async (e: MessageEvent) => {
  const { fileBuffer, options } = e.data;
  const { lang = "fas+ara", mode = "auto", title = "کتاب صوتی", author = "نامشخص" } = options || {};

  try {
    self.postMessage({ type: "progress", stage: "parsing", percent: 5, message: "بارگذاری سند PDF..." });

    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(fileBuffer) });
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;

    const chapters: { title: string; content: string }[] = [];
    let tesseractWorker: any = null;

    // Check if we need OCR
    const needsOcr = mode === "ocr";

    if (needsOcr) {
      self.postMessage({ type: "progress", stage: "ocr_init", percent: 10, message: "آماده‌سازی موتور پردازش تصویر (OCR)..." });
      tesseractWorker = await createWorker(lang, 1, {
        langPath: "/tessdata",
        cacheMethod: "readOnly",
        gzip: false,
      });
    }

    let accumulatedText = "";
    let chapterCount = 1;

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

      // Try reading embedded text first if auto
      if (mode !== "ocr") {
        const textContent = await page.getTextContent();
        const items = textContent.items as any[];
        if (items && items.length > 0) {
          // Group items by vertical Y to reconstruct lines
          const lineMap = new Map<number, any[]>();
          for (const item of items) {
            const y = Math.round(item.transform[5]);
            if (!lineMap.has(y)) lineMap.set(y, []);
            lineMap.get(y)!.push(item);
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
            langPath: "/tessdata",
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
      accumulatedText += `\n\n${cleanPageText}`;

      // Chunk into chapters every ~10 pages
      if (pageNum % 10 === 0 || pageNum === numPages) {
        chapters.push({
          title: `بخش ${chapterCount}`,
          content: accumulatedText.trim(),
        });
        accumulatedText = "";
        chapterCount++;
      }
    }

    if (tesseractWorker) {
      await tesseractWorker.terminate();
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
