"use client";

import { useState } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { Button } from "@/components/ui/Button";

export default function DateCalculator() {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [out, setOut] = useState("");
  const [tzDate, setTzDate] = useState("");
  const [tz, setTz] = useState("UTC");
  const [tzOut, setTzOut] = useState("");

  const diff = () => {
    const d1 = new Date(a), d2 = new Date(b || new Date().toISOString());
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) { setOut("Enter valid dates."); return; }
    const ms = Math.abs(d2.getTime() - d1.getTime());
    const days = Math.floor(ms / 86400000);
    // business days
    let biz = 0;
    const start = new Date(Math.min(d1.getTime(), d2.getTime()));
    for (let i = 0; i <= days; i++) {
      const d = new Date(start.getTime() + i * 86400000).getDay();
      if (d !== 0 && d !== 6) biz++;
    }
    setOut(`${days} days (${(ms / 86400000).toFixed(1)}) · ~${Math.floor(days / 7)} weeks · ${biz} business days`);
  };

  const convertTz = () => {
    try {
      const d = tzDate ? new Date(tzDate) : new Date();
      setTzOut(new Intl.DateTimeFormat("en-US", { dateStyle: "full", timeStyle: "long", timeZone: tz }).format(d));
    } catch { setTzOut("Invalid timezone or date."); }
  };

  return (
    <ToolLayout title="" description="">
      <h3 className="font-semibold text-sm mb-2">Date difference</h3>
      <div className="flex flex-col sm:flex-row gap-2">
        <input type="date" value={a} onChange={(e) => setA(e.target.value)} className="flex-1 px-3 py-2 border border-border rounded-lg bg-surface text-sm min-h-[44px]" />
        <input type="date" value={b} onChange={(e) => setB(e.target.value)} className="flex-1 px-3 py-2 border border-border rounded-lg bg-surface text-sm min-h-[44px]" />
        <Button onClick={diff}>Calculate</Button>
      </div>
      {out && <p className="mt-2 text-sm font-medium">{out}</p>}
      <h3 className="font-semibold text-sm mt-6 mb-2">Timezone converter</h3>
      <div className="flex flex-col sm:flex-row gap-2">
        <input type="datetime-local" value={tzDate} onChange={(e) => setTzDate(e.target.value)} className="flex-1 px-3 py-2 border border-border rounded-lg bg-surface text-sm min-h-[44px]" />
        <select value={tz} onChange={(e) => setTz(e.target.value)} className="px-3 py-2 border border-border rounded-lg bg-surface text-sm min-h-[44px]">
          {["UTC", "America/New_York", "America/Chicago", "America/Los_Angeles", "Europe/London", "Europe/Paris", "Asia/Dubai", "Asia/Kolkata", "Asia/Singapore", "Asia/Tokyo", "Australia/Sydney"].map((z) => <option key={z}>{z}</option>)}
        </select>
        <Button variant="secondary" onClick={convertTz}>Convert</Button>
      </div>
      {tzOut && <p className="mt-2 text-sm font-medium">{tzOut}</p>}
    </ToolLayout>
  );
}
