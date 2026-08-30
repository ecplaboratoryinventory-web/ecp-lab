import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const NAVY: [number, number, number] = [27, 43, 64];
const TEAL: [number, number, number] = [14, 165, 160];
const GRAY: [number, number, number] = [143, 161, 179];
const LIGHT: [number, number, number] = [242, 245, 249];

interface MonthlyReportData {
  title: string;
  month: string;
  year: number;
  stats: {
    totalBorrows: number;
    totalReturns: number;
    totalBorrowed: number;
    totalApproved: number;
    totalPending: number;
  };
  equipmentSummary: { label: string; count: number }[];
  recentBorrows: {
    requestId: string;
    user: string;
    purpose: string;
    status: string;
    borrowDate: string;
    returnDate: string;
    itemsSummary: string;
  }[];
}

interface ActivityLog {
  userName: string;
  action: string;
  entityType: string;
  details?: Record<string, unknown>;
  createdAt: string;
}

function navyHeader(doc: jsPDF, title: string, subtitle: string, docNo: string) {
  const w = doc.internal.pageSize.getWidth();

  doc.setFillColor(...NAVY);
  doc.rect(0, 0, w, 26, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("ECP Laboratory", 14, 13);

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY);
  doc.text("Inventory Management System — Laboratory Operations & Equipment Control", 14, 19);

  doc.setFontSize(7);
  doc.setTextColor(...GRAY);
  doc.text(`Doc. No: ${docNo}`, w - 14, 13, { align: "right" });
  doc.text(`Date: ${new Date().toLocaleDateString("en-PH", { day: "2-digit", month: "short", year: "numeric" })}`, w - 14, 19, { align: "right" });

  doc.setDrawColor(...TEAL);
  doc.setLineWidth(2);
  doc.line(14, 28, w - 14, 28);

  doc.setTextColor(...NAVY);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(title, w / 2, 36, { align: "center" });

  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text(subtitle, w / 2, 42, { align: "center" });
}

function metaInfoTable(doc: jsPDF, startY: number, rows: [string, string, string, string][]) {
  autoTable(doc, {
    startY,
    body: rows.map(([l1, v1, l2, v2]) => [
      { content: l1, styles: { fontStyle: "bold", cellPadding: { top: 3, right: 6, bottom: 3, left: 6 } } },
      { content: v1, styles: { cellPadding: { top: 3, right: 6, bottom: 3, left: 6 } } },
      { content: l2, styles: { fontStyle: "bold", cellPadding: { top: 3, right: 6, bottom: 3, left: 6 } } },
      { content: v2, styles: { cellPadding: { top: 3, right: 6, bottom: 3, left: 6 } } },
    ]),
    theme: "plain",
    styles: { fontSize: 7, cellWidth: "auto" },
    columnStyles: {
      0: { cellWidth: 32, fillColor: [242, 245, 249] },
      1: { cellWidth: 55 },
      2: { cellWidth: 32, fillColor: [242, 245, 249] },
      3: { cellWidth: 55 },
    },
    margin: { left: 14, right: 14 },
    tableLineColor: [221, 228, 236],
    tableLineWidth: 0.5,
  });
  return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
}

function statBox(doc: jsPDF, startY: number, stats: { label: string; value: string | number; highlight?: boolean }[]) {
  const w = doc.internal.pageSize.getWidth();
  const boxW = (w - 28) / stats.length;
  const boxH = 22;

  stats.forEach((s, i) => {
    const x = 14 + i * boxW;
    const y = startY;

    if (s.highlight) {
      doc.setFillColor(...NAVY);
      doc.setTextColor(255, 255, 255);
    } else {
      doc.setFillColor(...LIGHT);
      doc.setTextColor(...NAVY);
    }
    doc.roundedRect(x, y, boxW - 2, boxH, 2, 2, "F");

    doc.setFontSize(15);
    doc.setFont("helvetica", "bold");
    doc.text(String(s.value), x + boxW / 2 - 1, y + 12, { align: "center" });

    doc.setFontSize(5.5);
    doc.setFont("helvetica", "bold");
    if (s.highlight) {
      doc.setTextColor(255, 255, 255);
    } else {
      doc.setTextColor(...GRAY);
    }
    doc.text(s.label.toUpperCase(), x + boxW / 2 - 1, y + boxH - 4, { align: "center" });
  });

  return startY + boxH + 12;
}

function sectionHeading(doc: jsPDF, y: number, text: string) {
  const w = doc.internal.pageSize.getWidth();
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...NAVY);
  doc.setDrawColor(221, 228, 236);
  doc.setLineWidth(0.5);
  doc.text(text.toUpperCase(), 14, y);
  doc.line(14, y + 2, w - 14, y + 2);
  return y + 10;
}

