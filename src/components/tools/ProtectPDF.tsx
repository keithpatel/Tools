"use client";

import { useState, useCallback, useId } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { DropZone } from "@/components/DropZone";
import { ResultPanel } from "@/components/ResultPanel";
import { useWorkflowStore } from "@/lib/useWorkflowStore";
import { protectPDF } from "@/lib/pdfEncrypt";
import { Lock, Eye, EyeOff, ShieldCheck, Check, AlertCircle, FileText } from "lucide-react";

export default function ProtectPDF() {
  const [file, setFile] = useState<File | null>(null);
  const [userPassword, setUserPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [allowPrinting, setAllowPrinting] = useState(true);
  const [allowCopying, setAllowCopying] = useState(false);
  const [allowModifying, setAllowModifying] = useState(false);
  const [protecting, setProtecting] = useState(false);
  const [error, setError] = useState("");
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultUrl, setResultUrl] = useState("");
  const { sendOutput } = useWorkflowStore();

  const printId = useId();
  const copyId = useId();
  const modifyId = useId();

  const onFiles = useCallback((incoming: File[]) => {
    const f = incoming[0];
    if (f) {
      setFile(f);
      setResultBlob(null);
      setResultUrl("");
      setError("");
    }
  }, []);

  // Password strength calculation
  const getStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: "None", color: "bg-border" };
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 10) score++;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 1) return { score: 1, label: "Weak", color: "bg-error-soft0" };
    if (score === 2) return { score: 2, label: "Fair", color: "bg-warning-soft0" };
    if (score === 3) return { score: 3, label: "Good", color: "bg-info-soft0" };
    return { score: 4, label: "Strong", color: "bg-success" };
  };

  const strength = getStrength(userPassword);
  const passwordsMatch = userPassword.length > 0 && userPassword === confirmPassword;

  const handleProtect = async () => {
    if (!file) return;
    if (!userPassword) {
      setError("Please enter a password to protect your PDF.");
      return;
    }
    if (userPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setProtecting(true);
    setError("");

    try {
      const buffer = await file.arrayBuffer();
      const encryptedBytes = await protectPDF(new Uint8Array(buffer), {
        userPassword,
        allowPrinting,
        allowCopying,
        allowModifying,
      });

      const blob = new Blob([encryptedBytes as BlobPart], { type: "application/pdf" });
      const filename = file.name.replace(/\.pdf$/i, "") + "_protected.pdf";
      setResultBlob(blob);
      setResultUrl(URL.createObjectURL(blob));

      sendOutput({
        type: "pdf",
        data: blob,
        filename,
        sourceToolSlug: "protect-pdf",
        createdAt: Date.now(),
      });
    } catch (err: any) {
      setError(err?.message || "Failed to protect PDF. The file may be corrupt or already encrypted.");
    } finally {
      setProtecting(false);
    }
  };

  const download = () => {
    if (!resultUrl || !file) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = file.name.replace(/\.pdf$/i, "") + "_protected.pdf";
    a.click();
  };

  const reset = () => {
    setFile(null);
    setUserPassword("");
    setConfirmPassword("");
    setResultBlob(null);
    setResultUrl("");
    setError("");
  };

  return (
    <ToolLayout title="" description="">
      {!file ? (
        <DropZone
          onFiles={onFiles}
          accept=".pdf"
          multiple={false}
          label="Drop your PDF here or click to browse"
        />
      ) : (
        <div className="space-y-6">
          {/* File summary */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-border-soft bg-surface">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-accent" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{file.name}</div>
                <div className="text-xs text-text-secondary">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>
            </div>
            <button
              onClick={reset}
              className="text-xs text-text-secondary hover:text-error transition-colors px-2 py-1"
            >
              Change file
            </button>
          </div>

          {!resultBlob && (
            <div className="p-6 rounded-2xl border border-border-soft bg-surface space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b border-border-soft">
                <ShieldCheck className="w-5 h-5 text-accent" />
                <h3 className="text-sm font-heading font-semibold">Security Settings</h3>
              </div>

              {/* Password inputs */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1.5">
                    Open Password <span className="text-error-text">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={userPassword}
                      onChange={(e) => setUserPassword(e.target.value)}
                      placeholder="Enter strong password"
                      className="w-full pr-10 pl-3 py-2 text-sm rounded-lg border border-border-soft bg-surface-raised text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/25"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {/* Strength Meter */}
                  {userPassword && (
                    <div className="mt-2 space-y-1">
                      <div className="flex gap-1 h-1.5 w-full bg-surface-hover rounded-full overflow-hidden">
                        {[1, 2, 3, 4].map((level) => (
                          <div
                            key={level}
                            className={`flex-1 transition-all duration-300 ${
                              strength.score >= level ? strength.color : "bg-transparent"
                            }`}
                          />
                        ))}
                      </div>
                      <div className="text-[11px] text-text-secondary flex justify-between">
                        <span>Strength: {strength.label}</span>
                        {strength.score < 3 && <span>Use 8+ chars, numbers & symbols</span>}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1.5">
                    Confirm Password <span className="text-error-text">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      className="w-full pr-10 pl-3 py-2 text-sm rounded-lg border border-border-soft bg-surface-raised text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/25"
                    />
                    {confirmPassword && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {passwordsMatch ? (
                          <Check className="w-4 h-4 text-success" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-error-text" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Permissions */}
              <div className="space-y-3 pt-2">
                <span className="text-xs font-medium text-text-primary block">Document Permissions</span>
                <div className="space-y-2">
                  <label htmlFor={printId} className="flex items-center gap-2.5 text-xs text-text-secondary cursor-pointer">
                    <input
                      id={printId}
                      type="checkbox"
                      checked={allowPrinting}
                      onChange={(e) => setAllowPrinting(e.target.checked)}
                      className="rounded border-border-soft text-accent focus:ring-accent/25"
                    />
                    <span>Allow recipient to print document</span>
                  </label>
                  <label htmlFor={copyId} className="flex items-center gap-2.5 text-xs text-text-secondary cursor-pointer">
                    <input
                      id={copyId}
                      type="checkbox"
                      checked={allowCopying}
                      onChange={(e) => setAllowCopying(e.target.checked)}
                      className="rounded border-border-soft text-accent focus:ring-accent/25"
                    />
                    <span>Allow recipient to copy text and graphics</span>
                  </label>
                  <label htmlFor={modifyId} className="flex items-center gap-2.5 text-xs text-text-secondary cursor-pointer">
                    <input
                      id={modifyId}
                      type="checkbox"
                      checked={allowModifying}
                      onChange={(e) => setAllowModifying(e.target.checked)}
                      className="rounded border-border-soft text-accent focus:ring-accent/25"
                    />
                    <span>Allow recipient to modify or edit content</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          <ResultPanel
            loading={protecting}
            loadingLabel="Encrypting & Protecting PDF..."
            error={error}
            onAction={!resultBlob && passwordsMatch ? handleProtect : undefined}
            actionLabel="Protect PDF"
            onDownload={resultBlob ? download : undefined}
            downloadLabel="Download Protected PDF"
            onReset={resultBlob ? reset : undefined}
            resetLabel="Protect Another PDF"
            sourceToolSlug="protect-pdf"
            outputType="pdf"
          >
            {resultBlob && (
              <div className="text-center py-4 space-y-2">
                <div className="w-12 h-12 rounded-full bg-success-soft text-success flex items-center justify-center mx-auto">
                  <Lock className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-heading font-semibold text-text-primary">
                  PDF Successfully Protected!
                </h4>
                <p className="text-xs text-text-secondary max-w-sm mx-auto">
                  Your PDF is now encrypted with standard 128-bit security. Anyone opening this file will be prompted for your password.
                </p>
              </div>
            )}
          </ResultPanel>
        </div>
      )}
    </ToolLayout>
  );
}
