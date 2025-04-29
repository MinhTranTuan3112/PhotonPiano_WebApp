import puppeteer from "puppeteer"
import fs from "fs/promises"
import path from "path"

// Function to convert HTML to PDF
async function convertHtmlToPdf(html, outputPath) {
  console.log("Starting HTML to PDF conversion...")

  // Launch a headless browser
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  })

  try {
    // Create a new page
    const page = await browser.newPage()

    // Set content to the HTML
    await page.setContent(html, {
      waitUntil: "networkidle0",
    })

    // Set page size to A4 for certificates
    await page.pdf({
      path: outputPath,
      format: "A4",
      printBackground: true,
      margin: {
        top: "0.5cm",
        right: "0.5cm",
        bottom: "0.5cm",
        left: "0.5cm",
      },
    })

    console.log(`PDF successfully created at: ${outputPath}`)
    return outputPath
  } catch (error) {
    console.error("Error converting HTML to PDF:", error)
    throw error
  } finally {
    await browser.close()
  }
}

// Example certificate data based on the provided type
const sampleCertificate = {
  studentClassId: "cert-123456",
  className: "Piano Performance",
  levelName: "Level 3",
  completionDate: "2025-04-27T10:00:00Z",
  certificateUrl: "https://example.com/certificates/cert-123456",
  gpa: 3.8,
  studentName: "Nguyen Van A",
  instructorName: "Tran Thi B",
  skillsEarned: ["Music Theory", "Piano Technique", "Performance Skills", "Sight Reading"],
}

// Generate sample HTML based on the certificate data
function generateCertificateHtml(certificate) {
  const formattedDate = new Date(certificate.completionDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const skillsHtml = certificate.skillsEarned.map((skill) => `<span class="skill-badge">${skill}</span>`).join("")

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Certificate of Completion</title>
  <style>
    body {
      font-family: 'Arial', sans-serif;
      text-align: center;
      padding: 40px;
      color: #333;
      background-color: #f9f9f9;
    }
    .certificate {
      border: 10px solid #0066cc;
      padding: 25px;
      position: relative;
      margin: 0 auto;
      background-color: white;
      box-shadow: 0 0 20px rgba(0,0,0,0.1);
    }
    .header {
      font-size: 24px;
      margin-bottom: 20px;
      color: #0066cc;
    }
    .title {
      font-size: 36px;
      font-weight: bold;
      margin: 20px 0;
    }
    .student-name {
      font-size: 28px;
      font-weight: bold;
      margin: 30px 0;
      color: #333;
    }
    .course-name {
      font-size: 22px;
      margin: 15px 0;
    }
    .level-name {
      font-size: 18px;
      margin: 10px 0;
      color: #555;
    }
    .completion-date {
      font-size: 18px;
      margin: 15px 0 30px 0;
    }
    .signature {
      margin-top: 40px;
      display: flex;
      justify-content: space-around;
    }
    .signature-line {
      width: 200px;
      border-top: 1px solid #333;
      margin-top: 10px;
    }
    .gpa {
      font-size: 20px;
      font-weight: bold;
      margin: 20px 0;
      color: #0066cc;
    }
    .skills {
      margin: 20px 0;
    }
    .skills-title {
      font-size: 18px;
      margin-bottom: 10px;
    }
    .skill-badge {
      display: inline-block;
      background-color: #e6f2ff;
      color: #0066cc;
      padding: 5px 10px;
      margin: 5px;
      border-radius: 15px;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="header">CERTIFICATE OF COMPLETION</div>
    <div class="title">This certifies that</div>
    <div class="student-name">${certificate.studentName}</div>
    <div class="title">has successfully completed</div>
    <div class="course-name">${certificate.className}</div>
    <div class="level-name">${certificate.levelName}</div>
    <div class="completion-date">on ${formattedDate}</div>
    <div class="gpa">GPA: ${certificate.gpa.toFixed(1)}</div>
    
    <div class="skills">
      <div class="skills-title">Skills Earned:</div>
      <div class="skills-badges">
        ${skillsHtml}
      </div>
    </div>
    
    <div class="signature">
      <div>
        <div class="signature-line"></div>
        <div>${certificate.instructorName}</div>
        <div>Instructor</div>
      </div>
      <div>
        <div class="signature-line"></div>
        <div>Director</div>
      </div>
    </div>
  </div>
</body>
</html>
`
}

// Create output directory if it doesn't exist
async function ensureDirectoryExists(directory) {
  try {
    await fs.access(directory)
  } catch {
    await fs.mkdir(directory, { recursive: true })
  }
}

// Main function to demonstrate the conversion
async function main() {
  const outputDir = "./output"
  await ensureDirectoryExists(outputDir)

  const outputPath = path.join(outputDir, "certificate.pdf")

  try {
    // Generate HTML from the sample certificate data
    const certificateHtml = generateCertificateHtml(sampleCertificate)

    // Save the HTML for reference
    const htmlPath = path.join(outputDir, "certificate.html")
    await fs.writeFile(htmlPath, certificateHtml)
    console.log(`Sample HTML saved to: ${htmlPath}`)

    // Convert HTML to PDF
    await convertHtmlToPdf(certificateHtml, outputPath)

    // Read the generated PDF file to verify
    const stats = await fs.stat(outputPath)
    console.log(`PDF file size: ${stats.size} bytes`)

    console.log("\nTo integrate this with your Remix application:")
    console.log("1. Create a server endpoint that receives the certificate HTML")
    console.log("2. Convert the HTML to PDF using this function")
    console.log("3. Return the PDF file as a download response")
    console.log("\nExample implementation:")
    console.log("- Create a route at /api/certificates/:id/pdf")
    console.log("- Fetch the certificate HTML from your backend")
    console.log("- Use puppeteer to convert the HTML to PDF")
    console.log("- Return the PDF with proper Content-Type and Content-Disposition headers")
  } catch (error) {
    console.error("Failed to process certificate:", error)
  }
}

// Run the demonstration
main()
