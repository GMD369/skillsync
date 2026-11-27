"use client";

import { useCallback, useRef } from "react";

// Prevents duplicate submissions. Buttons are also disabled while a request runs, but that
// depends on React having re-rendered; this ref is set immediately, so a second call made while
// the first request is still running is always ignored (whatever triggered it).
// On the roadmap page it also stops two task updates from running in parallel, where the older
// response could arrive last and show stale progress.
//
//   const lock = useSubmitLock();
//   const handleSubmit = () => lock(async () => { ...await apiRequest(...) });
export function useSubmitLock() {
  const running = useRef(false);
  return useCallback(async (action) => {
    if (running.current) return undefined;
    running.current = true;
    try {
      return await action();
    } finally {
      running.current = false;
    }
  }, []);
}