function actionBadgeClass(action: string): [number, number, number, number, number, number] {
  const map: Record<string, [number, number, number, number, number, number]> = {
    create: [209, 250, 229, 6, 95, 70],
    update: [219, 234, 254, 29, 64, 216],
    delete: [254, 226, 226, 153, 27, 27],
    approve: [209, 250, 229, 6, 95, 70],
    reject: [254, 226, 226, 153, 27, 27],
    return: [254, 243, 199, 146, 64, 14],
    login: [237, 233, 254, 91, 33, 182],
    logout: [243, 244, 246, 75, 85, 99],
    export: [209, 250, 229, 6, 95, 70],
    import: [209, 250, 229, 6, 95, 70],
    damage_report: [254, 226, 226, 153, 27, 27],
  };
  return map[action] || [243, 244, 246, 85, 85, 85];
}

function certificationBlock(doc: jsPDF, y: number) {
  const w = doc.internal.pageSize.getWidth();
  const blockX = 14;
  const blockW = w - 28;
  const blockH = 24;

  doc.setDrawColor(221, 228, 236);
  doc.setFillColor(...LIGHT);
  doc.roundedRect(blockX, y, blockW, blockH, 2, 2, "FD");

  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...NAVY);
  doc.text("CERTIFICATION", blockX + 6, y + 8);

  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(85, 85, 85);
  const certText = `This certifies that the foregoing records were extracted from the ECP Laboratory Inventory Management System on ${new Date().toLocaleDateString("en-PH", { day: "2-digit", month: "long", year: "numeric" })} at ${new Date().toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })} PHT, and accurately reflect system activity for the period stated. Issued for audit and administrative purposes.`;
  const certLines = doc.splitTextToSize(certText, blockW - 14);
  (certLines as string[]).forEach((line: string, i: number) => {
    doc.text(line, blockX + 6, y + 14 + i * 4);
  });

  return y + blockH + 10;
}

function signatureBlock(doc: jsPDF, y: number, preparedBy: string) {
  const w = doc.internal.pageSize.getWidth();
  const cellW = (w - 28) / 3;

  const signatories = [
    { name: preparedBy, role: "Report Requestor" },
    { name: "Laboratory In-Charge", role: "ECP Laboratory Division" },
    { name: "Records Officer", role: "Audit & Compliance Unit" },
  ];

  signatories.forEach((sig, i) => {
    const x = 14 + i * cellW;
    doc.setDrawColor(...NAVY);
    doc.setLineWidth(0.3);
    doc.line(x + 10, y + 16, x + cellW - 10, y + 16);

    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...NAVY);
    doc.text(sig.name, x + cellW / 2, y + 22, { align: "center" });

    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GRAY);
    doc.text(sig.role, x + cellW / 2, y + 26, { align: "center" });
  });

  return y + 32;
}

function footer(doc: jsPDF, docNo: string) {
  const w = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  doc.setDrawColor(221, 228, 236);
  doc.setLineWidth(0.5);
  doc.line(14, pageH - 14, w - 14, pageH - 14);

  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(187, 187, 187);
  const year = new Date().getFullYear();
  doc.text(`ECP Laboratory IMS — ${year}`, 14, pageH - 8);
  doc.text("System-generated document. Does not require manual signature unless indicated.", w / 2, pageH - 8, { align: "center" });
  doc.text(`Doc. No.: ${docNo}`, w - 14, pageH - 8, { align: "right" });
}

