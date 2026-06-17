"use client";

import { useEffect, useRef } from "react";

/** Reddit post embed (r/Vit announcement). Renders the official blockquote and loads
 *  Reddit's widgets.js on mount, which transforms it into the embedded card. Matches
 *  the current light/dark theme. */
export default function GVRedditEmbed() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bq = ref.current?.querySelector(".reddit-embed-bq");
    if (bq && document.documentElement.classList.contains("dark")) {
      bq.setAttribute("data-embed-theme", "dark");
    }
    const s = document.createElement("script");
    s.src = "https://embed.reddit.com/widgets.js";
    s.async = true;
    s.charset = "UTF-8";
    ref.current?.appendChild(s);
    return () => {
      s.remove();
    };
  }, []);

  return (
    <div ref={ref} className="flex justify-center">
      <blockquote className="reddit-embed-bq" style={{ height: 316, width: "100%", maxWidth: 540 }} data-embed-height={706}>
        <a href="https://www.reddit.com/r/Vit/comments/1u7svod/gradevitian_is_back_new_secure_backend_6_years/">
          GradeVitian is BACK! 🚀 New secure backend, 6+ years online, and ready for your GPA calculations - 2026!
        </a>
        <br /> by{" "}
        <a href="https://www.reddit.com/user/Advanced-Copy4124/">u/Advanced-Copy4124</a> in{" "}
        <a href="https://www.reddit.com/r/Vit/">Vit</a>
      </blockquote>
    </div>
  );
}
