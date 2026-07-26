"use client";

import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export function exportToCsv(data: any[], filename: string) {
  const headers = Object.keys(data[0] || {});
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers.map((h) => JSON.stringify(row[h] ?? "")).join(",")
    ),
  ].join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
}

export function exportToExcel(data: any[], filename: string) {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportToPdf(data: any[], filename: string) {
  const doc = new jsPDF();
  doc.text(filename, 14, 16);
  const headers = Object.keys(data[0] || {}).map((h) => h.toUpperCase());
  const rows = data.map((row) =>
    Object.values(row).map((v) => String(v ?? ""))
  );
  autoTable(doc, { head: [headers], body: rows, startY: 22 });
  doc.save(`${filename}.pdf`);
}
