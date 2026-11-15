import * as pdfjsLib from "pdfjs-dist";
import { createWorker } from "tesseract.js";
import { normalizePersianText } from "../lib/persianNormalizer";
import { buildEpubBlob, type EpubImage } from "../lib/epubBuilder";

// Setup PDF.js worker from CDN or local
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface ExtractedPageImage {
  filename: string;
  buffer: ArrayBuffer;
  mimeType: string;
  altText: string;
}

/**
 * Converts raw PDF image object or RGBA data into JPEG ArrayBuffer via OffscreenCanvas
 */
async function imageObjToArrayBuffer(imgObj: any): Promise<{ buffer: ArrayBuffer; mimeType: string } | null> {
  try {
    const width = imgObj.width;
    const height = imgObj.height;
    if (!width || !height || width <= 10 || height <= 10) {
      return null;
    }

    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Check if imgObj is already an ImageBitmap or HTMLImageElement-like
    if (imgObj.data) {
      const imgData = ctx.createImageData(width, height);
      const data = imgObj.data;
      const target = imgData.data;

      // Handle different color formats
      // Case 1: RGBA (length === width * height * 4)
      if (data.length === width * height * 4) {
        target.set(data);
      } else if (data.length === width * height * 3) {
        // Case 2: RGB (length === width * height * 3)
        let s = 0;
        let t = 0;
        const total = width * height;
        for (let i = 0; i < total; i++) {
          target[t] = data[s];
          target[t + 1] = data[s + 1];
          target[t + 2] = data[s + 2];
          target[t + 3] = 255;
          s += 3;
          t += 4;
        }
      } else if (data.length === width * height) {
        // Case 3: Grayscale 1 byte per pixel
        let t = 0;
        const total = width * height;
        for (let i = 0; i < total; i++) {
          const val = data[i];
          target[t] = val;
          target[t + 1] = val;
          target[t + 2] = val;
          target[t + 3] = 255;
          t += 4;
        }
      } else {
        return null;
      }

      ctx.putImageData(imgData, 0, 0);
    } else if (imgObj.bitmap) {
      ctx.drawImage(imgObj.bitmap, 0, 0);
    } else {
      return null;
    }

    const blob = await canvas.convertToBlob({ type: "image/jpeg", quality: 0.85 });
    const buffer = await blob.arrayBuffer();
    return { buffer, mimeType: "image/jpeg" };
  } catch (err) {
    console.warn("Failed to convert image object to ArrayBuffer:", err);
    return null;
  }
}

/**
 * Extracts raster illustrations embedded in a PDF page.
 */
async function extractImagesFromPage(page: any, pageNum: number): Promise<ExtractedPageImage[]> {
  const images: ExtractedPageImage[] = [];
  try {
    const ops = await page.getOperatorList();
    const imageNames = new Set<string>();

    for (let i = 0; i < ops.fnArray.length; i++) {
      const fn = ops.fnArray[i];
      const args = ops.argsArray[i];

      // OPS.paintImageXObject (85) or OPS.paintXObject (66)
      if (
        fn === pdfjsLib.OPS.paintImageXObject ||
        fn === pdfjsLib.OPS.paintXObject ||
        fn === pdfjsLib.OPS.paintInlineImageXObject
      ) {
        const imgName = args && args[0];
        if (typeof imgName === "string" && !imageNames.has(imgName)) {
          imageNames.add(imgName);
        }
      }
    }

    let imgIndex = 1;
    for (const name of imageNames) {
      try {
        let imgObj: any = null;
        if (page.objs && typeof page.objs.get === "function") {
          imgObj = await new Promise((resolve) => {
            page.objs.get(name, (obj: any) => resolve(obj));
          });
        }

        if (imgObj) {
          // Filter out tiny icons or bullet decorations (e.g. < 40x40)
          if (imgObj.width && imgObj.height && (imgObj.width < 40 || imgObj.height < 40)) {
            continue;
          }

          const converted = await imageObjToArrayBuffer(imgObj);
          if (converted) {
            images.push({
              filename: `img_p${pageNum}_${imgIndex}.jpg`,
              buffer: converted.buffer,
              mimeType: converted.mimeType,
              altText: `تصویر شماره ${imgIndex} صفحه ${pageNum}`,
            });
            imgIndex++;
          }
        }
      } catch (e) {
        // Individual image extraction error
      }
    }
  } catch (err) {
    console.warn(`Error scanning images for page ${pageNum}:`, err);
  }
  return images;
}

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

