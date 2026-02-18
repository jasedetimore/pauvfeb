"use client";

import { useEffect, useMemo, useState } from "react";

/**
 * useImagePreloader - Preloads an array of image URLs and reports readiness.
 *
 * Returns `true` when ALL images have loaded (or errored), OR when the
 * `timeoutMs` deadline elapses — whichever comes first.
 *
 * When `urls` is empty the hook immediately returns `true`.
 *
 * The hook is designed so that when the URL list *changes* (e.g. from [] to
 * a real list after data fetches), readiness resets to `false` synchronously
 * on the same render, preventing a single-frame flash of unloaded content.
 */
export function useImagePreloader(
  urls: string[],
  timeoutMs: number = 3000
): boolean {
  // Stable, sorted key so the effect only reruns when the actual set of URLs changes
  const urlsKey = useMemo(
    () =>
      [...urls]
        .filter(Boolean)
        .sort()
        .join("|"),
    [urls]
  );

  // readyKey tracks which urlsKey has finished loading.
  // Initialized to a sentinel so static URL lists don't return true before
  // images actually load.  Empty urlsKey ("") is handled in the effect.
  const [readyKey, setReadyKey] = useState<string>("__initial__");

  useEffect(() => {
    const filtered = urls.filter(Boolean);

    // Nothing to preload — mark ready immediately
    if (filtered.length === 0) {
      setReadyKey(urlsKey);
      return;
    }

    let cancelled = false;

    // Timeout fallback — never block longer than timeoutMs
    const timer = setTimeout(() => {
      if (!cancelled) setReadyKey(urlsKey);
    }, timeoutMs);

    let loadedCount = 0;

    filtered.forEach((url) => {
      const img = new Image();
      const onDone = () => {
        loadedCount++;
        if (loadedCount >= filtered.length && !cancelled) {
          clearTimeout(timer);
          setReadyKey(urlsKey);
        }
      };
      img.onload = onDone;
      img.onerror = onDone; // count errors as "done" so we don't block forever
      img.src = url;
    });

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [urlsKey, timeoutMs, urls]);

  return urlsKey === readyKey;
}
