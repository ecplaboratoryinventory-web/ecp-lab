const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const dir = "C:/Users/00lem/Documents/ECP Inventory Lab/reference";

const script = `
Add-Type -AssemblyName System.IO.Compression.FileSystem

function Extract-DocxText($filePath) {
  $zip = [System.IO.Compression.ZipFile]::OpenRead($filePath)
  $entry = $zip.GetEntry("word/document.xml")
  $stream = $entry.Open()
  $reader = New-Object System.IO.StreamReader($stream)
  $xml = $reader.ReadToEnd()
  $reader.Close()
  $stream.Close()
  $zip.Dispose()
  return $xml -replace '<[^>]+>', ' '
}

$files = @(
  "$dir\\Chemistry_Lab_Management_List.docx",
  "$dir\\Electronics_Lab_Management_List.docx",
  "$dir\\Physics_Lab_Management_List.docx"
)

foreach ($f in $files) {
  Write-Host "=== $(Split-Path $f -Leaf) ==="
  $text = Extract-DocxText $f
  Write-Host $text.Substring(0, [Math]::Min(5000, $text.Length))
  Write-Host ""
}
`;

fs.writeFileSync("extract.ps1", script);
const result = execSync('powershell -ExecutionPolicy Bypass -File extract.ps1', { encoding: "utf8", maxBuffer: 50 * 1024 * 1024 });
console.log(result);
fs.unlinkSync("extract.ps1");
