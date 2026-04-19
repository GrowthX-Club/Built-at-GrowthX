import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { C, T, type ProofMedia } from "@/types";
import { gxApi } from "@/lib/api";

const MOCK_MODE = ((typeof import.meta !== "undefined" ? (import.meta as unknown as { env?: { VITE_MOCK_MODE?: string } }).env?.VITE_MOCK_MODE : undefined) === "true");

async function readAsDataUrl(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("Read failed"));
    r.readAsDataURL(file);
  });
}

async function uploadFile(file: File): Promise<string> {
  if (MOCK_MODE) return readAsDataUrl(file);
  const params = new URLSearchParams({
    file_name: file.name,
    access: "public",
    type: "product_media",
    mime_type: file.type,
    content_length: String(file.size),
  });
  const res = await gxApi(`/uploads/url?${params}`);
  if (!res.ok) throw new Error("Failed to get upload URL");
  const data = await res.json();
  const putRes = await fetch(data.upload_url, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });
  if (!putRes.ok) throw new Error("Upload failed");
  return data.retrieval_url;
}

interface ProofThumbnailProps {
  label?: string;
  hint?: string;
  value: ProofMedia | undefined;
  onChange: (next: ProofMedia | undefined) => void;
  required?: boolean;
  disabled?: boolean;
  slotId: string;
}

