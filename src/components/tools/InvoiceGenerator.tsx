"use client";

import { useState } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { Button } from "@/components/ui/Button";

interface Row { desc: string; qty: number; price: number }

export default function InvoiceGenerator() {
  const [from, setFrom] = useState("Your Company");
  const [to, setTo] = useState("Client");
  const [num, setNum] = useState("INV-001");
  const [rows, setRows] = useState<Row[]>([{ desc: "Service", qty: 1, price: 100 }]);

  const total = rows.reduce((a, r) => a + r.qty * r.price, 0);
  const set = (i: number, k: keyof Row, v: string) => {
    const c = [...rows];
    c[i] = { ...c[i], [k]: k === "desc" ? v : Number(v) || 0 };
    setRows(c);
  };

  return (
    <ToolLayout title="" description="">
      <div className="grid sm:grid-cols-3 gap-2 mb-3">
        <input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="From" className="px-3 py-2 border border-border rounded-lg bg-surface text-sm" />
        <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="Bill to" className="px-3 py-2 border border-border rounded-lg bg-surface text-sm" />
        <input value={num} onChange={(e) => setNum(e.target.value)} placeholder="Invoice #" className="px-3 py-2 border border-border rounded-lg bg-surface text-sm" />
      </div>
      {rows.map((r, i) => (
        <div key={i} className="grid grid-cols-[1fr_64px_88px_32px] gap-2 mb-2">
          <input value={r.desc} onChange={(e) => set(i, "desc", e.target.value)} className="px-3 py-2 border border-border rounded-lg bg-surface text-sm" />
          <input type="number" value={r.qty} onChange={(e) => set(i, "qty", e.target.value)} className="px-2 py-2 border border-border rounded-lg bg-surface text-sm" />
          <input type="number" value={r.price} onChange={(e) => set(i, "price", e.target.value)} className="px-2 py-2 border border-border rounded-lg bg-surface text-sm" />
          <button onClick={() => setRows(rows.filter((_, j) => j !== i))} className="text-error-text text-lg">×</button>
        </div>
      ))}
      <div className="flex gap-2 mt-2">
        <Button variant="secondary" size="sm" onClick={() => setRows([...rows, { desc: "", qty: 1, price: 0 }])}>+ Add row</Button>
        <Button size="sm" onClick={() => window.print()}>Print / Save PDF</Button>
      </div>
      <div className="mt-4 p-5 bg-white text-black rounded-lg border">
        <div className="flex justify-between"><div><p className="font-bold">{from}</p><p className="text-xs">Bill to: {to}</p></div><p className="font-bold">{num}</p></div>
        <table className="w-full text-sm mt-3"><thead><tr className="border-b"><th className="text-left">Item</th><th>Qty</th><th className="text-right">Amount</th></tr></thead>
          <tbody>{rows.map((r, i) => <tr key={i} className="border-b"><td>{r.desc}</td><td className="text-center">{r.qty}</td><td className="text-right">{(r.qty * r.price).toFixed(2)}</td></tr>)}</tbody></table>
        <p className="text-right font-bold mt-2">Total: {total.toFixed(2)}</p>
      </div>
    </ToolLayout>
  );
}
