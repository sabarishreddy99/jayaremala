import type { Metadata } from "next";
import { Bodoni_Moda, Jost } from "next/font/google";
import "./taste.css";

/* The dealt type system: a didone over a light geometric sans. Two faces, the
   house limit. Set blunt and very large in taste.css so the Bodoni reads as a
   nameplate on a document rather than as a fashion masthead. */
const bodoni = Bodoni_Moda({
  variable: "--font-bodoni",
  subsets: ["latin"],
  weight: ["500"],
  style: "normal",
});
const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["400", "500"],
  style: "normal",
});

export const metadata: Metadata = {
  title: "Jaya Sabarish Reddy Remala",
  description:
    "Software engineer. I build AI and distributed systems that stay in production, and I stay on call for them.",
  robots: { index: false, follow: false },
};

export default function HomeV2Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${bodoni.variable} ${jost.variable} taste`} style={{ minHeight: "100vh" }}>
      {children}
    </div>
  );
}
