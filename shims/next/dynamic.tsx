import React, { lazy, Suspense } from "react";

export default function dynamic(importFn: () => Promise<any>, opts: any = {}) {
  const LazyComponent = lazy(async () => {
    const mod = await importFn();
    return "default" in mod ? mod : { default: mod };
  });
  return (props: any) => (
    <Suspense fallback={opts.loading?.() || null}>
      <LazyComponent {...props} />
    </Suspense>
  );
}
