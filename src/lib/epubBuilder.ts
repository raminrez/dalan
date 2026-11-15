import JSZip from "jszip";

export interface Chapter {
  title: string;
  content: string; // HTML body or plain text paragraphs
}

export interface EpubMetadata {
  title: string;
  author: string;
  language?: string;
}

export async function buildEpubBlob(
  chapters: Chapter[],
  meta: EpubMetadata,
  fontBuffer?: ArrayBuffer
): Promise<Blob> {
  const zip = new JSZip();

  // 1. mimetype (must be uncompressed and first file in zip)
  zip.file("mimetype", "application/epub+zip", { compression: "STORE" });

  // 2. META-INF/container.xml
  zip.file(
    "META-INF/container.xml",
    `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`
  );

  // 3. Stylesheet (with embedded Vazirmatn & RTL direction)
  const css = `
@font-face {
  font-family: 'Vazirmatn';
  src: url('../fonts/Vazirmatn-Regular.ttf');
  font-weight: normal;
  font-style: normal;
}
html {
  direction: rtl;
}
body {
  font-family: 'Vazirmatn', 'Amiri', serif;
  text-align: justify;
  line-height: 1.8;
  margin: 0.5em 1em;
}
h1, h2, h3 {
  text-align: center;
  font-weight: bold;
}
p {
  margin: 0 0 0.5em 0;
  text-indent: 1em;
}
`;
  zip.file("OEBPS/styles/style.css", css);

  // 4. Embedded Font
  if (fontBuffer) {
    zip.file("OEBPS/fonts/Vazirmatn-Regular.ttf", fontBuffer);
  }

  // 5. Chapters XHTML
  const manifestItems: string[] = [
    `<item id="css" href="styles/style.css" media-type="text/css"/>`,
    `<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>`,
  ];
  if (fontBuffer) {
    manifestItems.push(
      `<item id="font-vazir" href="fonts/Vazirmatn-Regular.ttf" media-type="font/ttf"/>`
    );
  }
  const spineItems: string[] = [];
  const navLinks: string[] = [];

  chapters.forEach((ch, idx) => {
    const id = `chap_${String(idx + 1).padStart(3, "0")}`;
    const filename = `text/${id}.xhtml`;

    manifestItems.push(`<item id="${id}" href="${filename}" media-type="application/xhtml+xml"/>`);
    spineItems.push(`<itemref idref="${id}"/>`);
    navLinks.push(`<li><a href="${filename}">${ch.title}</a></li>`);

    const paragraphs = ch.content
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => `<p>${escapeXml(p)}</p>`)
      .join("\n      ");

    const xhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="${meta.language || "fa"}" dir="rtl">
  <head>
    <title>${escapeXml(ch.title)}</title>
    <meta charset="utf-8"/>
    <link rel="stylesheet" type="text/css" href="../styles/style.css"/>
  </head>
  <body>
    <h2>${escapeXml(ch.title)}</h2>
    <div class="chapter-content">
      ${paragraphs}
    </div>
  </body>
</html>`;
    zip.file(`OEBPS/${filename}`, xhtml);
  });

  // 6. Navigation (nav.xhtml)
  const navXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="${meta.language || "fa"}" dir="rtl">
  <head>
    <title>فهرست مطالب</title>
    <meta charset="utf-8"/>
    <link rel="stylesheet" type="text/css" href="styles/style.css"/>
  </head>
  <body>
    <nav epub:type="toc">
      <h1>فهرست مطالب</h1>
      <ol>
        ${navLinks.join("\n        ")}
      </ol>
    </nav>
  </body>
</html>`;
  zip.file("OEBPS/nav.xhtml", navXhtml);

  // 7. OPF Manifest (content.opf)
  const bookId = `urn:uuid:${Math.random().toString(36).substring(2, 15)}`;
  const opf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="BookID" page-progression-direction="rtl">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="BookID">${bookId}</dc:identifier>
    <dc:title>${escapeXml(meta.title)}</dc:title>
    <dc:creator>${escapeXml(meta.author || "Unknown")}</dc:creator>
    <dc:language>${meta.language || "fa"}</dc:language>
  </metadata>
  <manifest>
    ${manifestItems.join("\n    ")}
  </manifest>
  <spine page-progression-direction="rtl">
    ${spineItems.join("\n    ")}
  </spine>
</package>`;
  zip.file("OEBPS/content.opf", opf);

  // Generate output blob
  return await zip.generateAsync({
    type: "blob",
    mimeType: "application/epub+zip",
    compression: "DEFLATE",
    compressionOptions: { level: 9 },
  });
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