export function generateMonthlyReport(data: MonthlyReportData) {
  const doc = new jsPDF();
  const today = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  const docNo = `ECP-${today}-${String(Math.floor(Math.random() * 999)).padStart(3, "0")}`;

  navyHeader(doc, "Monthly Activity Report", `${data.month} ${data.year} — ECP Laboratory Management System`, docNo);

  let y = 47;

  y = metaInfoTable(doc, y, [
    ["Report Period", `${data.month} ${data.year}`, "Prepared By", "System Administrator — Admin"],
    ["Data Source", "Supabase PostgreSQL — ECP Lab IMS", "Generated On", `${new Date().toLocaleDateString("en-PH", { day: "2-digit", month: "short", year: "numeric" })} at ${new Date().toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })} PHT`],
  ]);

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  const stats = [
    { label: "Total Borrows", value: data.stats.totalBorrows, highlight: true },
    { label: "Returns", value: data.stats.totalReturns },
    { label: "Borrowed", value: data.stats.totalBorrowed },
    { label: "Approved", value: data.stats.totalApproved },
    { label: "Pending", value: data.stats.totalPending },
  ];
  y = statBox(doc, y, stats);

  y = sectionHeading(doc, y, "Equipment Status");
  autoTable(doc, {
    startY: y,
    head: [["Status", "Count"]],
    body: data.equipmentSummary.map((e) => [e.label, String(e.count)]),
    theme: "striped",
    headStyles: { fillColor: NAVY, textColor: [255, 255, 255] },
    margin: { left: 14, right: 14 },
    styles: { fontSize: 8 },
    columnStyles: { 0: { fontStyle: "bold" } },
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  if (data.recentBorrows.length > 0) {
    y = sectionHeading(doc, y, "Recent Borrow Requests");
    autoTable(doc, {
      startY: y,
      head: [["ID", "User", "Purpose", "Status", "Borrow Date", "Return Date"]],
      body: data.recentBorrows.map((b) => [
        b.requestId,
        b.user,
        b.purpose.length > 30 ? b.purpose.slice(0, 30) + "…" : b.purpose,
        b.status,
        b.borrowDate,
        b.returnDate,
      ]),
      theme: "striped",
      headStyles: { fillColor: NAVY, textColor: [255, 255, 255] },
      margin: { left: 14, right: 14 },
      styles: { fontSize: 7 },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 22 },
        1: { cellWidth: 28 },
        2: { cellWidth: 40 },
        3: { cellWidth: 18 },
        4: { cellWidth: 22 },
        5: { cellWidth: 22 },
      },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  y = certificationBlock(doc, y);
  y = signatureBlock(doc, y, "System Administrator");
  footer(doc, docNo);

  doc.save(`ECP_Lab_Report_${data.month}_${data.year}.pdf`);
}

interface DamageReportPDF {
  reportTitle: string;
  periodStart: string | null;
  periodEnd: string | null;
  generatedBy: string;
  stats: { total: number; pending: number; replaced: number; partial?: number };
  rows: {
    date: string;
    borrower: string;
    equipment: string;
    qty: number;
    assessedBy: string;
    status: string;
  }[];
}

export function generateDamageReport(data: DamageReportPDF) {
  const doc = new jsPDF("portrait", "pt", "a4");
  const w = doc.internal.pageSize.getWidth();

  const labelX = 40;
  const valueX = 160;
  let y = 60;

  // Organization header
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("ECP", w / 2, y, { align: "center" });
  y += 20;
  doc.setFontSize(13);
  doc.text("LABORATORY INVENTORY", w / 2, y, { align: "center" });

  // Report title
  y += 44;
  doc.setFontSize(14);
  doc.text(data.reportTitle, w / 2, y, { align: "center" });
  y += 34;

  // Meta lines
  const metaLine = (label: string, value: string, yy: number) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(label, labelX, yy);
    doc.setFont("helvetica", "normal");
    doc.text(value, valueX, yy);
    return yy + 17;
  };

  doc.setFontSize(10);
  y = metaLine(
    "Report Period:",
    data.periodStart && data.periodEnd ? `${data.periodStart} - ${data.periodEnd}` : "-",
    y
  );
  y = metaLine("Generated On:", data.periodStart ? new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }), y);
  y = metaLine("Generated By:", data.generatedBy || "System", y);

  y += 12;

  // SUMMARY
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("SUMMARY", labelX, y);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(labelX, y + 3, w - labelX, y + 3);
  y += 20;

  const summaryLine = (label: string, value: string | number, yy: number) => {
    doc.setFont("helvetica", "bold");
    doc.text(label, labelX, yy);
    doc.setFont("helvetica", "normal");
    doc.text(String(value), valueX, yy);
    return yy + 17;
  };

  y = summaryLine("Total Damage Reports:", data.stats.total, y);
  y = summaryLine("Pending Replacements:", data.stats.pending, y);
  if (data.stats.partial !== undefined) {
    y = summaryLine("Partial Replacements:", data.stats.partial, y);
  }
  y = summaryLine("Replaced:", data.stats.replaced, y);

  y += 12;

  // DAMAGED REPORT DETAILS
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("DAMAGED REPORT DETAILS", labelX, y);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(labelX, y + 3, w - labelX, y + 3);
  y += 12;

  autoTable(doc, {
    startY: y,
    head: [["DATE", "BORROWER", "DAMAGED EQUIPMENT", "QTY", "ASSESSED BY", "STATUS"]],
    body: data.rows.map((r) => [r.date, r.borrower, r.equipment, String(r.qty), r.assessedBy, r.status]),
    theme: "grid",
    headStyles: { fillColor: [235, 240, 246], textColor: [0, 0, 0], fontStyle: "bold", lineColor: [0, 0, 0], lineWidth: 0.5, halign: "left" },
    styles: { fontSize: 8, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.5, cellPadding: { top: 4, right: 5, bottom: 4, left: 5 } },
    columnStyles: {
      0: { cellWidth: 78, fontStyle: "bold" },
      1: { cellWidth: 95 },
      2: { cellWidth: 130 },
      3: { cellWidth: 40, halign: "center" },
      4: { cellWidth: 80 },
      5: { cellWidth: "auto" },
    },
    margin: { left: labelX, right: 40 },
  });

  const slug = (data.reportTitle || "Damage_Report").replace(/[^a-zA-Z0-9]+/g, "_");
  doc.save(`ECP_Lab_${slug}.pdf`);
}

