"use client";

import { useState, useEffect } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { Button } from "@/components/ui/Button";

export default function TextToSpeech() {
  const [text, setText] = useState("");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceURI, setVoiceURI] = useState("");
  const [rate, setRate] = useState(1);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    const load = () => {
      const v = speechSynthesis.getVoices();
      setVoices(v);
      if (v.length && !voiceURI) setVoiceURI(v[0].voiceURI);
    };
    load();
    speechSynthesis.onvoiceschanged = load;
    return () => { speechSynthesis.cancel(); };
  }, [voiceURI]);

  const speak = () => {
    if (!text.trim()) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const v = voices.find((x) => x.voiceURI === voiceURI);
    if (v) u.voice = v;
    u.rate = rate;
    u.onend = () => setSpeaking(false);
    setSpeaking(true);
    speechSynthesis.speak(u);
  };

  return (
    <ToolLayout title="" description="">
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={6} placeholder="Type or paste text to read aloud..." className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
      <div className="grid sm:grid-cols-2 gap-3 mt-3">
        <label className="text-sm">Voice
          <select value={voiceURI} onChange={(e) => setVoiceURI(e.target.value)} className="mt-1 w-full px-3 py-2 border border-border rounded-lg bg-surface text-sm min-h-[44px]">
            {voices.map((v) => <option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</option>)}
          </select>
        </label>
        <label className="text-sm">Speed: {rate}x
          <input type="range" min={0.5} max={2} step={0.1} value={rate} onChange={(e) => setRate(Number(e.target.value))} className="w-full mt-2" />
        </label>
      </div>
      <div className="flex gap-2 mt-3">
        <Button onClick={speak}>{speaking ? "Restart" : "Speak"}</Button>
        <Button variant="secondary" onClick={() => { speechSynthesis.cancel(); setSpeaking(false); }}>Stop</Button>
        {text && <Button variant="secondary" onClick={() => navigator.clipboard.writeText(text)}>Copy text</Button>}
      </div>
      <p className="text-[11px] text-text-secondary mt-2">{text.split(/\s+/).filter(Boolean).length} words · uses your device voices, nothing uploaded.</p>
    </ToolLayout>
  );
}
