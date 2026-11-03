import React, { lazy, Suspense, useEffect, useState } from "react";

// next/dynamic for React Router. With { ssr: false } the component never renders on the server (and not on the
// first client render, so hydration matches); the loading fallback shows there instead. Some client-only
// packages (gx-editor imports .css) crash Node if they load during server rendering.
export default function dynamic(importFn: () => Promise<any>, opts: any = {}) {
  const LazyComponent = lazy(async () => {
    const mod = await importFn();
    return "default" in mod ? mod : { default: mod };
  });
  const fallback = (props: any) => opts.loading?.(props) || null;
  if (opts.ssr === false) {
    return function ClientOnly(props: any) {
      const [mounted, setMounted] = useState(false);
      useEffect(() => setMounted(true), []);
      if (!mounted) return fallback(props);
      return (
        <Suspense fallback={fallback(props)}>
          <LazyComponent {...props} />
        </Suspense>
      );
    };
  }
  return (props: any) => (
    <Suspense fallback={fallback(props)}>
      <LazyComponent {...props} />
    </Suspense>
  );
}