// Helper types and interfaces for layout extraction
interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TextItemWithBox {
  item: any;
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
}

interface ColumnGutter {
  left: number;
  right: number;
  center: number;
}

/**
 * Reconstructs lines of text items sorted vertically top-to-bottom,
 * and within each line horizontally according to script direction.
 */
function reconstructLinesFromItems(items: TextItemWithBox[], isRTL: boolean): string {
  if (items.length === 0) return "";

  // Group items into lines by Y coordinate with baseline tolerance (~3.5px)
  const Y_TOLERANCE = 3.5;
  const lines: { y: number; items: TextItemWithBox[] }[] = [];

  for (const item of items) {
    let matchedLine = lines.find((line) => Math.abs(line.y - item.y) <= Y_TOLERANCE);
    if (!matchedLine) {
      matchedLine = { y: item.y, items: [] };
      lines.push(matchedLine);
    }
    matchedLine.items.push(item);
  }

  // Sort lines top to bottom (descending Y in PDF coordinates)
  lines.sort((a, b) => b.y - a.y);

  const lineStrings: string[] = [];
  for (const line of lines) {
    // In Persian/Arabic (RTL), line reads from right to left (descending X)
    // In English/LTR, line reads from left to right (ascending X)
    if (isRTL) {
      line.items.sort((a, b) => b.x - a.x);
    } else {
      line.items.sort((a, b) => a.x - b.x);
    }
    lineStrings.push(line.items.map((it) => it.str).join(" "));
  }

  return lineStrings.join("\n");
}

/**
 * Detects if a page contains a distinct two-column layout separated by a vertical gutter.
 * Evaluates the middle 40% of the page (0.3 * pageWidth to 0.7 * pageWidth).
 */
function detectTwoColumnGutter(
  items: TextItemWithBox[],
  pageWidth: number
): ColumnGutter | null {
  if (items.length < 10 || pageWidth <= 0) {
    return null;
  }

  // Define candidate gutter search range: middle band of the page
  const searchStart = pageWidth * 0.3;
  const searchEnd = pageWidth * 0.7;
  const minGutterWidth = 14; // minimum vertical blank space in points

  // Filter out full-width spanning items (e.g. wide titles, banners, horizontal rules)
  // that would bridge across both columns (> 55% of page width)
  const nonSpanningItems = items.filter(
    (it) => it.width < pageWidth * 0.55 && it.str.trim().length > 0
  );

  if (nonSpanningItems.length < 8) {
    return null;
  }

  // Check intervals/gutters between items in the search window.
  // We can sample vertical slices across searchStart..searchEnd with 2px step
  // and check how many non-spanning items cross each X position.
  const step = 2;
  const slicesCount = Math.floor((searchEnd - searchStart) / step);
  const overlapCounts: number[] = new Array(slicesCount).fill(0);

  for (const it of nonSpanningItems) {
    const itLeft = it.x;
    const itRight = it.x + it.width;

    const startIdx = Math.max(0, Math.floor((itLeft - searchStart) / step));
    const endIdx = Math.min(slicesCount - 1, Math.floor((itRight - searchStart) / step));

    for (let i = startIdx; i <= endIdx; i++) {
      overlapCounts[i]++;
    }
  }

  // Find continuous intervals with 0 (or at most 1 due to stray character) overlaps
  let bestGutterStart = -1;
  let bestGutterEnd = -1;
  let maxZeroGap = 0;

  let currentStart = -1;
  for (let i = 0; i < slicesCount; i++) {
    // A clean gutter has 0 overlaps of non-spanning text
    if (overlapCounts[i] === 0) {
      if (currentStart === -1) currentStart = i;
    } else {
      if (currentStart !== -1) {
        const gap = (i - currentStart) * step;
        if (gap > maxZeroGap) {
          maxZeroGap = gap;
          bestGutterStart = currentStart;
          bestGutterEnd = i;
        }
        currentStart = -1;
      }
    }
  }

  if (currentStart !== -1) {
    const gap = (slicesCount - currentStart) * step;
    if (gap > maxZeroGap) {
      maxZeroGap = gap;
      bestGutterStart = currentStart;
      bestGutterEnd = slicesCount;
    }
  }

  // If no completely empty gap found >= minGutterWidth, check for gap with <= 1 stray item
  if (maxZeroGap < minGutterWidth) {
    let currentLowStart = -1;
    let maxLowGap = 0;
    for (let i = 0; i < slicesCount; i++) {
      if (overlapCounts[i] <= 1) {
        if (currentLowStart === -1) currentLowStart = i;
      } else {
        if (currentLowStart !== -1) {
          const gap = (i - currentLowStart) * step;
          if (gap > maxLowGap) {
            maxLowGap = gap;
            bestGutterStart = currentLowStart;
            bestGutterEnd = i;
          }
          currentLowStart = -1;
        }
      }
    }
    if (currentLowStart !== -1) {
      const gap = (slicesCount - currentLowStart) * step;
      if (gap > maxLowGap) {
        maxLowGap = gap;
        bestGutterStart = currentLowStart;
        bestGutterEnd = slicesCount;
      }
    }
    if (maxLowGap < minGutterWidth) {
      return null;
    }
  }

  const gutterLeft = searchStart + bestGutterStart * step;
  const gutterRight = searchStart + bestGutterEnd * step;
  const gutterCenter = (gutterLeft + gutterRight) / 2;

  // Verify that there is substantial content on BOTH sides of this gutter
  const leftItems = nonSpanningItems.filter((it) => it.x + it.width <= gutterCenter + 5);
  const rightItems = nonSpanningItems.filter((it) => it.x >= gutterCenter - 5);

  const minItemsPerColumn = Math.max(4, Math.floor(nonSpanningItems.length * 0.15));
  if (leftItems.length < minItemsPerColumn || rightItems.length < minItemsPerColumn) {
    return null;
  }

  return {
    left: gutterLeft,
    right: gutterRight,
    center: gutterCenter,
  };
}

