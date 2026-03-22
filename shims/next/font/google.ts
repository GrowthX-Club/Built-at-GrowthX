export default function googleFont(config: any) {
  return function font() {
    return {
      className: "",
      style: { fontFamily: config.family || config },
      variable: "",
    };
  };
}

// Named exports for specific fonts
export const Newsreader = (opts: any) => ({ className: "", style: { fontFamily: "'Newsreader', serif" }, variable: opts?.variable || "" });
export const DM_Sans = (opts: any) => ({ className: "", style: { fontFamily: "'DM Sans', sans-serif" }, variable: opts?.variable || "" });
export const DM_Mono = (opts: any) => ({ className: "", style: { fontFamily: "'DM Mono', monospace" }, variable: opts?.variable || "" });
