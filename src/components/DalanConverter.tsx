import React, { useState, useRef } from "react";
import { Button, ProgressBar, Card, Badge } from "@hashti/react";
import { UploadCloud, CheckCircle2, AlertCircle, RefreshCw, Smartphone } from "lucide-react";

export function DalanConverter() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [lang, setLang] = useState("fas+ara");
  const [mode, setMode] = useState<"auto" | "ocr">("auto");

  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [progressMsg, setProgressMsg] = useState("");
  const [percent, setPercent] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [outputFilename, setOutputFilename] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const workerRef = useRef<Worker | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setTitle(selected.name.replace(/\.[^/.]+$/, ""));
      setStatus("idle");
      setDownloadUrl(null);
    }
  };

  const startConversion = async () => {
    if (!file) return;

    setStatus("processing");
    setPercent(0);
    setProgressMsg("شروع آماده‌سازی پردازش سند در مرورگر...");

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
        } else if (data.type === "complete") {
          const url = URL.createObjectURL(data.epubBlob);
          setDownloadUrl(url);
          setOutputFilename(data.filename);
          setStatus("success");
          setPercent(100);
          worker.terminate();
        } else if (data.type === "error") {
          setErrorMsg(data.error);
          setStatus("error");
          worker.terminate();
        }
      };

      worker.postMessage({
        fileBuffer: buffer,
        options: {
          lang,
          mode,
          title: title || file.name,
          author: author || "نامشخص",
        },
      });
    } catch (err: any) {
      setErrorMsg(err?.message || "خطا در شروع تبدیل");
      setStatus("error");
    }
  };

  return (
    <div className="dalan-container" dir="rtl">
      {/* 1. Darvazeh (The Portal Header) */}
      <header className="hashti-portal">
        <Badge variant="neutral" className="portal-badge">هندسه فضایی هشتی • نسخه کلاینت صفر سرور</Badge>
        <h1 className="portal-title">دالان (Dalan)</h1>
        <p className="portal-subtitle">
          گذرگاه امن تبدیل کتاب‌ها و اسناد PDF به نسخه روان و خوانای کیندل (EPUB) کاملاً درون مرورگر بدون ارسال فایل به هیچ سروری
        </p>
      </header>

      {/* 2. Hashti Chamber (Interactive Card) */}
      <main className="hashti-chamber">
        {status === "idle" && (
          <div className="chamber-card">
            <div className="dropzone-area">
              <input
                type="file"
                id="pdf-upload"
                accept="application/pdf"
                className="hidden-input"
                onChange={handleFileChange}
              />
              <label htmlFor="pdf-upload" className="dropzone-label">
                <UploadCloud className="dropzone-icon" />
                <span className="dropzone-text">
                  {file ? file.name : "فایل PDF کتاب یا مقاله خود را اینجا بکشید یا کلیک کنید"}
                </span>
                <span className="dropzone-hint">
                  پشتیبانی کامل از اسناد فارسی، عربی و انگلیسی (اسکن‌شده و دیجیتال)
                </span>
              </label>
            </div>

            {file && (
              <div className="options-grid">
                <div className="form-group">
                  <label>عنوان کتاب</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="hashti-input"
                  />
                </div>

                <div className="form-group">
                  <label>نویسنده</label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="مثال: احمد کسروی"
                    className="hashti-input"
                  />
                </div>

                <div className="form-group">
                  <label>نوع سند</label>
                  <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value as any)}
                    className="hashti-select"
                  >
                    <option value="auto">تشخیص خودکار (متن دیجیتال یا تصویر)</option>
                    <option value="ocr">پردازش تصویری کامل (OCR - مناسب مجلات اسکن‌شده)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>زبان متن</label>
                  <select
                    value={lang}
                    onChange={(e) => setLang(e.target.value)}
                    className="hashti-select"
                  >
                    <option value="fas+ara">فارسی و عربی (fas + ara)</option>
                    <option value="fas">فارسی خالص (fas)</option>
                    <option value="eng">انگلیسی (eng)</option>
                  </select>
                </div>

                <Button onPress={startConversion} className="hashti-primary-btn">
                  شروع تبدیل به فرمت کیندل
                </Button>
              </div>
            )}
          </div>
        )}

        {status === "processing" && (
          <div className="chamber-card processing-card">
            <RefreshCw className="spinning-icon" />
            <h2 className="step-title">دالان در حال تبدیل سند شماست</h2>
            <p className="step-desc">{progressMsg}</p>

            <ProgressBar value={percent} label="پیشرفت پردازش" showValueLabel className="hashti-progress" />
          </div>
        )}

        {status === "success" && (
          <div className="chamber-card hayati-sanctuary">
            <CheckCircle2 className="success-icon" />
            <h2 className="step-title">کتاب شما با موفقیت آماده شد!</h2>
            <p className="step-desc">
              فایل نهایی حاوی فونت بهینه‌شده <strong>وزیرمتن</strong> و ساختار کاملاً راست‌چین و خوانا برای آمازون کیندل است.
            </p>

            <div className="action-buttons">
              <a href={downloadUrl!} download={outputFilename} className="hashti-primary-btn download-btn">
                دانلود فایل EPUB ({outputFilename})
              </a>

              <Button
                onPress={() => {
                  setStatus("idle");
                  setFile(null);
                }}
                variant="secondary"
                className="hashti-secondary-btn"
              >
                تبدیل یک کتاب دیگر
              </Button>
            </div>

            <div className="kindle-instruction">
              <Smartphone className="kindle-icon" />
              <div>
                <strong>راهنمای انتقال به کیندل:</strong>
                <p>
                  فایل دانلود شده را مستقیماً در صفحه رسمی{" "}
                  <a href="https://www.amazon.com/sendtokindle" target="_blank" rel="noreferrer">
                    Amazon Send to Kindle
                  </a>{" "}
                  آپلود کنید یا به آدرس ایمیل کیندل خود ارسال نمایید تا بلافاصله همگام‌سازی شود.
                </p>
              </div>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="chamber-card error-card">
            <AlertCircle className="error-icon" />
            <h2 className="step-title">خطایی در پردازش رخ داد</h2>
            <p className="step-desc">{errorMsg}</p>
            <button onClick={() => setStatus("idle")} className="hashti-secondary-btn">
              تلاش مجدد
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
