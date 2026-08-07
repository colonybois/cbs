"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import UploadMemoryModal from "@/components/admin/UploadMemoryModal";

export default function AdminGallery() { const [open, setOpen] = useState(false); return <div><div className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-3xl font-black text-slate-900">Festival gallery uploads</h1><p className="mt-2 text-slate-600">Upload past celebration memories directly to the live public flashback.</p></div><Button onClick={() => setOpen(true)}>+ Upload memory</Button></div><Card className="mt-7 border-dashed p-10 text-center"><div className="text-4xl">📸</div><h2 className="mt-3 font-bold text-slate-900">Build the Utsav Flashback</h2><p className="mt-2 text-sm text-slate-600">Images are stored in Firebase Storage under <b>flashback/</b> and become visible on the home page instantly.</p><Button onClick={() => setOpen(true)} className="mt-5">Upload a flashback image</Button></Card><UploadMemoryModal open={open} onClose={() => setOpen(false)} /></div>; }