export default function ProofThumbnail({
  label,
  hint,
  value,
  onChange,
  required,
  disabled,
  slotId,
}: ProofThumbnailProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [zoomOpen, setZoomOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const displayUrl = value?.url || localPreview || null;
  const isReady = Boolean(value?.url) && !uploading;

  const pick = () => {
    if (disabled || uploading) return;
    fileRef.current?.click();
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Only images are supported.");
      return;
    }
    setError("");
    const preview = URL.createObjectURL(file);
    setLocalPreview(preview);
    setUploading(true);
    try {
      const url = await uploadFile(file);
      onChange({ url, uploadedAt: new Date().toISOString(), filename: file.name });
      URL.revokeObjectURL(preview);
      setLocalPreview(null);
    } catch {
      setError("Upload failed. Try again.");
      URL.revokeObjectURL(preview);
      setLocalPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const requestRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmOpen(true);
  };

  const confirmRemove = () => {
    onChange(undefined);
    setConfirmOpen(false);
    setZoomOpen(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {label && (
        <label style={{
          display: "block", fontSize: T.bodySm, fontWeight: 600, color: C.text,
          fontFamily: "var(--sans)", marginBottom: 8,
        }}>
          {label}
          {required && <span style={{ color: C.textMute, fontWeight: 400 }}> *</span>}
        </label>
      )}

      <div
        onClick={displayUrl && isReady ? () => setZoomOpen(true) : pick}
        style={{
          position: "relative",
          width: 180, height: 180,
          borderRadius: 12,
          border: displayUrl ? `1px solid ${C.border}` : `1.5px dashed ${C.border}`,
          background: displayUrl ? C.surface : C.surfaceWarm,
          cursor: disabled ? "not-allowed" : "pointer",
          overflow: "hidden",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.15s",
        }}
      >
        {displayUrl ? (
          <>
            <img
              src={displayUrl}
              alt={value?.filename || "Proof"}
              style={{
                width: "100%", height: "100%", objectFit: "cover",
                opacity: uploading ? 0.4 : 1,
                transition: "opacity 0.15s",
              }}
            />
            {uploading && (
              <div style={{
                position: "absolute", inset: 0, display: "flex",
                alignItems: "center", justifyContent: "center",
              }}>
                <div style={{
                  width: 28, height: 28, border: `2.5px solid ${C.border}`,
                  borderTopColor: C.text, borderRadius: "50%",
                  animation: "proof-spin 0.8s linear infinite",
                }} />
              </div>
            )}
            {!uploading && !disabled && (
              <button
                type="button"
                onClick={requestRemove}
                aria-label="Remove"
                style={{
                  position: "absolute", top: 8, right: 8,
                  width: 26, height: 26, borderRadius: "50%",
                  background: "rgba(0,0,0,0.65)", color: "#fff",
                  border: "none", cursor: "pointer",
                  fontSize: 14, lineHeight: "26px", textAlign: "center",
                  padding: 0, display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                {"\u00D7"}
              </button>
            )}
          </>
        ) : (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", gap: 8, padding: 16, textAlign: "center",
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: C.accentSoft, color: C.textSec,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, fontWeight: 400, fontFamily: "var(--sans)",
            }}>
              +
            </div>
            <div style={{
              fontSize: T.bodySm, fontWeight: 550, color: C.text,
              fontFamily: "var(--sans)",
            }}>
              Upload proof
            </div>
            {hint && (
              <div style={{
                fontSize: T.caption, color: C.textMute,
                fontFamily: "var(--sans)", lineHeight: 1.4,
                maxWidth: 200,
              }}>
                {hint}
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div style={{
          fontSize: T.caption, color: C.error, marginTop: 6,
          fontFamily: "var(--sans)",
        }}>
          {error}
        </div>
      )}

      <input
        ref={fileRef}
        id={slotId}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = "";
        }}
      />

      {zoomOpen && displayUrl && typeof document !== "undefined" && createPortal(
        <div
          onClick={() => setZoomOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 2000,
            background: "rgba(0,0,0,0.82)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 24, cursor: "zoom-out",
          }}
        >
          <img
            src={displayUrl}
            alt={value?.filename || "Proof"}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "min(92vw, 1200px)", maxHeight: "90vh",
              objectFit: "contain", borderRadius: 10,
              boxShadow: "0 20px 80px rgba(0,0,0,0.5)",
              cursor: "default",
            }}
          />
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setZoomOpen(false); }}
            aria-label="Close"
            style={{
              position: "absolute", top: 18, right: 18,
              width: 36, height: 36, borderRadius: "50%",
              background: "rgba(255,255,255,0.15)", color: "#fff",
              border: "none", cursor: "pointer",
              fontSize: 20, lineHeight: "36px",
              backdropFilter: "blur(6px)",
            }}
          >
            {"\u00D7"}
          </button>
        </div>,
        document.body,
      )}

      {confirmOpen && typeof document !== "undefined" && createPortal(
        <div
          onClick={() => setConfirmOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 2100,
            background: "rgba(0,0,0,0.45)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 24,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: C.surface, borderRadius: 16,
              border: `1px solid ${C.border}`,
              boxShadow: "0 24px 80px rgba(0,0,0,0.2)",
              padding: "24px 24px 20px",
              maxWidth: 380, width: "100%",
              fontFamily: "var(--sans)",
            }}
          >
            <div style={{
              fontSize: T.subtitle, fontWeight: 600, color: C.text,
              fontFamily: "var(--serif)", letterSpacing: "-0.01em",
              marginBottom: 6,
            }}>
              Remove this proof?
            </div>
            <div style={{
              fontSize: T.bodySm, color: C.textSec,
              lineHeight: 1.5, marginBottom: 20,
            }}>
              You&rsquo;ll need to upload it again if you change your mind.
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                style={{
                  padding: "9px 16px", borderRadius: 10,
                  border: `1px solid ${C.border}`, background: C.surface,
                  color: C.text, fontSize: T.bodySm, fontWeight: 550,
                  cursor: "pointer", fontFamily: "var(--sans)",
                }}
              >
                No, go back
              </button>
              <button
                type="button"
                onClick={confirmRemove}
                style={{
                  padding: "9px 16px", borderRadius: 10, border: "none",
                  background: C.error, color: "#fff",
                  fontSize: T.bodySm, fontWeight: 600,
                  cursor: "pointer", fontFamily: "var(--sans)",
                }}
              >
                Yes, delete
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}

      <style>{`@keyframes proof-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

interface ProofThumbnailGroupProps {
  label: string;
  hint?: string;
  value: ProofMedia[];
  onChange: (next: ProofMedia[]) => void;
  max?: number;
  minRequired?: number;
  disabled?: boolean;
  slotIdPrefix: string;
}

export function ProofThumbnailGroup({
  label,
  hint,
  value,
  onChange,
  max = 5,
  minRequired = 0,
  disabled,
  slotIdPrefix,
}: ProofThumbnailGroupProps) {
  const filled = value.length;
  const showTrailing = !disabled && filled < max;

  const setAt = (i: number, next: ProofMedia | undefined) => {
    if (next === undefined) {
      onChange(value.filter((_, idx) => idx !== i));
    } else {
      const copy = [...value];
      copy[i] = next;
      onChange(copy);
    }
  };

  const addNew = (next: ProofMedia | undefined) => {
    if (!next) return;
    onChange([...value, next]);
  };

  return (
    <div>
      <div style={{
        display: "flex", alignItems: "baseline", justifyContent: "space-between",
        marginBottom: 8, gap: 12,
      }}>
        <label style={{
          fontSize: T.bodySm, fontWeight: 600, color: C.text,
          fontFamily: "var(--sans)",
        }}>
          {label}
          {minRequired > 0 && <span style={{ color: C.textMute, fontWeight: 400 }}> *</span>}
        </label>
        <span style={{
          fontSize: T.caption, color: C.textMute, fontFamily: "var(--sans)",
        }}>
          {filled} / {max}
        </span>
      </div>
      {hint && (
        <div style={{
          fontSize: T.caption, color: C.textMute, fontFamily: "var(--sans)",
          marginBottom: 10, lineHeight: 1.5,
        }}>
          {hint}
        </div>
      )}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {value.map((proof, i) => (
          <ProofThumbnail
            key={`${slotIdPrefix}-${i}-${proof.url}`}
            slotId={`${slotIdPrefix}-${i}`}
            value={proof}
            onChange={(next) => setAt(i, next)}
            disabled={disabled}
          />
        ))}
        {showTrailing && (
          <ProofThumbnail
            key={`${slotIdPrefix}-new-${filled}`}
            slotId={`${slotIdPrefix}-new`}
            value={undefined}
            onChange={addNew}
            disabled={disabled}
          />
        )}
      </div>
    </div>
  );
}
