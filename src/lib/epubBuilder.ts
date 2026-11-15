import JSZip from "jszip";

export interface Chapter {
  title: string;
  content: string; // HTML body or plain text paragraphs (can contain reflow-illustration markup)
}

export interface EpubMetadata {
  title: string;
  author: string;
  language?: string;
}

export interface EpubImage {
  filename: string; // e.g. "cover.jpg" or "img_p2_1.jpg"
  buffer: ArrayBuffer;
  mimeType: string; // e.g. "image/jpeg" or "image/png"
}

export async function buildEpubBlob(
  chapters: Chapter[],
  meta: EpubMetadata,
  fontBuffer?: ArrayBuffer,
  coverBuffer?: ArrayBuffer,
  images?: EpubImage[]
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

  // 3. Stylesheet (with embedded Vazirmatn & RTL direction & responsive Kindle illustration styles)
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
.illustration-container {
  text-align: center;
  margin: 1.5em 0;
  page-break-inside: avoid;
}
.reflow-illustration {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 1em auto;
  border-radius: 4px;
}
.cover-container {
  height: 100vh;
  margin: 0;
  padding: 0;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
}
.cover-image {
  max-width: 100%;
  max-height: 100vh;
  height: auto;
  display: block;
  margin: auto;
}
`;
  zip.file("OEBPS/styles/style.css", css);

  // 4. Embedded Font
  if (fontBuffer) {
    zip.file("OEBPS/fonts/Vazirmatn-Regular.ttf", fontBuffer);
  }

  // 5. Store Cover Image & Additional Images
  const manifestItems: string[] = [
    `<item id="css" href="styles/style.css" media-type="text/css"/>`,
    `<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>`,
    `<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>`,
  ];
  if (fontBuffer) {
    manifestItems.push(
      `<item id="font-vazir" href="fonts/Vazirmatn-Regular.ttf" media-type="font/ttf"/>`
    );
  }

  const spineItems: string[] = [];

  // Handle official Cover
  if (coverBuffer) {
    zip.file("OEBPS/images/cover.jpg", coverBuffer);
    manifestItems.push(
      `<item id="cover-image" href="images/cover.jpg" media-type="image/jpeg" properties="cover-image"/>`
    );

    // Create cover.xhtml
    const coverXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="${meta.language || "fa"}" dir="rtl">
  <head>
    <title>جلد کتاب</title>
    <meta charset="utf-8"/>
    <link rel="stylesheet" type="text/css" href="styles/style.css"/>
  </head>
  <body class="cover-body">
    <div class="cover-container">
      <img src="images/cover.jpg" alt="${escapeXml(meta.title)}" class="cover-image"/>
    </div>
  </body>
</html>`;
    zip.file("OEBPS/text/cover.xhtml", coverXhtml);
    manifestItems.push(
      `<item id="cover" href="text/cover.xhtml" media-type="application/xhtml+xml"/>`
    );
    spineItems.push(`<itemref idref="cover" linear="yes"/>`);
  }

  // Handle embedded illustrations/images
  if (images && images.length > 0) {
    images.forEach((img, idx) => {
      const imgPath = `images/${img.filename}`;
      zip.file(`OEBPS/${imgPath}`, img.buffer);
      const imgId = `img_${idx + 1}`;
      manifestItems.push(
        `<item id="${imgId}" href="${imgPath}" media-type="${img.mimeType}"/>`
      );
    });
  }

  // 6. Chapters XHTML
  const navLinks: string[] = [];
  const ncxNavPoints: string[] = [];

  chapters.forEach((ch, idx) => {
    const playOrder = idx + 1;
    const id = `chap_${String(playOrder).padStart(3, "0")}`;
    const filename = `text/${id}.xhtml`;

    manifestItems.push(`<item id="${id}" href="${filename}" media-type="application/xhtml+xml"/>`);
    spineItems.push(`<itemref idref="${id}"/>`);
    navLinks.push(`<li><a href="${filename}">${escapeXml(ch.title)}</a></li>`);
    ncxNavPoints.push(`    <navPoint id="navPoint-${playOrder}" playOrder="${playOrder}">
      <navLabel>
        <text>${escapeXml(ch.title)}</text>
      </navLabel>
      <content src="${filename}"/>
    </navPoint>`);

    // Render paragraphs: if paragraph is an illustration container, don't wrap in <p>
    const paragraphs = ch.content
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => {
        if (p.startsWith("<div") && p.includes("reflow-illustration")) {
          return p;
        }
        return `<p>${escapeXml(p)}</p>`;
      })
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

  // 7. Navigation (nav.xhtml) - EPUB 3
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

  // 8. Navigation Control XML (toc.ncx) - EPUB 2 / Kindle backward compatibility
  const bookId = `urn:uuid:${Math.random().toString(36).substring(2, 15)}`;
  const ncx = `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1" xml:lang="${meta.language || "fa"}" dir="rtl">
  <head>
    <meta name="dtb:uid" content="${bookId}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle>
    <text>${escapeXml(meta.title)}</text>
  </docTitle>
  <docAuthor>
    <text>${escapeXml(meta.author || "Unknown")}</text>
  </docAuthor>
  <navMap>
${ncxNavPoints.join("\n")}
  </navMap>
</ncx>`;
  zip.file("OEBPS/toc.ncx", ncx);

  // 9. OPF Manifest (content.opf)
  const coverMeta = coverBuffer ? `\n    <meta name="cover" content="cover-image"/>` : "";
  const opf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="BookID" page-progression-direction="rtl">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="BookID">${bookId}</dc:identifier>
    <dc:title>${escapeXml(meta.title)}</dc:title>
    <dc:creator>${escapeXml(meta.author || "Unknown")}</dc:creator>
    <dc:language>${meta.language || "fa"}</dc:language>${coverMeta}
  </metadata>
  <manifest>
    ${manifestItems.join("\n    ")}
  </manifest>
  <spine toc="ncx" page-progression-direction="rtl">
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
