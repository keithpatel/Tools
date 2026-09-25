"use client";

import { useState } from "react";
import { Calendar } from "lucide-react";
import { ToolLayout } from "@/components/ToolLayout";

function msToString(ms: number): string {
  const abs = Math.abs(ms);
  const units: [string, number][] = [
    ["yr", 365.25 * 24 * 60 * 60 * 1000],
    ["mo", 30.4375 * 24 * 60 * 60 * 1000],
    ["day", 24 * 60 * 60 * 1000],
    ["hr", 60 * 60 * 1000],
    ["min", 60 * 1000],
    ["sec", 1000],
  ];
  let remaining = abs;
  const parts: string[] = [];
  for (const [label, divisor] of units) {
    const val = Math.floor(remaining / divisor);
    if (val > 0 || parts.length > 0) {
      parts.push(`${val} ${label}`);
      remaining -= val * divisor;
    }
  }
  return parts.join(", ") || "0 sec";
}

function getNextBirthday(dob: Date, now: Date): { days: number; date: Date } {
  const next = new Date(dob);
  next.setFullYear(now.getFullYear());
  if (next <= now) next.setFullYear(next.getFullYear() + 1);
  const diff = next.getTime() - now.getTime();
  return { days: Math.ceil(diff / (1000 * 60 * 60 * 24)), date: next };
}

export default function AgeCalculator() {
  const today = new Date().toISOString().split("T")[0];
  const [dob, setDob] = useState("2000-01-01");
  const [asOf, setAsOf] = useState(today);
  const [result, setResult] = useState<{ years: number; months: number; days: number; hours: number; minutes: number; seconds: number; totalMs: number } | null>(null);
  const [birthday, setBirthday] = useState<{ days: number; date: Date } | null>(null);

  const calculate = () => {
    const dobDate = new Date(dob);
    const asOfDate = new Date(asOf);
    if (isNaN(dobDate.getTime())) return;

    const diff = asOfDate.getTime() - dobDate.getTime();
    if (diff < 0) return;

    let years = asOfDate.getFullYear() - dobDate.getFullYear();
    let months = asOfDate.getMonth() - dobDate.getMonth();
    let days = asOfDate.getDate() - dobDate.getDate();
    if (days < 0) {
      months--;
      const prevMonth = new Date(asOfDate.getFullYear(), asOfDate.getMonth(), 0);
      days += prevMonth.getDate();
    }
    if (months < 0) {
      years--;
      months += 12;
    }

    const totalMs = diff;
    const hours = Math.floor(totalMs / (1000 * 60 * 60)) % 24;
    const minutes = Math.floor(totalMs / (1000 * 60)) % 60;
    const seconds = Math.floor(totalMs / 1000) % 60;

    setResult({ years, months, days, hours, minutes, seconds, totalMs });
    setBirthday(getNextBirthday(dobDate, asOfDate));
  };

  return (
    <ToolLayout
      title="Age Calculator"
      description="Calculate your exact age in years, months, days, hours, minutes, and seconds."
      faq={[
        { q: "How is age calculated?", a: "Age is computed by comparing the date of birth to the 'as of' date, accounting for month and day boundaries." },
        { q: "Does it account for leap years?", a: "Yes, the next birthday countdown accounts for leap years automatically." },
      ]}
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Date of Birth</label>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">As of Date</label>
            <input
              type="date"
              value={asOf}
              onChange={(e) => setAsOf(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>

        <button
          onClick={calculate}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-accent text-white rounded-lg hover:bg-accent-dark transition-colors font-medium"
        >
          <Calendar className="w-4 h-4" /> Calculate Age
        </button>

        {result && (
          <div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {[
                { label: "Years", value: result.years },
                { label: "Months", value: result.months },
                { label: "Days", value: result.days },
                { label: "Hours", value: result.hours },
                { label: "Minutes", value: result.minutes },
                { label: "Seconds", value: result.seconds },
              ].map(({ label, value }) => (
                <div key={label} className="bg-surface-hover checkerboard rounded-lg p-3 text-center">
                  <div className="text-xl sm:text-2xl font-bold">{value}</div>
                  <div className="text-xs text-text-secondary mt-0.5">{label}</div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-surface-hover checkerboard rounded-lg text-center">
              <div className="text-xs text-text-secondary">Total time alive</div>
              <div className="text-sm font-mono mt-1">{msToString(result.totalMs)}</div>
            </div>

            {birthday && (
              <div className="mt-3 p-3 bg-accent/10 border border-accent/20 rounded-lg text-center">
                <div className="text-xs text-text-secondary">Next Birthday</div>
                <div className="text-lg font-bold mt-1">{birthday.date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</div>
                <div className="text-sm text-accent font-medium mt-1">{birthday.days === 0 ? "Today!" : `in ${birthday.days} day${birthday.days === 1 ? "" : "s"}`}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