export function generateActivityLogPDF(logs: ActivityLog[], title: string) {
  const doc = new jsPDF("landscape");
  const today = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  const docNo = `ECP-${today}-${String(Math.floor(Math.random() * 999)).padStart(3, "0")}`;

  navyHeader(doc, "Activity Logs Report", title.replace("Activity Logs", "System Audit Trail — All Records"), docNo);

  let y = 47;

  y = metaInfoTable(doc, y, [
    ["Date Range", title.replace("Activity Logs", "").trim() || "All Available Records", "Prepared By", "System Administrator — Admin"],
    ["Data Source", "Supabase PostgreSQL — activity_logs", "Generated On", `${new Date().toLocaleDateString("en-PH", { day: "2-digit", month: "short", year: "numeric" })} at ${new Date().toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })} PHT`],
  ]);

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  const stats = [
    { label: "Total Logs", value: logs.length, highlight: true },
    { label: "Creates", value: logs.filter((l) => l.action === "create").length },
    { label: "Updates", value: logs.filter((l) => l.action === "update").length },
    { label: "Deletes", value: logs.filter((l) => l.action === "delete").length },
  ];
  y = statBox(doc, y, stats);

  y = sectionHeading(doc, y, "Detailed Activity Records");

  const groupedByDate = new Map<string, ActivityLog[]>();
  logs.forEach((log) => {
    const date = new Date(log.createdAt).toLocaleDateString("en-PH", { day: "2-digit", month: "short", year: "numeric" });
    if (!groupedByDate.has(date)) groupedByDate.set(date, []);
    groupedByDate.get(date)!.push(log);
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body: any[][] = [];
  let rowNum = 1;

  groupedByDate.forEach((dayLogs, date) => {
    body.push([
      { content: `\u25BA ${date.toUpperCase()}`, colSpan: 7, styles: { fillColor: [237, 242, 249], textColor: NAVY, fontStyle: "bold", fontSize: 7, cellPadding: { top: 2, right: 4, bottom: 2, left: 4 } } },
    ]);

    dayLogs.forEach((log) => {
      const ts = new Date(log.createdAt);
      const [bgR, bgG, bgB, fgR, fgG, fgB] = actionBadgeClass(log.action);
      body.push([
        String(rowNum++),
        ts.toLocaleDateString("en-PH", { day: "2-digit", month: "short" }),
        ts.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" }),
        log.userName,
        log.entityType || "—",
        {
          content: log.action.toUpperCase(),
          styles: { fillColor: [bgR, bgG, bgB], textColor: [fgR, fgG, fgB], fontStyle: "bold" },
        },
        (log.details ? JSON.stringify(log.details) : "—").slice(0, 80),
      ]);
    });
  });

  autoTable(doc, {
    startY: y,
    head: [["#", "Date", "Time", "User", "Entity", "Action", "Details"]],
    body: body as unknown as (string | number)[][],
    theme: "plain",
    headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontSize: 7, fontStyle: "bold" },
    styles: { fontSize: 6.5, cellPadding: { top: 2, right: 4, bottom: 2, left: 4 } },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 22 },
      2: { cellWidth: 18 },
      3: { cellWidth: 35 },
      4: { cellWidth: 22 },
      5: { cellWidth: 22, halign: "center" },
      6: { cellWidth: "auto" },
    },
    margin: { left: 14, right: 14 },
    alternateRowStyles: { fillColor: [246, 249, 253] },
    didDrawPage: () => {
      footer(doc, docNo);
    },
  });

  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalRow: any = [
    { content: `Total Records: ${logs.length}  \u2022  Generated: ${new Date().toLocaleDateString("en-PH", { day: "2-digit", month: "short", year: "numeric" })} ${new Date().toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })} PHT  \u2022  Ref: ${docNo}`, colSpan: 7, styles: { fillColor: [240, 244, 250], textColor: NAVY, fontStyle: "bold", fontSize: 7, halign: "right", cellPadding: { top: 3, right: 6, bottom: 3, left: 6 } } },
  ];
  autoTable(doc, {
    startY: finalY,
    body: totalRow,
    theme: "plain",
    margin: { left: 14, right: 14 },
    tableLineWidth: 0,
  });

  const afterTotal = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4;
  const certY = certificationBlock(doc, afterTotal);
  signatureBlock(doc, certY, "System Administrator");
  footer(doc, docNo);

  doc.save(`ECP_Lab_Activity_Logs_${new Date().toISOString().slice(0, 10)}.pdf`);
}
