const fs = require("fs");
const { PDFParse } = require("pdf-parse");

const file = "C:/Users/00lem/Documents/ECP Inventory Lab/reference/ECP_Capstone-2_DOCUMENTS.pdf";

async function main() {
  const buf = new Uint8Array(fs.readFileSync(file));
  const reader = new PDFParse(buf);
  await reader.load();
  
  const info = await reader.getInfo();
  console.log("Info:", info);

  let fullText = "";
  for (let i = 1; i <= 100; i++) {
    try {
      const pageText = await reader.getText(i);
      if (pageText && pageText.trim()) {
        fullText += `\n--- PAGE ${i} ---\n${pageText}\n`;
      }
    } catch (e) {
      break;
    }
  }

  console.log("\n=== EXTRACTED TEXT ===");
  console.log(fullText.substring(0, 15000));
  
  if (fullText.length > 15000) {
    console.log("\n=== NEXT 15000 ===");
    console.log(fullText.substring(15000, 30000));
  }
}

main().catch(console.error);
