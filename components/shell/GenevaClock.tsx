"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useSite } from "./SiteProvider";

const ZONE = "Europe/Zurich";

// Wall-clock time in Geneva, whatever the visitor's own timezone.
const parts = new Intl.DateTimeFormat("en-GB", {
  timeZone: ZONE,
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function genevaTime(now: Date) {
  const p = Object.fromEntries(parts.formatToParts(now).map((x) => [x.type, x.value]));
  return { h: +p.hour, m: +p.minute, s: +p.second + now.getMilliseconds() / 1000 };
}

const TICKS = Array.from({ length: 12 }, (_, i) => i * 30);

/**
 * A small dial with a sweeping seconds hand, gliding like a mechanical
 * movement rather than ticking like quartz. Hands are moved directly on the
 * DOM each frame, so the clock never re-renders React.
 */
export default function GenevaClock() {
  const { settings } = useSite();
  const reducedMotion = useReducedMotion();
  const hour = useRef<SVGLineElement>(null);
  const minute = useRef<SVGLineElement>(null);
  const second = useRef<SVGLineElement>(null);
  const digits = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let raf = 0;
    let timer = 0;
    const draw = () => {
      const { h, m, s } = genevaTime(new Date());
      // Reduced motion: the seconds hand jumps once a second instead of gliding.
      const sec = reducedMotion ? Math.floor(s) : s;
      second.current?.setAttribute("transform", `rotate(${sec * 6} 20 20)`);
      minute.current?.setAttribute("transform", `rotate(${(m + s / 60) * 6} 20 20)`);
      hour.current?.setAttribute("transform", `rotate(${((h % 12) + m / 60) * 30} 20 20)`);
      if (digits.current) digits.current.textContent = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    };
    const loop = () => {
      draw();
      raf = requestAnimationFrame(loop);
    };
    if (reducedMotion) {
      draw();
      timer = window.setInterval(draw, 1000);
    } else {
      loop();
    }
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(timer);
    };
  }, [reducedMotion]);

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 40 40" className="size-10 shrink-0" aria-hidden>
        <circle cx="20" cy="20" r="19" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="0.75" />
        {TICKS.map((a) => (
          <line
            key={a}
            x1="20"
            y1={a % 90 === 0 ? 3.5 : 4}
            x2="20"
            y2={a % 90 === 0 ? 7 : 5.5}
            stroke="currentColor"
            strokeOpacity={a % 90 === 0 ? 0.7 : 0.35}
            strokeWidth={a % 90 === 0 ? 1 : 0.6}
            transform={`rotate(${a} 20 20)`}
          />
        ))}
        <line ref={hour} x1="20" y1="21.5" x2="20" y2="11.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <line ref={minute} x1="20" y1="22" x2="20" y2="6.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        <line ref={second} x1="20" y1="24" x2="20" y2="5" stroke="var(--color-gold)" strokeWidth="0.5" strokeLinecap="round" />
        <circle cx="20" cy="20" r="1.1" fill="var(--color-gold)" />
      </svg>
      <div className="leading-tight">
        <span className="text-label block text-ivory/45" {...settings.$?.clock_label}>
          {settings.clock_label}
        </span>
        <span ref={digits} className="font-display text-xl lining-nums tabular-nums text-ivory/80" suppressHydrationWarning>
          --:--
        </span>
      </div>
    </div>
  );
}
