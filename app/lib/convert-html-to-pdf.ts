import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import fs from "fs/promises";
import path from "path";

export async function convertHtmlToPdf(
  html: string,
  outputPath?: string
): Promise<string | Buffer> {
  console.log("Starting HTML to PDF conversion...");

  let browser;
  const isLocalDev = process.env.NODE_ENV !== "production";

  if (isLocalDev) {
    try {
      const puppeteerFull = await import("puppeteer");

      console.log("Using local Puppeteer installation for development");
      browser = await puppeteerFull.default.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
        ],
      });
    } catch (error) {
      console.error(
        "Failed to launch local browser, falling back to default:",
        error
      );
      // Fallback to default puppeteer-core behavior
      browser = await puppeteer.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
        ],
      });
    }
  } else {
    const executablePath = await chromium.executablePath();
    browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        "--hide-scrollbars",
        "--disable-web-security",
        "--disable-extensions",
        "--disable-setuid-sandbox",
        "--no-sandbox",
        "--disable-dev-shm-usage",
      ],
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: chromium.headless,
    });
  }

  try {
    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: "networkidle0",
      timeout: 30000, 
    });

    await (page as any).evaluate("document.fonts.ready")

    await new Promise((resolve) => setTimeout(resolve, 1000));
    const bodyHeight = await (page as any).evaluate(() => {
      const body = document.querySelector(".certificate-container");
      return body ? body.scrollHeight : 794; 
    });

    await page.setViewport({
      width: 1123, 
      height: Math.max(794, bodyHeight + 40),
      deviceScaleFactor: 1,
    });

    // If outputPath is provided, save to file, otherwise return buffer
    if (outputPath) {
      await page.pdf({
        path: outputPath,
        width: "1123px",
        height: `${Math.max(794, bodyHeight + 40)}px`, // Dynamic height
        printBackground: true,
        margin: {
          top: "0cm",
          right: "0cm",
          bottom: "0cm",
          left: "0cm",
        },
        timeout: 60000, // 60 seconds timeout for PDF generation
      });
      console.log(`PDF successfully created at: ${outputPath}`);
      return outputPath;
    } else {
      // Return buffer for serverless environments
      const pdfBuffer = await page.pdf({
        width: "1123px",
        height: `${Math.max(794, bodyHeight + 40)}px`, // Dynamic height
        printBackground: true,
        margin: {
          top: "0cm",
          right: "0cm",
          bottom: "0cm",
          left: "0cm",
        },
        timeout: 60000,
      });
      return Buffer.from(pdfBuffer);
    }
  } catch (error) {
    console.error("Error converting HTML to PDF:", error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Define certificate type to fix the 'any' type error
interface Certificate {
  studentClassId: string;
  className: string;
  levelName: string;
  completionDate: string;
  certificateUrl: string;
  gpa: number;
  studentName: string;
  instructorName: string;
  skillsEarned: string[];
}

// Example certificate data based on the provided type
const sampleCertificate: Certificate = {
  studentClassId: "cert-123456",
  className: "Class Level 4",
  levelName: "Professional/Master Level",
  completionDate: "2025-04-27T10:00:00Z",
  certificateUrl: "https://example.com/certificates/cert-123456",
  gpa: 7.0,
  studentName: "Đỗ Hoàng",
  instructorName: "Matthew Smith",
  skillsEarned: [
    "Play difficult and technically complex works such as Rachmaninoff, Liszt, Debussy...",
    "Perform confidently on stage with a personal style.",
    "Improvise and be creative in playing.",
    "Collaborate with other instruments in an orchestra or band.",
    "Compose and arrange music in your own style.",
  ],
};

// Generate sample HTML based on the certificate data
export function generateCertificateHtml(certificate: Certificate): string {
  const formattedDate = new Date(certificate.completionDate).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  const skillsHtml = certificate.skillsEarned
    .map((skill: string) => `<div class="skill-item">${skill}</div>`)
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Certificate of Completion - Photon Piano Academy</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet">
  <style>
    /* Reset and Base Styles */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Roboto', sans-serif;
      color: #1e3a5f;
      margin: 0;
      padding: 0;
      background-color: #f9f9f9;
    }

    /* Certificate Container - Flexible height */
    .certificate-container {
      width: 1123px; /* A4 landscape width */
      min-height: 794px; /* A4 landscape minimum height */
      margin: 0 auto;
      position: relative;
      background: white;
      overflow: visible; /* Changed from hidden to visible */
      padding-bottom: 40px; /* Add padding to ensure content doesn't touch the border */
    }

    /* Gold Border Design */
    .gold-border {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      border: 20px solid #e6c460;
      border-radius: 8px;
      z-index: 1;
    }

    /* Corner Accent */
    .corner-accent {
      position: absolute;
      top: 0;
      right: 0;
      width: 250px;
      height: 250px;
      background: #1e3a5f;
      border-bottom-left-radius: 100%;
      z-index: 2;
      border-left: 2px solid #e6c460;
      border-bottom: 2px solid #e6c460;
    }

    /* Certificate Content */
    .certificate-content {
      position: relative;
      z-index: 10;
      padding: 60px 80px 80px; /* Increased bottom padding */
      min-height: 794px; /* Minimum height to match container */
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    /* Header Section */
    .academy-name {
      font-family: 'Cormorant Garamond', serif;
      font-size: 28px;
      color: #333;
      margin-bottom: 10px;
      letter-spacing: 2px;
      text-transform: uppercase;
    }

    .certificate-title {
      font-family: 'Cormorant Garamond', serif;
      font-size: 48px;
      font-weight: 700;
      color: #1e3a5f;
      margin-bottom: 15px;
      letter-spacing: 1px;
      text-transform: uppercase;
    }

    .certificate-subtitle {
      font-size: 18px;
      color: #555;
      margin-bottom: 40px;
    }

    /* Student Name Section */
    .student-name {
      font-family: 'Cormorant Garamond', serif;
      font-size: 52px;
      font-weight: 700;
      font-style: italic;
      color: #1e3a5f;
      margin: 20px 0;
      padding-bottom: 10px;
      border-bottom: 1px solid #e6c460;
      display: inline-block;
      min-width: 60%;
    }

    .certificate-text {
      font-size: 18px;
      line-height: 1.6;
      text-align: center;
      max-width: 80%;
      margin: 0 auto 40px;
    }

    .highlight {
      font-weight: 600;
    }

    /* GPA Section */
    .gpa-container {
      display: flex;
      justify-content: center;
      margin: 30px 0;
    }

    .gpa-circle {
      width: 90px;
      height: 90px;
      border-radius: 50%;
      background: #e6c460;
      border: 4px solid #1e3a5f;
      display: flex;
      justify-content: center;
      align-items: center;
      color: #1e3a5f;
      font-weight: 700;
      font-size: 32px;
    }

    /* Skills Section */
    .skills-container {
      margin: 20px auto 40px; /* Increased bottom margin */
      width: 80%;
      text-align: center;
    }

    .skills-title {
      font-weight: 600;
      margin-bottom: 25px;
      font-size: 18px;
      color: #1e3a5f;
      text-align: center;
      border-bottom: 1px solid #e6c460;
      display: inline-block;
      padding: 0 20px 5px;
    }

    .skills-list {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 15px;
      margin-bottom: 30px; /* Increased bottom margin */
    }

    .skill-item {
      background-color: white;
      padding: 10px 20px;
      border-radius: 30px;
      font-size: 14px;
      color: #1e3a5f;
      border: 1px solid #e6c460;
      display: inline-block;
      max-width: 100%;
      text-align: center;
      word-wrap: break-word; /* Ensure long words wrap */
      overflow-wrap: break-word;
    }

    /* Footer Section */
    .certificate-footer {
      display: flex;
      justify-content: space-between;
      width: 100%;
      margin-top: auto;
      padding: 0 40px;
    }

    .signature-container {
      text-align: center;
      width: 200px;
    }

    .signature-line {
      border-top: 1px solid #ddd;
      margin-top: 40px;
      padding-top: 10px;
    }

    .signature-name {
      font-weight: 600;
      font-size: 18px;
      color: #1e3a5f;
    }

    .signature-title {
      font-style: italic;
      color: #777;
      font-size: 14px;
      margin-top: 5px;
    }

    /* Print-specific styles */
    @media print {
      body {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      .certificate-container {
        page-break-inside: avoid;
        break-inside: avoid;
      }
      
      .skills-list {
        page-break-inside: avoid;
        break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="certificate-container">
    <!-- Gold Border -->
    <div class="gold-border"></div>
    
    <!-- Corner Accent -->
    <div class="corner-accent"></div>
    
    <!-- Certificate Content -->
    <div class="certificate-content">
      <!-- Header -->
      <div class="academy-name">Photon Piano Academy</div>
      <div class="certificate-title">Certificate of Completion</div>
      <div class="certificate-subtitle">This certifies that</div>
      
      <!-- Student Name -->
      <div class="student-name">${certificate.studentName}</div>
      
      <!-- Course Details -->
      <p class="certificate-text">
        Has successfully completed the <span class="highlight">${
          certificate.className
        }</span> course at Photon Piano Academy, demonstrating 
        proficiency in piano performance at the <span class="highlight">${
          certificate.levelName
        }</span> level.
      </p>
      
      <!-- GPA Display -->
      <div class="gpa-container">
        <div class="gpa-circle">
          ${certificate.gpa.toFixed(1)}
        </div>
      </div>
      
      <!-- Skills Section -->
      <div class="skills-container">
        <p class="skills-title">Competencies Achieved</p>
        <div class="skills-list">
          ${skillsHtml}
        </div>
      </div>
      
      <!-- Footer with Signature -->
      <div class="certificate-footer">
        <!-- Date -->
        <div class="signature-container">
          <div class="signature-line">
            <div class="signature-name">${formattedDate}</div>
            <div class="signature-title">Date of Completion</div>
          </div>
        </div>
        
        <!-- Signature -->
        <div class="signature-container">
          <div class="signature-line">
            <div class="signature-name">${certificate.instructorName}</div>
            <div class="signature-title">Course Instructor</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
`;
}

// Create output directory if it doesn't exist
export async function ensureDirectoryExists(directory: string): Promise<void> {
  try {
    await fs.access(directory);
  } catch {
    await fs.mkdir(directory, { recursive: true });
  }
}

// Main function to demonstrate the conversion
export async function main(): Promise<void> {
  // Only run this in local development, not in serverless
  if (process.env.NODE_ENV === "production") {
    console.log("This script is for local development only");
    return;
  }

  const outputDir = "./output";
  await ensureDirectoryExists(outputDir);

  const outputPath = path.join(outputDir, "certificate.pdf");

  try {
    // Generate HTML from the sample certificate data
    const certificateHtml = generateCertificateHtml(sampleCertificate);

    // Save the HTML for reference
    const htmlPath = path.join(outputDir, "certificate.html");
    await fs.writeFile(htmlPath, certificateHtml);
    console.log(`Sample HTML saved to: ${htmlPath}`);

    // Convert HTML to PDF
    await convertHtmlToPdf(certificateHtml, outputPath);

    // Read the generated PDF file to verify
    const stats = await fs.stat(outputPath);
    console.log(`PDF file size: ${stats.size} bytes`);

    console.log("\nTo integrate this with your Remix application:");
    console.log(
      "1. Create a server endpoint that receives the certificate HTML"
    );
    console.log("2. Convert the HTML to PDF using this function");
    console.log("3. Return the PDF file as a download response");
  } catch (error) {
    console.error("Failed to process certificate:", error);
  }
}

// For direct execution in Node.js environments
if (typeof process !== "undefined" && process.argv[1] === import.meta.url) {
  main();
}
