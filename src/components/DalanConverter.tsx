import React, { useState, useRef, useEffect } from "react";
import {
  Theme,
  Card,
  CardHeader,
  CardBody,
  Button,
  Badge,
  Switch,
  DropZone,
  FileTrigger,
  ProgressBar,
  TextField,
  NativeSelect,
  Icon,
  ActionableNotification,
} from "@hashti/react";

type Locale = "fa" | "en";
type ThemeMode = "relay-dark" | "relay-light";

export const APP_VERSION = "v0.1.0-alpha.2";
export const WASM_CORE_VERSION = "WASM Core v1.2";

interface Translations {
  appTitle: string;
  badgeSpatial: string;
  heroTitle: string;
  heroSubtitle: string;
  themeDark: string;
  themeLight: string;
  navPrivacy: string;
  navFeatures: string;
  navEngine: string;
  navGithub: string;
  navIssues: string;
  dropPrompt: string;
  dropPromptActive: string;
  dropHint: string;
  browseBtn: string;
  selectedFile: string;
  removeFile: string;
  metaHeading: string;
  metaDesc: string;
  bookTitleLabel: string;
  bookTitlePlaceholder: string;
  authorLabel: string;
  authorPlaceholder: string;
  modeLabel: string;
  modeAuto: string;
  modeOcr: string;
  langLabel: string;
  langFaAr: string;
  langFaOnly: string;
  langEnOnly: string;
  startBtn: string;
  processingTitle: string;
  processingBadge: string;
  previewAlt: string;
  pageTelemetry: (current: number, total: number) => string;
  progressLabel: string;
  successTitle: string;
  successDesc: string;
  downloadBtn: string;
  convertAnotherBtn: string;
  kindleGuideTitle: string;
  kindleGuideDesc: string;
  kindleLinkText: string;
  metaSummaryLabel: string;
  metaPages: (count: number) => string;
  metaModeUsed: string;
  errorTitle: string;
  retryBtn: string;

  // Privacy Section
  privacyTitle: string;
  privacySubtitle: string;
  privacyBadge: string;
  privacyStatement: string;
  privacyArchHeading: string;
  privacyArchItems: { title: string; desc: string }[];
  privacyVerifyHeading: string;
  privacyVerifySteps: string[];

  // Features Grid
  featuresTitle: string;
  featuresSubtitle: string;
  featureCards: { id: string; title: string; desc: string; badge: string; icon: string }[];

  // Engine & Cache
  engineTitle: string;
  engineSubtitle: string;
  activeAppVersion: string;
  activeWasmVersion: string;
  cacheStatusLabel: string;
  cacheStatusReady: string;
  purgeBtn: string;
  purgingText: string;
  purgeSuccessTitle: string;
  purgeSuccessDesc: string;
  reloadBtn: string;
  updateAvailableTitle: string;
  updateAvailableDesc: string;
  updateNowBtn: string;

  // Footer
  footerLicense: string;
  footerDesignCredit: string;
  footerOpenSourceNote: string;
}

