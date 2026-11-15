import React, { useState, useRef, useEffect } from "react";
import {
  Theme,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Button,
  Badge,
  Switch,
  DropZone,
  FileTrigger,
  ProgressBar,
  TextField,
  NativeSelect,
  Icon,
} from "@hashti/react";

type Locale = "fa" | "en";
type ThemeMode = "relay-dark" | "relay-light";

interface Translations {
  appTitle: string;
  badgeSpatial: string;
  heroTitle: string;
  heroSubtitle: string;
  themeDark: string;
  themeLight: string;
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
  archHeading: string;
  archSubheading: string;
  darvazehCardTitle: string;
  darvazehCardDesc: string;
  hashtiCardTitle: string;
  hashtiCardDesc: string;
  dalanCardTitle: string;
  dalanCardDesc: string;
  hayatiCardTitle: string;
  hayatiCardDesc: string;
  footerText: string;
}

const strings: Record<Locale, Translations> = {
  fa: {
    appTitle: "دالان • Dalan",
    badgeSpatial: "هندسه فضایی هشتی • نسخه کلاینت‌ساید",
    heroTitle: "گذرگاه امن تبدیل PDF به کتاب‌خوان کیندل",
    heroSubtitle:
      "تبدیل مستقیم اسناد و کتاب‌های پی‌دی‌اف به قالب استاندارد EPUB 3 بدون ارسال هیچ بایتی به سرور؛ همراه با فونت درون‌ساخت وزیرمتن و چیدمان کاملاً راست‌چین و خوانا.",
    themeDark: "حالت تاریک",
    themeLight: "حالت روشن",
    dropPrompt: "فایل PDF را به این بخش بکشید یا برای انتخاب کلیک کنید",
    dropPromptActive: "سند PDF خود را رها کنید...",
    dropHint: "حداکثر امنیت و حریم خصوصی؛ پردازش کامل توسط WebAssembly در مرورگر شما",
    browseBtn: "انتخاب فایل PDF",
    selectedFile: "سند انتخاب‌شده",
    removeFile: "تغییر فایل",
    metaHeading: "تنظیمات و متاداده سند",
    metaDesc: "اطلاعات کتاب و حالت پردازش متن را بررسی کنید",
    bookTitleLabel: "عنوان کتاب",
    bookTitlePlaceholder: "مثلاً: دیوان حافظ یا تاریخ ایران",
    authorLabel: "نویسنده یا مترجم",
    authorPlaceholder: "مثلاً: احمد کسروی",
    modeLabel: "روش استخراج متن",
    modeAuto: "تشخیص هوشمند (متن دیجیتال یا تصویر)",
    modeOcr: "پردازش کامل تصویری (OCR - مناسب اسکن‌ها)",
    langLabel: "زبان محتوا",
    langFaAr: "فارسی و عربی (fas + ara)",
    langFaOnly: "فارسی خالص (fas)",
    langEnOnly: "انگلیسی (eng)",
    startBtn: "شروع تبدیل به EPUB",
    processingTitle: "در حال پردازش سند در تالار هشتی",
    processingBadge: "پردازش در جریان",
    previewAlt: "پیش‌نمایش زنده صفحه پردازش‌شده",
    pageTelemetry: (c, t) => `صفحه ${c} از ${t}`,
    progressLabel: "پیشرفت پردازش",
    successTitle: "سند با موفقیت به حیاط خلوت (حیاتی) رسید!",
    successDesc:
      "کتاب شما با استانداردهای EPUB 3، قلم بهینه‌شده وزیرمتن، چیدمان بهینه دوطرفه و فهرست مطالب بازسازی شد.",
    downloadBtn: "دانلود کتاب الکترونیکی EPUB",
    convertAnotherBtn: "تبدیل سندی دیگر",
    kindleGuideTitle: "راهنمای همگام‌سازی با کیندل (Kindle)",
    kindleGuideDesc:
      "فایل دانلود شده را در سرویس رسمی آمازون آپلود کرده یا به نشانی ایمیل کیندل خود بفرستید:",
    kindleLinkText: "سرویس Amazon Send to Kindle",
    metaSummaryLabel: "خلاصه مشخصات فایل تولیدی:",
    metaPages: (c) => `${c} صفحه پردازش‌شده`,
    metaModeUsed: "پردازش امن کلاینت‌ساید",
    errorTitle: "خطایی در حین پردازش رخ داد",
    retryBtn: "بازگشت و تلاش دوباره",
    archHeading: "معماری فضایی دالان و ۴ آستانه گذار",
    archSubheading: "بازآفرینی مفاهیم کهن معماری ایرانی در ساختار امن پردازش دیجیتال",
    darvazehCardTitle: "۱. دروازه (Darvazeh)",
    darvazehCardDesc:
      "آستانه ورود سند به مرورگر؛ رمزنگاری درجا و تضمین عدم خروج حتی یک بایت داده به سرور خارجی.",
    hashtiCardTitle: "۲. هشتی (Hashti)",
    hashtiCardDesc:
      "مفصل تقسیم و تصمیم‌گیری هوشمند برای تفکیک جریان‌های OCR از جریان‌های متن مستقیم و فیلتر صفحات.",
    dalanCardTitle: "۳. دالان (Dalan)",
    dalanCardDesc:
      "دالان باریک و صبور گذر؛ خط لوله وب‌ورکرها، رندرهای تصویری بوم و استخراج ساختار کلمات با موتور WASM.",
    hayatiCardTitle: "۴. حیاتی (Hayati)",
    hayatiCardDesc:
      "حیاط باطراوت آرامش نهایی؛ تولید پکیج فشرده EPUB 3 همراه با فونت زیبای وزیرمتن و تحویل بی‌واسطه به کاربر.",
    footerText:
      "دالان (Dalan) • پیاده‌سازی مبتنی بر مؤلفه‌های اصیل Hashti Design System و پردازشگر اختصاصی PDF2EPUB.",
  },
  en: {
    appTitle: "Dalan • دالان",
    badgeSpatial: "Hashti Spatial Geometry • Zero-Server Client",
    heroTitle: "Secure PDF to Kindle Reflow Converter",
    heroSubtitle:
      "Convert documents and books directly to EPUB 3 in your browser without transmitting any bytes to external servers. Bundled with embedded Vazirmatn typography and pristine RTL/LTR bidirectional support.",
    themeDark: "Dark Mode",
    themeLight: "Light Mode",
    dropPrompt: "Drag & drop your PDF file here, or click to browse",
    dropPromptActive: "Drop your PDF document here...",
    dropHint: "Absolute client-side privacy; runs 100% in-browser using WebAssembly",
    browseBtn: "Browse PDF",
    selectedFile: "Selected File",
    removeFile: "Change File",
    metaHeading: "Document Metadata & Settings",
    metaDesc: "Review book metadata and select extraction mode",
    bookTitleLabel: "Book Title",
    bookTitlePlaceholder: "e.g., Persian History or Modern Poetry",
    authorLabel: "Author / Translator",
    authorPlaceholder: "e.g., Ahmad Kasravi",
    modeLabel: "Extraction Pipeline",
    modeAuto: "Auto-detect (Digital text or OCR)",
    modeOcr: "Full Visual OCR (Best for scanned books)",
    langLabel: "Document Language",
    langFaAr: "Persian & Arabic (fas + ara)",
    langFaOnly: "Persian Only (fas)",
    langEnOnly: "English (eng)",
    startBtn: "Start EPUB Conversion",
    processingTitle: "Processing in the Hashti Chamber",
    processingBadge: "Active Conversion",
    previewAlt: "Live thumbnail of rendered page",
    pageTelemetry: (c, t) => `Page ${c} of ${t}`,
    progressLabel: "Conversion Progress",
    successTitle: "Document Arrived in Hayati Sanctuary!",
    successDesc:
      "Your book has been successfully packaged into EPUB 3 with embedded Vazirmatn font and seamless Amazon Kindle compatibility.",
    downloadBtn: "Download EPUB Book",
    convertAnotherBtn: "Convert Another Document",
    kindleGuideTitle: "Send-to-Kindle Instructions",
    kindleGuideDesc:
      "Upload the downloaded EPUB directly via Amazon's official portal or email it to your Kindle address:",
    kindleLinkText: "Amazon Send to Kindle Portal",
    metaSummaryLabel: "Generated Book Summary:",
    metaPages: (c) => `${c} processed pages`,
    metaModeUsed: "Zero-Server In-Browser WASM",
    errorTitle: "An error occurred during conversion",
    retryBtn: "Reset & Try Again",
    archHeading: "Dalan Architecture & The 4 Spatial Thresholds",
    archSubheading: "Iranian spatial concepts reimagined for secure client-side computing",
    darvazehCardTitle: "1. Darvazeh (Portal Gate)",
    darvazehCardDesc:
      "The threshold of zero-server intake. Complete privacy guarantee ensuring your PDF never leaves your device.",
    hashtiCardTitle: "2. Hashti (The Octagonal Chamber)",
    hashtiCardDesc:
      "Intelligent distribution junction determining digital text vs OCR visual pipelines and normalizing layout directions.",
    dalanCardTitle: "3. Dalan (The Corridored Conduit)",
    dalanCardDesc:
      "Patient multi-threaded passage: WebWorker pipeline rendering pages, executing WASM OCR, and assembling chapters.",
    hayatiCardTitle: "4. Hayati (The Courtyard Sanctuary)",
    hayatiCardDesc:
      "The peaceful destination: An EPUB 3 artifact with embedded Vazirmatn font, valid OPF manifests, and Kindle reflow.",
    footerText:
      "Dalan • Powered purely by Hashti Design System components and client-side WASM engine.",
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
          {/* 1. Top Architectural Bar */}
          <header className="dalan-topbar" role="banner">
            <div className="dalan-brand">
              <h1 className="dalan-brand-title">{t.appTitle}</h1>
              <Badge kind="primary">{locale === "fa" ? "نسخه کلاینت" : "Client v1.0"}</Badge>
            </div>

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

          {/* 2. Hero Section (Darvazeh) */}
          <section className="darvazeh-hero" aria-labelledby="hero-title">
            <div className="darvazeh-badge">
              <Badge kind="secondary">{t.badgeSpatial}</Badge>
            </div>
            <h2 id="hero-title" className="darvazeh-title">
              {t.heroTitle}
            </h2>
            <p className="darvazeh-subtitle">{t.heroSubtitle}</p>
          </section>

          {/* 3. Main Conversion Stage */}
          <main id="main-conversion-area" aria-live="polite">
            {/* IDLE STATE: Upload & Settings */}
            {status === "idle" && (
              <Card elevation="raised">
                <CardHeader
                  title={t.dropPrompt}
                  description={t.dropHint}
                />
                <CardBody>
                  {/* Hashti DropZone with integrated FileTrigger */}
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
                        <span>{file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)</span>
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

            {/* PROCESSING STATE: Hashti Chamber */}
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

            {/* SUCCESS STATE: Hayati Sanctuary */}
            {status === "success" && (
              <Card elevation="raised">
                <CardHeader
                  title={t.successTitle}
                  action={<Badge kind="success">{locale === "fa" ? "آماده تحویل" : "Ready"}</Badge>}
                />
                <CardBody>
                  <div className="hayati-sanctuary-content">
                    <Icon name="check" size={48} aria-hidden="true" style={{ color: "var(--hashti-support-success, #198038)" }} />
                    <p className="darvazeh-subtitle">{t.successDesc}</p>

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
                            <Icon name="info" size={20} aria-hidden="true" style={{ flexShrink: 0, marginTop: "2px" }} />
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
                    <Icon name="error" size={40} aria-hidden="true" style={{ color: "var(--hashti-support-error, #da1e28)" }} />
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

          {/* 4. Architecture & 4 Thresholds Section */}
          <section className="dalan-thresholds-section" aria-labelledby="arch-heading">
            <h3 id="arch-heading" className="thresholds-heading">
              {t.archHeading}
            </h3>
            <p className="thresholds-subheading">{t.archSubheading}</p>

            <div className="thresholds-grid">
              <div className="threshold-card">
                <Card elevation="flat">
                  <CardHeader
                    title={t.darvazehCardTitle}
                    action={<Badge kind="neutral">01</Badge>}
                  />
                  <CardBody>
                    <p className="threshold-desc">{t.darvazehCardDesc}</p>
                  </CardBody>
                </Card>
              </div>

              <div className="threshold-card">
                <Card elevation="flat">
                  <CardHeader
                    title={t.hashtiCardTitle}
                    action={<Badge kind="neutral">02</Badge>}
                  />
                  <CardBody>
                    <p className="threshold-desc">{t.hashtiCardDesc}</p>
                  </CardBody>
                </Card>
              </div>

              <div className="threshold-card">
                <Card elevation="flat">
                  <CardHeader
                    title={t.dalanCardTitle}
                    action={<Badge kind="neutral">03</Badge>}
                  />
                  <CardBody>
                    <p className="threshold-desc">{t.dalanCardDesc}</p>
                  </CardBody>
                </Card>
              </div>

              <div className="threshold-card">
                <Card elevation="flat">
                  <CardHeader
                    title={t.hayatiCardTitle}
                    action={<Badge kind="neutral">04</Badge>}
                  />
                  <CardBody>
                    <p className="threshold-desc">{t.hayatiCardDesc}</p>
                  </CardBody>
                </Card>
              </div>
            </div>
          </section>

          {/* 5. Footer */}
          <footer className="dalan-footer" role="contentinfo">
            <p>{t.footerText}</p>
          </footer>
        </div>
      </div>
    </Theme>
  );
}
