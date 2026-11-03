import { useEffect, useState } from "react";
import { replaceParam } from "@/lib/collections";

// The big search box at the top of a list page (YC directory / Clay University). Typing filters the list below;
// the text is kept in ?q= so a search can be shared.
export default function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  useEffect(() => {
    const t = setTimeout(() => { if (text !== value) { onChange(text); replaceParam("q", text.trim()); } }, 200);
    return () => clearTimeout(t);
  }, [text, value, onChange]);
  return (
    <label className="search-box">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><line x1="16.5" y1="16.5" x2="21" y2="21" /></svg>
      <input type="search" value={text} onChange={e => setText(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
      {text && (
        <button type="button" aria-label="Clear search" onClick={() => { setText(""); onChange(""); replaceParam("q", ""); }}>×</button>
      )}
    </label>
  );
}
