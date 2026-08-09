"use client";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export type ExportRow = Array<string | number | null | undefined>;

const safeFilename = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "export";
const download = (blob: Blob, filename: string) => {
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
const cell = (value: ExportRow[number]) => String(value ?? "—");
const pdfCell = (value: ExportRow[number]) => cell(value).replaceAll("₹", "Rs. ").replace(/[^\x20-\x7E]/g, "");

export function exportTable(format: "csv" | "excel" | "pdf", title: string, headers: string[], rows: ExportRow[]) {
  const filename = safeFilename(title);
  if (format === "csv") {
    const csv = [headers, ...rows].map(row => row.map(value => `"${cell(value).replaceAll('"', '""')}"`).join(",")).join("\n");
    download(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }), `${filename}.csv`);
    return;
  }
  if (format === "excel") {
    const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows.map(row => row.map(cell))]);
    sheet["!cols"] = headers.map((header, index) => ({ wch: Math.min(40, Math.max(header.length + 2, ...rows.map(row => cell(row[index]).length + 2))) }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Export");
    XLSX.writeFile(workbook, `${filename}.xlsx`, { compression: true });
    return;
  }
  const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  pdf.setFontSize(14);
  pdf.text(pdfCell(title), 40, 36);
  pdf.setFontSize(8);
  pdf.text(`Generated ${new Date().toLocaleString("en-IN")}`, 40, 51);
  autoTable(pdf, {
    head: [headers.map(pdfCell)], body: rows.map(row => row.map(pdfCell)), startY: 64,
    styles: { fontSize: 7, cellPadding: 4 }, headStyles: { fillColor: [234, 88, 12] },
  });
  pdf.save(`${filename}.pdf`);
}
