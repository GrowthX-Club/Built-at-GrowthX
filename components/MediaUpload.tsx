import { useState, useRef, useCallback } from "react";
import { C, T } from "@/types";
import { gxApi } from "@/lib/api";

interface MediaFile {
  url: string;
  type: "image" | "loom";
  uploading?: boolean;
  progress?: string;
}

export type { MediaFile };

type FilesOrUpdater = MediaFile[] | ((prev: MediaFile[]) => MediaFile[]);

interface MediaUploadProps {
  value: MediaFile[];
  onChange: (files: FilesOrUpdater) => void;
  maxFiles?: number;
}

async function getUploadUrl(fileName: string, mimeType: string, contentLength: number) {
  const params = new URLSearchParams({
    file_name: fileName,
    access: "public",
    type: "product_media",
    mime_type: mimeType,
    content_length: String(contentLength),
  });
  const res = await gxApi(`/uploads/url?${params}`);
  if (!res.ok) throw new Error("Failed to get upload URL");
  const data = await res.json();
  return { uploadUrl: data.upload_url, retrievalUrl: data.retrieval_url };
}

async function uploadFile(file: File): Promise<string> {
  const { uploadUrl, retrievalUrl } = await getUploadUrl(file.name, file.type, file.size);
  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });
  if (!putRes.ok) throw new Error("Upload failed");
  return retrievalUrl;
}

export default function MediaUpload({ value, onChange, maxFiles = 5 }: MediaUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [loomInput, setLoomInput] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(async (files: FileList | File[]) => {
    setError("");
    const fileArray = Array.from(files);
    const imageFiles = fileArray.filter(f => f.type.startsWith("image/"));
    if (imageFiles.length === 0) {
      setError("Only image files are supported");
      return;
    }

    const remaining = maxFiles - value.filter(v => !v.uploading).length;
    if (remaining <= 0) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }
    const toUpload = imageFiles.slice(0, remaining);

    // Add placeholders
    const placeholders: MediaFile[] = toUpload.map(f => ({
      url: URL.createObjectURL(f),
      type: "image" as const,
      uploading: true,
      progress: f.name,
    }));
    const updated = [...value, ...placeholders];
    onChange(updated);

    // Upload each
    for (let i = 0; i < toUpload.length; i++) {
      try {
        const retrievalUrl = await uploadFile(toUpload[i]);
        onChange(prev => {
          const copy = [...prev];
          const idx = copy.findIndex(m => m.uploading && m.progress === toUpload[i].name);
          if (idx !== -1) {
            URL.revokeObjectURL(copy[idx].url);
            copy[idx] = { url: retrievalUrl, type: "image" };
          }
          return copy;
        });
      } catch {
        onChange(prev => prev.filter(m => !(m.uploading && m.progress === toUpload[i].name)));
        setError(`Failed to upload ${toUpload[i].name}`);
      }
    }
  }, [value, onChange, maxFiles]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const addLoom = () => {
    const url = loomInput.trim();
    if (!url) return;
    if (!/^https?:\/\/(www\.)?loom\.com\/(share|embed)\//.test(url)) {
      setError("Enter a valid Loom URL (loom.com/share/...)");
      return;
    }
    if (value.length >= maxFiles) {
      setError(`Maximum ${maxFiles} items allowed`);
      return;
    }
    setError("");
    onChange([...value, { url, type: "loom" }]);
    setLoomInput("");
  };

  const remove = (idx: number) => {
    const copy = [...value];
    if (copy[idx].uploading) URL.revokeObjectURL(copy[idx].url);
    copy.splice(idx, 1);
    onChange(copy);
  };

  return (
    <div>
      <label style={{
        display: "block", fontSize: T.bodySm, fontWeight: 600, color: C.text,
        fontFamily: "var(--sans)", marginBottom: 8,
      }}>
        Screenshots & Loom videos
      </label>

      {/* Thumbnails */}
      {value.length > 0 && (
        <div style={{
          display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10,
        }}>
          {value.map((m, i) => (
            <div key={i} style={{
              position: "relative", width: 88, height: 66, borderRadius: 8,
              overflow: "hidden", border: `1px solid ${C.border}`,
              background: C.surface,
            }}>
              {m.type === "image" ? (
                <img
                  src={m.url}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover", opacity: m.uploading ? 0.4 : 1 }}
                />
              ) : (
                <div style={{
                  width: "100%", height: "100%", display: "flex",
                  alignItems: "center", justifyContent: "center",
                  background: "#1a1a2e", color: "#fff",
                  fontSize: T.caption, fontFamily: "var(--sans)", fontWeight: 500,
                }}>
                  Loom
                </div>
              )}
              {m.uploading && (
                <div style={{
                  position: "absolute", inset: 0, display: "flex",
                  alignItems: "center", justifyContent: "center",
                }}>
                  <div style={{
                    width: 20, height: 20, border: "2px solid " + C.border,
                    borderTopColor: C.text, borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }} />
                </div>
              )}
              {!m.uploading && (
                <button
                  type="button"
                  onClick={() => remove(i)}
                  style={{
                    position: "absolute", top: 3, right: 3,
                    width: 20, height: 20, borderRadius: "50%",
                    background: "rgba(0,0,0,0.6)", color: "#fff",
                    border: "none", cursor: "pointer",
                    fontSize: 12, lineHeight: "20px", textAlign: "center",
                    padding: 0, display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        style={{
          border: `1.5px dashed ${dragOver ? C.text : C.border}`,
          borderRadius: 10, padding: "16px 20px",
          textAlign: "center", cursor: "pointer",
          background: dragOver ? C.accentSoft : C.surface,
          transition: "all 0.15s",
        }}
      >
        <div style={{
          fontSize: T.bodySm, color: C.textSec, fontFamily: "var(--sans)",
          fontWeight: 450,
        }}>
          Drop images here or <span style={{ color: C.text, fontWeight: 600, textDecoration: "underline" }}>browse</span>
        </div>
        <div style={{
          fontSize: T.caption, color: C.textMute, fontFamily: "var(--sans)", marginTop: 4,
        }}>
          PNG, JPG, WebP — max {maxFiles} files
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: "none" }}
        onChange={e => { if (e.target.files?.length) addFiles(e.target.files); e.target.value = ""; }}
      />

      {/* Loom URL input */}
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <input
          placeholder="Paste a Loom URL"
          value={loomInput}
          onChange={e => setLoomInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addLoom(); } }}
          style={{
            flex: 1, border: `1px solid ${C.border}`, borderRadius: 8,
            padding: "8px 12px", fontSize: T.label, color: C.text,
            background: C.surface, outline: "none", fontFamily: "var(--sans)",
          }}
        />
        <button
          type="button"
          onClick={addLoom}
          style={{
            padding: "8px 14px", borderRadius: 8,
            background: C.accent, color: C.accentFg,
            border: "none", cursor: "pointer",
            fontSize: T.label, fontFamily: "var(--sans)", fontWeight: 600,
          }}
        >
          Add
        </button>
      </div>

      {error && (
        <div style={{
          fontSize: T.caption, color: C.error, marginTop: 6, fontFamily: "var(--sans)",
        }}>
          {error}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
