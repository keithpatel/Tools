"use client";

import { useState } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { Button } from "@/components/ui/Button";

function syllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, "");
  if (word.length <= 3) return 1;
  const m = word.replace(/(?:[^laeiouy]|ed|es|[^laeiouy]e)$/, "").match(/[aeiouy]{1,2}/g);
  return Math.max(1, m ? m.length : 1);
}

export default function ReadabilityAnalyzer() {
  const [text, setText] = useState("");
  const [stats, setStats] = useState<null | { words: number; sentences: number; syll: number; flesch: number; grade: number; minutes: string }>(null);

  const analyze = () => {
    const words = (text.match(/\S+/g) || []).length;
    const sentences = (text.match(/[.!?]+/g) || []).length || 1;
    const wordList = text.match(/[A-Za-z']+/g) || [];
    const syll = wordList.reduce((a, w) => a + syllables(w), 0);
    const wps = words / sentences;
    const spw = words ? syll / words : 0;
    const flesch = 206.835 - 1.015 * wps - 84.6 * spw;
    const grade = 0.39 * wps + 11.8 * spw - 15.59;
    setStats({ words, sentences, syll, flesch: Math.round(flesch * 10) / 10, grade: Math.round(grade * 10) / 10, minutes: `${Math.max(1, Math.ceil(words / 200))} min` });
  };

  return (
    <ToolLayout title="" description="">
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={8} placeholder="Paste your text here..." className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
      <Button className="mt-3" onClick={analyze}>Analyze</Button>
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
          {[["Words", stats.words], ["Sentences", stats.sentences], ["Syllables", stats.syll], ["Flesch score", stats.flesch], ["Grade level", stats.grade], ["Reading time", stats.minutes]].map(([k, v]) => (
            <div key={k as string} className="p-3 bg-surface-hover rounded-lg"><p className="text-[11px] text-text-secondary">{k}</p><p className="font-semibold">{v}</p></div>
          ))}
          <p className="col-span-full text-xs text-text-secondary">Flesch 90-100 = very easy, 60-70 = standard, 0-30 = very hard.</p>
        </div>
      )}
    </ToolLayout>
  );
}