const strings: Record<Locale, Translations> = {
  fa: {
    appTitle: "دالان • Dalan",
    badgeSpatial: "متن‌باز • بدون سرور",
    heroTitle: "تبدیل محلی PDF به کتاب‌خوان کیندل",
    heroSubtitle:
      "تبدیل مستقیم اسناد PDF به قالب استاندارد EPUB 3 بدون ارسال حتی یک بایت داده به شبکه؛ همراه با فونت درون‌ساخت وزیرمتن و چیدمان راست‌چین خوانا.",
    themeDark: "حالت تاریک",
    themeLight: "حالت روشن",
    navPrivacy: "تضمین حریم خصوصی",
    navFeatures: "قابلیت‌ها",
    navEngine: "موتور پردازش",
    navGithub: "مخزن گیت‌هاب",
    navIssues: "گزارش باگ",
    dropPrompt: "فایل PDF را به این بخش بکشید یا برای انتخاب کلیک کنید",
    dropPromptActive: "سند PDF خود را رها کنید...",
    dropHint: "پردازش کامل در مرورگر بدون ارسال داده به سرور با WebAssembly",
    browseBtn: "انتخاب فایل PDF",
    selectedFile: "سند انتخاب‌شده",
    removeFile: "تغییر فایل",
    metaHeading: "تنظیمات و متاداده سند",
    metaDesc: "اطلاعات کتاب و حالت پردازش متن را مشخص کنید",
    bookTitleLabel: "عنوان کتاب",
    bookTitlePlaceholder: "مثلاً: دیوان حافظ یا تاریخ بیهقی",
    authorLabel: "نویسنده یا مترجم",
    authorPlaceholder: "مثلاً: ابوالفضل بیهقی",
    modeLabel: "روش استخراج متن",
    modeAuto: "تشخیص هوشمند (متن مستقیم یا OCR تصویری)",
    modeOcr: "پردازش کامل تصویری (OCR - مناسب اسکن‌ها)",
    langLabel: "زبان محتوا",
    langFaAr: "فارسی و عربی (fas + ara)",
    langFaOnly: "فارسی خالص (fas)",
    langEnOnly: "انگلیسی (eng)",
    startBtn: "شروع تبدیل به EPUB",
    processingTitle: "در حال پردازش محلی سند",
    processingBadge: "پردازش در وب‌ورکر",
    previewAlt: "پیش‌نمایش زنده صفحه پردازش‌شده",
    pageTelemetry: (c, t) => `صفحه ${c} از ${t}`,
    progressLabel: "پیشرفت تبدیل",
    successTitle: "تبدیل فایل با موفقیت پایان یافت",
    successDesc:
      "کتاب شما با ساختار استاندارد EPUB 3، فونت وزیرمتن و برچسب‌های جهت متن (RTL/LTR) آماده دریافت است.",
    downloadBtn: "دانلود فایل EPUB",
    convertAnotherBtn: "تبدیل سند دیگر",
    kindleGuideTitle: "انتقال به دستگاه کیندل (Kindle)",
    kindleGuideDesc:
      "فایل دانلودشده را در وبگاه رسمی آمازون بارگذاری کنید یا به نشانی اختصاصی کیندل بفرستید:",
    kindleLinkText: "سرویس Send to Kindle آمازون",
    metaSummaryLabel: "مشخصات فایل نهایی:",
    metaPages: (c) => `${c} صفحه پردازش‌شده`,
    metaModeUsed: "پردازش محلی با WebAssembly",
    errorTitle: "خطایی در پردازش رخ داد",
    retryBtn: "تلاش دوباره",

    // Privacy Section
    privacyTitle: "تضمین فنی حریم خصوصی و عدم نشت داده",
    privacySubtitle: "تمامی مراحل پردازش متن، استخراج تصویر و ساخت فایل داخل مرورگر کاربر انجام می‌شود",
    privacyBadge: "۰ بایت ارسال شبکه",
    privacyStatement:
      "دالان هیچ داده، سند، متاداده، یا کوکی‌ای را به هیچ سروری ارسال نمی‌کند. تمام عملیات با استفاده از WebAssembly و داخل محیط ایزوله Web Worker اجرا می‌شود.",
    privacyArchHeading: "معماری پردازش امن محلی",
    privacyArchItems: [
      {
        title: "اجرای ایزوله در Web Workers",
        desc: "پارس PDF با pdf.js و موتور OCR تسراکت درون وب‌ورکرهای پس‌زمینه مرورگر اجرا می‌شوند و به شبکه خارجی دسترسی ندارند.",
      },
      {
        title: "ساخت محلی بسته EPUB 3",
        desc: "فایل نهایی EPUB و جاسازی قلم وزیرمتن توسط کتابخانه JSZip مستقیماً در حافظه رم دستگاه کاربر فشرده و تولید می‌شود.",
      },
      {
        title: "عملکرد کامل آفلاین با PWA",
        desc: "پس از بارگذاری اولیه صفحه، کل سامانه بدون نیاز به اتصال اینترنت و در حالت کاملاً آفلاین کار می‌کند.",
      },
    ],
    privacyVerifyHeading: "نحوه راستی‌آزمایی در DevTools مرورگر",
    privacyVerifySteps: [
      "کلید F12 را بزنید تا ابزارهای توسعه مرورگر (DevTools) باز شود.",
      "به زبانه Network بروید و گزینه All را انتخاب کنید.",
      "یک فایل PDF را برای تبدیل انتخاب کرده و دکمه شروع تبدیل را بزنید.",
      "بررسی کنید: در طول تمام فرایند تبدیل، حتی یک درخواست HTTP یا WebSocket ارسال نمی‌شود (0 requests).",
    ],

    // Features Grid
    featuresTitle: "قابلیت‌های کلیدی دالان",
    featuresSubtitle: "ابزار متن‌باز تبدیل کتاب با تمرکز بر خط فارسی و دستگاه‌های کتاب‌خوان کیندل",
    featureCards: [
      {
        id: "kindle-reflow",
        title: "بازچینش متن کیندل با فونت وزیرمتن",
        desc: "تولید فایل سازگار با موتور EPUB 3 کیندل با جاسازی کامل فونت فارسی Vazirmatn، جهت‌بندی صحیح خطوط و شکست خط استاندارد.",
        badge: "EPUB 3",
        icon: "file",
      },
      {
        id: "orthography",
        title: "یکپارچه‌سازی نیم‌فاصله و نویسه‌های فارسی",
        desc: "پالایش نویسه‌ها، تبدیل ارقام و ی/ک عربی، و تصحیح نیم‌فاصله‌های ZWNJ مطابق استانداردهای دبیره پاک‌نویس و دوات.",
        badge: "ZWNJ",
        icon: "sparkle",
      },
      {
        id: "ocr-wasm",
        title: "موتور OCR کلاینت‌ساید با Tesseract WASM",
        desc: "تشخیص نویسه‌های اسناد اسکن‌شده به زبان‌های فارسی، عربی و انگلیسی به کمک وب‌اسمبلی و بدون نیاز به سرور ابری.",
        badge: "WASM",
        icon: "search",
      },
      {
        id: "zero-leak",
        title: "امنیت ۱۰۰٪ و بدون کوکی یا تله‌متری",
        desc: "فاقد ابزارهای ردیابی، آنالیتیکس یا کوکی شخص ثالث. پرونده‌ها فقط در حافظه محلی دستگاه شما وجود دارند.",
        badge: "Zero-Data",
        icon: "check",
      },
    ],

    // Engine & Cache
    engineTitle: "مدیریت نسخه موتور و پاکسازی حافظه موقت",
    engineSubtitle: "اطلاعات موتور فعال و امکان بازنشانی مدل‌های ذخیره‌شده و کش سرویس‌ورکر",
    activeAppVersion: "نسخه برنامه",
    activeWasmVersion: "نسخه موتور پردازش",
    cacheStatusLabel: "وضعیت کش مرورگر",
    cacheStatusReady: "آماده و پایدار",
    purgeBtn: "پاکسازی کش و بارگیری مجدد موتور",
    purgingText: "در حال پاکسازی کش و مدل‌ها...",
    purgeSuccessTitle: "حافظه موقت و مدل‌های موتور پاکسازی شدند",
    purgeSuccessDesc: "کش سرویس‌ورکر و پایگاه‌های داده محلی با موفقیت حذف شدند. برای بارگذاری نسخه تازه دکمه زیر را بزنید.",
    reloadBtn: "بارگذاری مجدد صفحه",
    updateAvailableTitle: "نسخه جدید موتور در دسترس است",
    updateAvailableDesc: "نسخه تازه برنامه در پس‌زمینه بارگیری شده و آماده فعال‌سازی است.",
    updateNowBtn: "به‌روزرسانی و بارگذاری مجدد",

    // Footer
    footerLicense: "منتشرشده تحت مجوز آپاچی ۲.۰ (Apache-2.0)",
    footerDeveloper: "توسعه‌داده‌شده توسط",
    footerDesignCredit: "پیاده‌سازی‌شده با مؤلفه‌های سیستم طراحی هشتی (Hashti Design System)",
    footerOpenSourceNote: "پروژه متن‌باز و غیروابسته برای جامعه کتاب‌خوان و محققان خط فارسی.",
  },
  en: {
    appTitle: "Dalan • دالان",
    badgeSpatial: "Open Source • Zero-Server",
    heroTitle: "Local PDF to Kindle Reflow Converter",
    heroSubtitle:
      "Convert PDF documents to standard EPUB 3 directly in your browser without transmitting any bytes over the network. Includes embedded Vazirmatn typography and readable bidirectional layout.",
    themeDark: "Dark Mode",
    themeLight: "Light Mode",
    navPrivacy: "Privacy Guarantee",
    navFeatures: "Features",
    navEngine: "Engine & Cache",
    navGithub: "GitHub Repo",
    navIssues: "Issue Tracker",
    dropPrompt: "Drag and drop your PDF here, or click to browse",
    dropPromptActive: "Drop your PDF document here...",
    dropHint: "Full browser-side processing via WebAssembly with zero network data transfer",
    browseBtn: "Browse PDF",
    selectedFile: "Selected Document",
    removeFile: "Change Document",
    metaHeading: "Document Metadata & Settings",
    metaDesc: "Verify book details and select text extraction mode",
    bookTitleLabel: "Book Title",
    bookTitlePlaceholder: "e.g., Persian History or Modern Poetry",
    authorLabel: "Author / Translator",
    authorPlaceholder: "e.g., Abolfazl Beyhaqi",
    modeLabel: "Extraction Pipeline",
    modeAuto: "Auto-detect (Direct digital text or visual OCR)",
    modeOcr: "Full Visual OCR (Recommended for scanned books)",
    langLabel: "Document Language",
    langFaAr: "Persian & Arabic (fas + ara)",
    langFaOnly: "Persian Only (fas)",
    langEnOnly: "English (eng)",
    startBtn: "Start EPUB Conversion",
    processingTitle: "Processing Document Locally",
    processingBadge: "Web Worker Pipeline",
    previewAlt: "Live page render thumbnail",
    pageTelemetry: (c, t) => `Page ${c} of ${t}`,
    progressLabel: "Conversion Progress",
    successTitle: "Conversion Completed Successfully",
    successDesc:
      "Your book has been compiled into EPUB 3 with embedded Vazirmatn font, valid OPF manifest, and Kindle-compatible reflow structure.",
    downloadBtn: "Download EPUB File",
    convertAnotherBtn: "Convert Another Document",
    kindleGuideTitle: "Transfer to Kindle Device",
    kindleGuideDesc:
      "Upload the downloaded file directly to Amazon or send it to your Kindle email address:",
    kindleLinkText: "Amazon Send to Kindle Portal",
    metaSummaryLabel: "Output Summary:",
    metaPages: (c) => `${c} processed pages`,
    metaModeUsed: "100% In-Browser WebAssembly",
    errorTitle: "An error occurred during conversion",
    retryBtn: "Reset & Try Again",

    // Privacy Section
    privacyTitle: "Client-Side Privacy Guarantee & Technical Verification",
    privacySubtitle: "All text extraction, image rendering, and EPUB packaging occur entirely on your local machine",
    privacyBadge: "0 Bytes Sent Over Network",
    privacyStatement:
      "Dalan never sends documents, metadata, extracted text, or cookies to any external server. Execution stays strictly inside client-side WebAssembly containers and sandboxed Web Workers.",
    privacyArchHeading: "Technical Sandboxing Architecture",
    privacyArchItems: [
      {
        title: "Sandboxed Web Workers",
        desc: "pdf.js and Tesseract WASM OCR run inside isolated browser worker threads with no network egress during conversion.",
      },
      {
        title: "In-Memory EPUB Packaging",
        desc: "The final EPUB 3 zip archive and embedded Vazirmatn font assets are compiled entirely in client memory via JSZip.",
      },
      {
        title: "100% Offline-First PWA",
        desc: "Once assets are loaded, the entire conversion pipeline operates with zero internet connectivity.",
      },
    ],
    privacyVerifyHeading: "Verify in Browser DevTools",
    privacyVerifySteps: [
      "Open your browser developer tools (press F12 or right-click and choose Inspect).",
      "Switch to the Network tab and ensure the filter is set to All.",
      "Select a PDF file and press the Start EPUB Conversion button.",
      "Confirm that zero outgoing HTTP requests, web sockets, or beacons are dispatched during processing.",
    ],

    // Features Grid
    featuresTitle: "Core Open Source Features",
    featuresSubtitle: "Purpose-built tooling for Persian typography, Kindle reflow, and offline reliability",
    featureCards: [
      {
        id: "kindle-reflow",
        title: "Kindle EPUB 3 Reflow & Vazirmatn Font",
        desc: "Packages compliant EPUB 3 markup with embedded Vazirmatn font, RTL/LTR page progression, and smooth reflow on e-ink Kindle devices.",
        badge: "EPUB 3",
        icon: "file",
      },
      {
        id: "orthography",
        title: "Davat & Paknevis ZWNJ Normalization",
        desc: "Standardizes Persian characters, normalizes Arabic Yeh/Kaf to Persian equivalents, and preserves precise zero-width non-joiners (ZWNJ).",
        badge: "ZWNJ",
        icon: "sparkle",
      },
      {
        id: "ocr-wasm",
        title: "Client-Side Tesseract OCR via WASM",
        desc: "Extracts text from scanned pages directly on your machine using Tesseract WebAssembly, without third-party vision APIs.",
        badge: "WASM",
        icon: "search",
      },
      {
        id: "zero-leak",
        title: "100% Client-Side Privacy & Zero Telemetry",
        desc: "Zero tracking scripts, zero advertising beacons, zero third-party cookies, and zero server-side storage.",
        badge: "Zero-Data",
        icon: "check",
      },
    ],

    // Engine & Cache
    engineTitle: "Engine Versioning & Cache Management",
    engineSubtitle: "Review active WebAssembly runtime versions or clear cached offline models",
    activeAppVersion: "App Version",
    activeWasmVersion: "Engine Runtime",
    cacheStatusLabel: "Cache Health",
    cacheStatusReady: "Ready & Active",
    purgeBtn: "Purge & Re-fetch Engine Cache",
    purgingText: "Purging caches and IndexedDB...",
    purgeSuccessTitle: "Engine cache successfully purged",
    purgeSuccessDesc: "All Service Worker caches and local database entries were cleared. Reload to fetch fresh runtime artifacts.",
    reloadBtn: "Reload Page",
    updateAvailableTitle: "New engine release detected",
    updateAvailableDesc: "An updated Service Worker and engine package have been downloaded in the background.",
    updateNowBtn: "Update & Reload",

    // Footer
    footerLicense: "Released under the Apache-2.0 License",
    footerDeveloper: "Developed by",
    footerDesignCredit: "Built with the Hashti Design System component library",
    footerOpenSourceNote: "An open-source, non-commercial project for researchers and Persian e-book readers.",
  },
};

