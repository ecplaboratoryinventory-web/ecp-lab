import * as XLSX from "xlsx-js-style";

export function downloadXlsxTemplate(headers: string[], filename: string) {
  const ws = XLSX.utils.aoa_to_sheet([headers]);

  const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
  for (let c = range.s.c; c <= range.e.c; c++) {
    const addr = XLSX.utils.encode_cell({ r: 0, c });
    if (ws[addr]) {
      ws[addr].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "0EA5A0" } },
        alignment: { horizontal: "center", vertical: "center" },
      };
    }
  }

  ws["!cols"] = headers.map((h) => ({
    wch: Math.min(Math.max(h.length + 4, 16), 32),
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  XLSX.writeFile(wb, filename, { cellStyles: true });
}
