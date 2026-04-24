"use client";

import { useEffect, useState } from "react";
import type { RefObject } from "react";

/**
 * Observes an element and returns a `frameloop` value suitable for
 * @react-three/fiber's Canvas: `"always"` when the element is at least
 * partially visible in the viewport AND the tab is foregrounded, otherwise
 * `"never"`. The 100px rootMargin arms the Canvas slightly before it enters
 * view so re-scroll doesn't expose an unrendered frame.
 *
 * Non-r3f Canvases (e.g. silk-waves uses raw three.js) can treat the return
 * value as a boolean pause signal.
 *
 * Observer attachment is deferred by MOUNT_SETTLE_MS so that on a SPA
 * navigation — where scrollY may still point at the previous page when the
 * new Canvas mounts, and RouteTransition's scroll-snap hasn't run yet — the
 * first callback doesn't arrive with isIntersecting=false and pause the
 * Canvas before its very first frame.
 */
const MOUNT_SETTLE_MS = 400;

export function useCanvasFrameloop(
  ref: RefObject<Element | null>,
): "always" | "never" {
  const [inView, setInView] = useState(true);
  const [pageHidden, setPageHidden] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    let io: IntersectionObserver | null = null;
    const settleTimer = window.setTimeout(() => {
      io = new IntersectionObserver(
        ([entry]) => setInView(entry.isIntersecting),
        { threshold: 0, rootMargin: "100px" },
      );
      io.observe(el);
    }, MOUNT_SETTLE_MS);

    return () => {
      window.clearTimeout(settleTimer);
      io?.disconnect();
    };
  }, [ref]);

  useEffect(() => {
    const onVis = () => setPageHidden(document.hidden);
    onVis();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  return inView && !pageHidden ? "always" : "never";
}