export function DalanConverter() {
  const [locale, setLocale] = useState<Locale>("fa");
  const [themeMode, setThemeMode] = useState<ThemeMode>("relay-dark");

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [lang, setLang] = useState("fas+ara");
  const [mode, setMode] = useState<"auto" | "ocr">("auto");

  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [progressMsg, setProgressMsg] = useState("");
  const [percent, setPercent] = useState(0);
  const [currentPage, setCurrentPage] = useState<number | null>(null);
  const [totalPages, setTotalPages] = useState<number | null>(null);
  const [activeThumbnail, setActiveThumbnail] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [outputFilename, setOutputFilename] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Engine cache & update notifications
  const [isPurging, setIsPurging] = useState(false);
  const [cacheNotification, setCacheNotification] = useState<"idle" | "purged" | "update-ready">("idle");

  const workerRef = useRef<Worker | null>(null);

  const t = strings[locale];
  const direction = locale === "fa" ? "rtl" : "ltr";

  // Sync document root attributes on locale & theme change
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
      document.documentElement.dir = direction;
      document.documentElement.setAttribute("data-hashti-theme", themeMode);
    }
  }, [locale, direction, themeMode]);

  // Listen for Service Worker update availability
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (!reg) return;
        reg.addEventListener("updatefound", () => {
          const installingWorker = reg.installing;
          if (installingWorker) {
            installingWorker.addEventListener("statechange", () => {
              if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
                setCacheNotification("update-ready");
              }
            });
          }
        });
      });
    }
  }, []);

  const handlePurgeCache = async () => {
    setIsPurging(true);
    try {
      // 1. Delete all CacheStorage entries
      if ("caches" in window) {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map((key) => caches.delete(key)));
      }

      // 2. Unregister Service Workers
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((r) => r.unregister()));
      }

      // 3. Clear IndexedDB databases if accessible
      if ("indexedDB" in window && indexedDB.databases) {
        try {
          const dbs = await indexedDB.databases();
          dbs.forEach((db) => {
            if (db.name) indexedDB.deleteDatabase(db.name);
          });
        } catch {
          // ignore IndexedDB enumeration restrictions
        }
      }

      setCacheNotification("purged");
    } catch (err) {
      console.error("Purge cache error:", err);
    } finally {
      setIsPurging(false);
    }
  };

  const handleFiles = (incomingFiles: File[]) => {
    if (incomingFiles.length > 0) {
      const selected = incomingFiles[0];
      setFile(selected);
      setTitle(selected.name.replace(/\.[^/.]+$/, ""));
      setStatus("idle");
      setDownloadUrl(null);
      setErrorMsg("");
      setCurrentPage(null);
      setTotalPages(null);
    }
  };

  const startConversion = async () => {
    if (!file) return;

    setStatus("processing");
    setPercent(0);
    setProgressMsg(locale === "fa" ? "آماده‌سازی پردازش سند..." : "Initializing document pipeline...");
    setCurrentPage(null);
    setTotalPages(null);

    try {
      const buffer = await file.arrayBuffer();
      const worker = new Worker(new URL("../workers/convert.worker.ts", import.meta.url), {
        type: "module",
      });
      workerRef.current = worker;

      worker.onmessage = (e) => {
        const data = e.data;
        if (data.type === "progress") {
          setPercent(data.percent || 0);
          setProgressMsg(data.message || "");
          if (typeof data.currentPage === "number") setCurrentPage(data.currentPage);
          if (typeof data.totalPages === "number") setTotalPages(data.totalPages);
        } else if (data.type === "thumbnail") {
          setActiveThumbnail(data.dataUrl);
        } else if (data.type === "complete") {
          const url = URL.createObjectURL(data.epubBlob);
          setDownloadUrl(url);
          setOutputFilename(data.filename);
          setStatus("success");
          setPercent(100);
          worker.terminate();
        } else if (data.type === "error") {
          setErrorMsg(data.error || (locale === "fa" ? "خطای ناشناخته رخ داد" : "Unknown error occurred"));
          setStatus("error");
          worker.terminate();
        }
      };

      worker.onerror = (err) => {
        setErrorMsg(err.message || (locale === "fa" ? "خطا در وب‌ورکر" : "WebWorker error"));
        setStatus("error");
        worker.terminate();
      };

      worker.postMessage({
        fileBuffer: buffer,
        options: {
          lang,
          mode,
          title: title || file.name,
          author: author || (locale === "fa" ? "نامشخص" : "Unknown"),
        },
      });
    } catch (err: any) {
      setErrorMsg(err?.message || (locale === "fa" ? "خطا در شروع تبدیل" : "Failed to start conversion"));
      setStatus("error");
    }
  };

  const handleReset = () => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    setFile(null);
    setTitle("");
    setAuthor("");
    setStatus("idle");
    setPercent(0);
    setProgressMsg("");
    setActiveThumbnail(null);
    setDownloadUrl(null);
    setOutputFilename("");
    setErrorMsg("");
    setCurrentPage(null);
    setTotalPages(null);
  };

  return (
    <Theme theme={themeMode} locale={locale} direction={direction}>
      <div className="dalan-app">
        <div className="dalan-container">
          {/* 1. Header Navigation Bar */}
          <header className="dalan-topbar" role="banner">
            <div className="dalan-brand">
              <a href="#" className="dalan-brand-link">
                <span className="dalan-brand-title">{t.appTitle}</span>
              </a>
              <Badge kind="primary">{APP_VERSION}</Badge>
              <Badge kind="neutral">{WASM_CORE_VERSION}</Badge>
            </div>

            <nav className="dalan-nav-links" aria-label="Main Navigation">
              <a href="#privacy-section" className="dalan-nav-anchor">
                {t.navPrivacy}
              </a>
              <a href="#features-section" className="dalan-nav-anchor">
                {t.navFeatures}
              </a>
              <a href="#engine-section" className="dalan-nav-anchor">
                {t.navEngine}
              </a>
              <a
                href="https://github.com/raminrez/dalan"
                target="_blank"
                rel="noopener noreferrer"
                className="dalan-nav-anchor dalan-nav-ext"
              >
                <Icon name="code" size={14} aria-hidden="true" />
                {t.navGithub}
              </a>
            </nav>

            <div className="dalan-controls">
              {/* Language Switcher */}
              <div
                className="dalan-lang-switch"
                role="group"
                aria-label={locale === "fa" ? "انتخاب زبان" : "Language Selection"}
              >
                <button
                  type="button"
                  className="dalan-lang-btn"
                  aria-pressed={locale === "fa"}
                  onClick={() => setLocale("fa")}
                >
                  فارسی
                </button>
                <button
                  type="button"
                  className="dalan-lang-btn"
                  aria-pressed={locale === "en"}
                  onClick={() => setLocale("en")}
                >
                  English
                </button>
              </div>

              {/* Theme Toggle Switch */}
              <div className="dalan-theme-toggle">
                <Icon name={themeMode === "relay-dark" ? "moon" : "sun"} size={16} aria-hidden="true" />
                <Switch
                  isSelected={themeMode === "relay-dark"}
                  onChange={(isSelected) => setThemeMode(isSelected ? "relay-dark" : "relay-light")}
                  aria-label={themeMode === "relay-dark" ? t.themeDark : t.themeLight}
                  size="sm"
                >
                  {themeMode === "relay-dark" ? t.themeDark : t.themeLight}
                </Switch>
              </div>
            </div>
          </header>

          {/* Actionable Notification: Cache Purged or Update Ready */}
          {cacheNotification === "purged" && (
            <ActionableNotification
              kind="success"
              title={t.purgeSuccessTitle}
              onDismiss={() => setCacheNotification("idle")}
              action={
                <Button variant="primary" size="sm" onPress={() => window.location.reload()}>
                  <Icon name="undo" size={14} aria-hidden="true" />
                  {t.reloadBtn}
                </Button>
              }
            >
              {t.purgeSuccessDesc}
            </ActionableNotification>
          )}

          {cacheNotification === "update-ready" && (
            <ActionableNotification
              kind="info"
              title={t.updateAvailableTitle}
              onDismiss={() => setCacheNotification("idle")}
              action={
                <Button variant="primary" size="sm" onPress={() => window.location.reload()}>
                  <Icon name="undo" size={14} aria-hidden="true" />
                  {t.updateNowBtn}
                </Button>
              }
            >
              {t.updateAvailableDesc}
            </ActionableNotification>
          )}

          {/* 2. Hero Section */}
          <section className="dalan-hero" aria-labelledby="hero-title">
            <div className="dalan-hero-badge">
              <Badge kind="secondary">{t.badgeSpatial}</Badge>
              <Badge kind="success">{locale === "fa" ? "پردازش در مرورگر" : "Local WASM"}</Badge>
            </div>
            <h2 id="hero-title" className="dalan-hero-title">
              {t.heroTitle}
            </h2>
            <p className="dalan-hero-subtitle">{t.heroSubtitle}</p>
          </section>

          {/* 3. Main Conversion Stage */}
          <main id="main-conversion-area" aria-live="polite">
            {/* IDLE STATE: Upload & Settings */}
            {status === "idle" && (
              <Card elevation="raised">
                <CardHeader title={t.dropPrompt} description={t.dropHint} />
                <CardBody>
                  <DropZone
                    variant="dashed"
                    className="hashti-dropzone-custom"
                    aria-label={t.dropPrompt}
                    onDropFiles={(files) => handleFiles(files)}
                  >
                    {({ isDropTarget }) => (
                      <div className="dropzone-prompt">
                        <Icon name="upload" size={32} aria-hidden="true" />
                        <span className="dropzone-title">
                          {isDropTarget ? t.dropPromptActive : t.dropPrompt}
                        </span>
                        <span className="dropzone-hint">{t.dropHint}</span>

                        <FileTrigger
                          acceptedFileTypes={["application/pdf", ".pdf"]}
                          allowsMultiple={false}
                          onSelect={(filesList) => {
                            if (filesList) handleFiles(Array.from(filesList));
                          }}
                        >
                          <Button variant="secondary" size="md">
                            <Icon name="file" size={16} aria-hidden="true" />
                            {t.browseBtn}
                          </Button>
                        </FileTrigger>
                      </div>
                    )}
                  </DropZone>

                  {/* Document Options when file is selected */}
                  {file && (
                    <div className="dalan-options-section" style={{ marginTop: "1.5rem" }}>
                      <div className="file-selected-badge" style={{ marginBottom: "1rem" }}>
                        <Badge kind="success">{t.selectedFile}</Badge>
                        <span>
                          {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onPress={() => setFile(null)}
                          aria-label={t.removeFile}
                        >
                          <Icon name="close" size={16} aria-hidden="true" />
                          {t.removeFile}
                        </Button>
                      </div>

                      <div className="dalan-options-grid">
                        <TextField
                          label={t.bookTitleLabel}
                          value={title}
                          onChange={(val) => setTitle(val)}
                          placeholder={t.bookTitlePlaceholder}
                        />

                        <TextField
                          label={t.authorLabel}
                          value={author}
                          onChange={(val) => setAuthor(val)}
                          placeholder={t.authorPlaceholder}
                        />

                        <NativeSelect
                          label={t.modeLabel}
                          value={mode}
                          onChange={(e) => setMode(e.target.value as "auto" | "ocr")}
                        >
                          <option value="auto">{t.modeAuto}</option>
                          <option value="ocr">{t.modeOcr}</option>
                        </NativeSelect>

                        <NativeSelect
                          label={t.langLabel}
                          value={lang}
                          onChange={(e) => setLang(e.target.value)}
                        >
                          <option value="fas+ara">{t.langFaAr}</option>
                          <option value="fas">{t.langFaOnly}</option>
                          <option value="eng">{t.langEnOnly}</option>
                        </NativeSelect>
                      </div>

                      <div className="dalan-card-actions">
                        <Button variant="primary" size="lg" onPress={startConversion}>
                          <Icon name="sparkle" size={16} aria-hidden="true" />
                          {t.startBtn}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>
            )}

            {/* PROCESSING STATE: WebWorker Pipeline */}
            {status === "processing" && (
              <Card elevation="raised">
                <CardHeader
                  title={t.processingTitle}
                  action={<Badge kind="warning">{t.processingBadge}</Badge>}
                />
                <CardBody>
                  <div className="chamber-processing-content">
                    <p className="chamber-telemetry">{progressMsg}</p>

                    {currentPage !== null && totalPages !== null && (
                      <div className="chamber-status-row">
                        <Badge kind="info">{t.pageTelemetry(currentPage, totalPages)}</Badge>
                      </div>
                    )}

                    {activeThumbnail && (
                      <div className="chamber-thumbnail-preview">
                        <img
                          src={activeThumbnail}
                          alt={t.previewAlt}
                          width={140}
                          height={190}
                          className="chamber-thumbnail-img"
                        />
                      </div>
                    )}

                    <div className="chamber-progress-container">
                      <ProgressBar
                        value={percent}
                        label={t.progressLabel}
                        helperText={`${percent}%`}
                        status="active"
                      />
                    </div>
                  </div>
                </CardBody>
              </Card>
            )}

            {/* SUCCESS STATE */}
            {status === "success" && (
              <Card elevation="raised">
                <CardHeader
                  title={t.successTitle}
                  action={<Badge kind="success">{locale === "fa" ? "آماده تحویل" : "Ready"}</Badge>}
                />
                <CardBody>
                  <div className="hayati-sanctuary-content">
                    <Icon
                      name="check"
                      size={48}
                      aria-hidden="true"
                      style={{ color: "var(--hashti-support-success, #198038)" }}
                    />
                    <p className="dalan-hero-subtitle">{t.successDesc}</p>

                    <div className="hayati-meta-summary">
                      <Badge kind="neutral">{title || outputFilename}</Badge>
                      <Badge kind="info">{t.metaModeUsed}</Badge>
                      {totalPages && <Badge kind="secondary">{t.metaPages(totalPages)}</Badge>}
                    </div>

                    <div className="dalan-card-actions" style={{ justifyContent: "center" }}>
                      <a
                        href={downloadUrl!}
                        download={outputFilename}
                        style={{ textDecoration: "none" }}
                      >
                        <Button variant="primary" size="lg">
                          <Icon name="download" size={16} aria-hidden="true" />
                          {t.downloadBtn} ({outputFilename})
                        </Button>
                      </a>

                      <Button variant="secondary" size="lg" onPress={handleReset}>
                        <Icon name="undo" size={16} aria-hidden="true" />
                        {t.convertAnotherBtn}
                      </Button>
                    </div>

                    {/* Kindle Instruction Card */}
                    <div className="hayati-instruction-card">
                      <Card elevation="flat">
                        <CardBody>
                          <div className="hayati-instruction-body">
                            <Icon
                              name="info"
                              size={20}
                              aria-hidden="true"
                              style={{ flexShrink: 0, marginTop: "2px" }}
                            />
                            <div>
                              <strong>{t.kindleGuideTitle}</strong>
                              <p style={{ margin: "4px 0 0" }}>
                                {t.kindleGuideDesc}{" "}
                                <a
                                  href="https://www.amazon.com/sendtokindle"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {t.kindleLinkText}
                                </a>
                              </p>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    </div>
                  </div>
                </CardBody>
              </Card>
            )}

            {/* ERROR STATE */}
            {status === "error" && (
              <Card elevation="raised">
                <CardHeader
                  title={t.errorTitle}
                  action={<Badge kind="danger">{locale === "fa" ? "خطا" : "Error"}</Badge>}
                />
                <CardBody>
                  <div className="chamber-error-content">
                    <Icon
                      name="error"
                      size={40}
                      aria-hidden="true"
                      style={{ color: "var(--hashti-support-error, #da1e28)" }}
                    />
                    <p style={{ color: "var(--hashti-text-error, #fa4d56)" }}>{errorMsg}</p>
                    <Button variant="secondary" size="md" onPress={handleReset}>
                      <Icon name="undo" size={16} aria-hidden="true" />
                      {t.retryBtn}
                    </Button>
                  </div>
                </CardBody>
              </Card>
            )}
          </main>

          {/* 4. Client-Side Privacy Guarantee Section */}
          <section id="privacy-section" className="dalan-section" aria-labelledby="privacy-heading">
            <div className="dalan-section-header">
              <div className="dalan-section-badge">
                <Badge kind="success">{t.privacyBadge}</Badge>
              </div>
              <h3 id="privacy-heading" className="dalan-section-title">
                {t.privacyTitle}
              </h3>
              <p className="dalan-section-subtitle">{t.privacySubtitle}</p>
            </div>

            <Card elevation="flat" className="dalan-privacy-card">
              <CardBody>
                <div className="dalan-privacy-lead">
                  <Icon
                    name="check"
                    size={28}
                    aria-hidden="true"
                    style={{ color: "var(--hashti-support-success, #198038)", flexShrink: 0 }}
                  />
                  <p className="dalan-privacy-lead-text">{t.privacyStatement}</p>
                </div>

                <div className="dalan-arch-grid">
                  {t.privacyArchItems.map((item, idx) => (
                    <div key={idx} className="dalan-arch-item">
                      <div className="dalan-arch-item-header">
                        <Badge kind="neutral">0{idx + 1}</Badge>
                        <h4 className="dalan-arch-item-title">{item.title}</h4>
                      </div>
                      <p className="dalan-arch-item-desc">{item.desc}</p>
                    </div>
                  ))}
                </div>

                {/* DevTools Verification Walkthrough */}
                <div className="dalan-verify-box">
                  <div className="dalan-verify-header">
                    <Icon name="code" size={18} aria-hidden="true" />
                    <strong>{t.privacyVerifyHeading}</strong>
                  </div>
                  <ol className="dalan-verify-steps">
                    {t.privacyVerifySteps.map((step, idx) => (
                      <li key={idx} className="dalan-verify-step">
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              </CardBody>
            </Card>
          </section>

          {/* 5. Core Open Source Features Grid */}
          <section id="features-section" className="dalan-section" aria-labelledby="features-heading">
            <div className="dalan-section-header">
              <h3 id="features-heading" className="dalan-section-title">
                {t.featuresTitle}
              </h3>
              <p className="dalan-section-subtitle">{t.featuresSubtitle}</p>
            </div>

            <div className="dalan-features-grid">
              {t.featureCards.map((card) => (
                <div key={card.id} className="dalan-feature-card-wrapper">
                  <Card elevation="flat">
                    <CardHeader
                      title={card.title}
                      action={<Badge kind="neutral">{card.badge}</Badge>}
                    />
                    <CardBody>
                      <p className="dalan-feature-desc">{card.desc}</p>
                    </CardBody>
                  </Card>
                </div>
              ))}
            </div>
          </section>

          {/* 6. Engine Versioning & Cache Purge Section */}
          <section id="engine-section" className="dalan-section" aria-labelledby="engine-heading">
            <div className="dalan-section-header">
              <h3 id="engine-heading" className="dalan-section-title">
                {t.engineTitle}
              </h3>
              <p className="dalan-section-subtitle">{t.engineSubtitle}</p>
            </div>

            <Card elevation="flat">
              <CardBody>
                <div className="dalan-engine-panel">
                  <div className="dalan-engine-meta">
                    <div className="dalan-engine-stat">
                      <span className="dalan-stat-label">{t.activeAppVersion}</span>
                      <span className="dalan-stat-value">{APP_VERSION}</span>
                    </div>
                    <div className="dalan-engine-stat">
                      <span className="dalan-stat-label">{t.activeWasmVersion}</span>
                      <span className="dalan-stat-value">{WASM_CORE_VERSION}</span>
                    </div>
                    <div className="dalan-engine-stat">
                      <span className="dalan-stat-label">{t.cacheStatusLabel}</span>
                      <Badge kind="success">{t.cacheStatusReady}</Badge>
                    </div>
                  </div>

                  <div className="dalan-engine-actions">
                    <Button
                      variant="secondary"
                      size="md"
                      onPress={handlePurgeCache}
                      isDisabled={isPurging}
                    >
                      <Icon name="undo" size={16} aria-hidden="true" />
                      {isPurging ? t.purgingText : t.purgeBtn}
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          </section>

          {/* 7. Comprehensive Open Source Footer */}
          <footer className="dalan-footer" role="contentinfo">
            <div className="dalan-footer-top">
              <div className="dalan-footer-brand">
                <strong>{t.appTitle}</strong>
                <Badge kind="primary">{APP_VERSION}</Badge>
                <Badge kind="neutral">{WASM_CORE_VERSION}</Badge>
              </div>

              <div className="dalan-footer-links">
                <a
                  href="https://github.com/raminrez/dalan"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="dalan-footer-link"
                >
                  <Icon name="code" size={14} aria-hidden="true" />
                  {t.navGithub}
                </a>
                <a
                  href="https://github.com/raminrez/dalan/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="dalan-footer-link"
                >
                  <Icon name="info" size={14} aria-hidden="true" />
                  {t.navIssues}
                </a>
                <a href="#privacy-section" className="dalan-footer-link">
                  {t.navPrivacy}
                </a>
              </div>
            </div>

            <div className="dalan-footer-bottom">
              <p className="dalan-footer-text">{t.footerLicense}</p>
              <p className="dalan-footer-text">
                {t.footerDeveloper}{" "}
                <a
                  href="https://raminrez.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="dalan-dev-link"
                >
                  raminrez.dev
                </a>
              </p>
              <p className="dalan-footer-text">{t.footerDesignCredit}</p>
              <p className="dalan-footer-note">{t.footerOpenSourceNote}</p>
            </div>
          </footer>
        </div>
      </div>
    </Theme>
  );
}