/**
 * Extracts and reconstructs text from a page, segmenting multi-column layouts
 * while respecting reading order (RTL: right column first; LTR: left column first)
 * and placing spanning headers/banners in correct order.
 */
function extractPageTextWithLayout(
  items: any[],
  pageWidth: number,
  isRTL: boolean
): string {
  if (!items || items.length === 0) return "";

  // Normalize text items with positions
  const textItems: TextItemWithBox[] = [];
  for (const item of items) {
    const str = item.str || "";
    if (!str && !item.hasEOL) continue;

    const x = item.transform[4] || 0;
    const y = item.transform[5] || 0;
    const width = typeof item.width === "number" && item.width > 0
      ? item.width
      : Math.abs(item.transform[0] || 10) * (str.length || 1) * 0.5;
    const height = Math.abs(item.height || item.transform[3] || item.transform[0] || 10);
    const fontSize = Math.hypot(item.transform[0] || 0, item.transform[1] || 0) || height;

    textItems.push({
      item,
      str,
      x,
      y,
      width,
      height,
      fontSize,
    });
  }

  if (textItems.length === 0) return "";

  // Check for dual-column gutter
  const gutter = detectTwoColumnGutter(textItems, pageWidth);

  // If no column gutter is detected, fallback directly to single-column reconstruction
  if (!gutter) {
    return reconstructLinesFromItems(textItems, isRTL);
  }

  // Segment items into Spanning (headers/titles across gutter), Left Column, and Right Column
  const spanningItems: TextItemWithBox[] = [];
  const leftColumnItems: TextItemWithBox[] = [];
  const rightColumnItems: TextItemWithBox[] = [];

  for (const it of textItems) {
    const itemLeft = it.x;
    const itemRight = it.x + it.width;

    // An item is considered spanning if:
    // 1. It crosses across the gutter center, OR
    // 2. Its width covers > 60% of the page
    const crossesGutter = itemLeft < (gutter.center - 8) && itemRight > (gutter.center + 8);
    const isFullWidth = it.width > pageWidth * 0.6;

    if (crossesGutter || isFullWidth) {
      spanningItems.push(it);
    } else if (itemRight <= gutter.center) {
      leftColumnItems.push(it);
    } else {
      rightColumnItems.push(it);
    }
  }

  // Separate spanning items into Top Headers (above the two columns) and Bottom Footers (below the two columns)
  // Calculate vertical bounds of column items
  const colItems = [...leftColumnItems, ...rightColumnItems];
  let colMaxY = -Infinity;
  let colMinY = Infinity;

  if (colItems.length > 0) {
    for (const it of colItems) {
      if (it.y > colMaxY) colMaxY = it.y;
      if (it.y < colMinY) colMinY = it.y;
    }
  }

  const topSpanning: TextItemWithBox[] = [];
  const bottomSpanning: TextItemWithBox[] = [];

  for (const sp of spanningItems) {
    // If spanning item is higher than column items (or near top of column with tolerance)
    if (colItems.length === 0 || sp.y >= colMaxY - 10) {
      topSpanning.push(sp);
    } else {
      bottomSpanning.push(sp);
    }
  }

  const sections: string[] = [];

  // 1. Top Spanning Header / Title
  if (topSpanning.length > 0) {
    const headerText = reconstructLinesFromItems(topSpanning, isRTL);
    if (headerText.trim()) sections.push(headerText);
  }

  // 2. Columns according to script reading order
  // Persian / Arabic (RTL): read Right Column first from top to bottom, then Left Column
  // English / LTR: read Left Column first from top to bottom, then Right Column
  if (isRTL) {
    const rightText = reconstructLinesFromItems(rightColumnItems, isRTL);
    if (rightText.trim()) sections.push(rightText);

    const leftText = reconstructLinesFromItems(leftColumnItems, isRTL);
    if (leftText.trim()) sections.push(leftText);
  } else {
    const leftText = reconstructLinesFromItems(leftColumnItems, isRTL);
    if (leftText.trim()) sections.push(leftText);

    const rightText = reconstructLinesFromItems(rightColumnItems, isRTL);
    if (rightText.trim()) sections.push(rightText);
  }

  // 3. Bottom Spanning Footers / Notes
  if (bottomSpanning.length > 0) {
    const footerText = reconstructLinesFromItems(bottomSpanning, isRTL);
    if (footerText.trim()) sections.push(footerText);
  }

  return sections.join("\n");
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
    const allExtractedImages: EpubImage[] = [];
    let coverBuffer: ArrayBuffer | undefined;

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

      // 1. If page 1, render cover image using OffscreenCanvas
      if (pageNum === 1) {
        try {
          const coverViewport = page.getViewport({ scale: 1.8 });
          const coverCanvas = new OffscreenCanvas(coverViewport.width, coverViewport.height);
          const coverCtx = coverCanvas.getContext("2d")!;
          await page.render({ canvasContext: coverCtx as any, viewport: coverViewport }).promise;
          const coverBlob = await coverCanvas.convertToBlob({ type: "image/jpeg", quality: 0.88 });
          coverBuffer = await coverBlob.arrayBuffer();
        } catch (coverErr) {
          console.warn("Failed to generate book cover from page 1:", coverErr);
        }
      }

      // 2. Try reading embedded text first if not pure OCR mode
      if (mode !== "ocr") {
        const textContent = await page.getTextContent();
        const items = textContent.items as any[];
        if (items && items.length > 0) {
          // Gather font metrics
          for (const item of items) {
            const fontSize = Math.hypot(item.transform[0] || 0, item.transform[1] || 0) || Math.abs(item.height || 0);
            if (fontSize > 0) {
              if (fontSize > maxFontSize) maxFontSize = fontSize;
              totalFontSize += fontSize;
              fontCount++;
            }
          }

          // Determine page width from viewport
          const viewport = page.getViewport({ scale: 1 });
          const pageWidth = viewport.width;

          // Determine if document/page is predominantly RTL
          // Based on selected OCR lang ("fas", "ara") or detection
          const isRTL = lang.includes("fas") || lang.includes("ara") || !lang.includes("eng");

          // Extract text with dual-column segmentation and correct reading order
          pageText = extractPageTextWithLayout(items, pageWidth, isRTL);
        }
      }

      // 3. Extract embedded illustrations/figures
      const pageImages = await extractImagesFromPage(page, pageNum);
      if (pageImages.length > 0) {
        for (const img of pageImages) {
          allExtractedImages.push({
            filename: img.filename,
            buffer: img.buffer,
            mimeType: img.mimeType,
          });
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

      let cleanPageText = normalizePersianText(pageText);

      // Append extracted images markup to the end of the page content
      if (pageImages.length > 0) {
        const imagesMarkup = pageImages
          .map(
            (img) =>
              `<div class="illustration-container"><img src="../images/${img.filename}" alt="${img.altText}" class="reflow-illustration"/></div>`
          )
          .join("\n\n");

        cleanPageText = cleanPageText
          ? `${cleanPageText}\n\n${imagesMarkup}`
          : imagesMarkup;
      }

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

    const epubBlob = await buildEpubBlob(
      chapters,
      { title, author, language: "fa" },
      fontBuffer,
      coverBuffer,
      allExtractedImages
    );

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
