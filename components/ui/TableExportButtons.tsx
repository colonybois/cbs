"use client";

import { exportTable, type ExportRow } from "@/lib/table-export";

type Props = { title: string; headers: string[]; rows: ExportRow[]; className?: string };

export default function TableExportButtons({ title, headers, rows, className = "" }: Props) {
  return <div className={`flex flex-wrap items-center gap-2 ${className}`}>
    <span className="text-xs font-semibold text-slate-500">Download {rows.length} record{rows.length === 1 ? "" : "s"}:</span>
    <button type="button" onClick={() => exportTable("csv", title, headers, rows)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">CSV</button>
    <button type="button" onClick={() => exportTable("excel", title, headers, rows)} className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100">Excel</button>
    <button type="button" onClick={() => exportTable("pdf", title, headers, rows)} className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100">PDF</button>
  </div>;
}
