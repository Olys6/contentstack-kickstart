"use client";

import { useEffect, useRef, useState } from "react";
import ContentstackLivePreview from "@contentstack/live-preview-utils";
import { initLivePreview, isPreview } from "@/lib/contentstack";

// Server-rendered entry in, live entry out. In preview mode this subscribes to
// Visual Builder edits and refetches on every change; otherwise it is a no-op.
export function useLiveEntry<T>(initial: T, refetch: () => Promise<T | undefined>): T {
  const [entry, setEntry] = useState(initial);
  const [lastInitial, setLastInitial] = useState(initial);
  const refetchRef = useRef(refetch);

  // A new server entry (navigation, language switch) replaces the live copy.
  if (initial !== lastInitial) {
    setLastInitial(initial);
    setEntry(initial);
  }

  useEffect(() => {
    refetchRef.current = refetch;
  });

  useEffect(() => {
    if (!isPreview) return;
    initLivePreview();
    const id = ContentstackLivePreview.onEntryChange(
      async () => {
        const next = await refetchRef.current();
        if (next) setEntry(next);
      },
      { skipInitialRender: true },
    );
    return () => {
      ContentstackLivePreview.unsubscribeOnEntryChange(id);
    };
  }, []);

  return entry;
}
