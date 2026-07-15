import { Shield, Globe, Zap, Lock } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-heading font-bold mb-4">About MultiTool</h1>
      <p className="text-text-secondary text-base leading-relaxed mb-8">
        MultiTool is a collection of 50 free, privacy-first online tools that run entirely in your browser.
        We believe you shouldn&apos;t have to upload your files to some unknown server just to resize an image or merge a PDF.
      </p>

      <div className="grid sm:grid-cols-2 gap-4 mb-10">
        {[
          { icon: Lock, title: "100% Private", desc: "All processing happens locally on your device. Files are never uploaded." },
          { icon: Zap, title: "Fast & Free", desc: "No sign-ups, no paywalls, no limits. Just tools that work instantly." },
          { icon: Globe, title: "Works Anywhere", desc: "Modern browser is all you need. No installs, no backend, no API keys." },
          { icon: Shield, title: "Open & Transparent", desc: "Built with open-source libraries. Your data stays yours." },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="p-4 rounded-xl border border-border-soft bg-surface">
            <Icon className="w-5 h-5 text-accent mb-2" />
            <h3 className="font-heading font-semibold text-sm mb-1">{title}</h3>
            <p className="text-xs text-text-secondary">{desc}</p>
          </div>
        ))}
      </div>

      <h2 className="text-xl font-heading font-semibold mb-3">How It Works</h2>
      <ol className="list-decimal list-inside space-y-2 text-sm text-text-secondary mb-8 leading-relaxed">
        <li>Pick a tool from the homepage</li>
        <li>Upload or paste your content</li>
        <li>Adjust settings if needed</li>
        <li>Download the result — it never left your device</li>
      </ol>

      <h2 className="text-xl font-heading font-semibold mb-3">Tech Stack</h2>
      <p className="text-sm text-text-secondary">
        Built with Next.js, Tailwind CSS, pdf-lib, PDF.js, browser-image-compression, Canvas API, and many other open-source libraries.
      </p>
    </div>
  );
}
