import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const title       = searchParams.get("title")       ?? "Jaya Sabarish Reddy Remala";
  const description = searchParams.get("description") ?? "Software Engineer · Agentic AI & Distributed Systems";
  const type        = searchParams.get("type")        ?? "portfolio"; // "blog" | "portfolio" | "project"
  const tag         = searchParams.get("tag")         ?? "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0d0b12",
          padding: "60px 72px",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Indigo gradient blob */}
        <div
          style={{
            position: "absolute",
            top: "-120px",
            right: "-80px",
            width: "480px",
            height: "480px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(99,102,241,0.18) 0%, rgba(139,92,246,0.08) 60%, transparent 100%)",
          }}
        />

        {/* Top — logo + type label */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "2px" }}>
            <span style={{ fontSize: "26px", fontWeight: 800, color: "#fafafa", letterSpacing: "-0.02em" }}>
              Jaya
            </span>
            <span style={{ fontSize: "26px", fontWeight: 800, color: "#818cf8" }}>.</span>
          </div>
          <span
            style={{
              fontSize: "12px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "#71717a",
              background: "#18181b",
              border: "1px solid #3f3f46",
              borderRadius: "999px",
              padding: "6px 14px",
            }}
          >
            {type === "blog" ? "Blog Post" : type === "project" ? "Project" : "Portfolio"}
          </span>
        </div>

        {/* Middle — title + description */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", flex: 1, justifyContent: "center" }}>
          <div
            style={{
              fontSize: title.length > 60 ? "40px" : "52px",
              fontWeight: 800,
              color: "#fafafa",
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              maxWidth: "900px",
            }}
          >
            {title}
          </div>
          {description && (
            <div
              style={{
                fontSize: "20px",
                color: "#a1a1aa",
                lineHeight: 1.5,
                maxWidth: "820px",
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
              }}
            >
              {description}
            </div>
          )}
        </div>

        {/* Bottom — tag + url */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: "8px" }}>
            {tag && (
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#818cf8",
                  background: "#1e1b4b",
                  border: "1px solid #312e81",
                  borderRadius: "999px",
                  padding: "6px 14px",
                }}
              >
                #{tag}
              </span>
            )}
          </div>
          <span style={{ fontSize: "14px", color: "#52525b" }}>jayaremala.com</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
