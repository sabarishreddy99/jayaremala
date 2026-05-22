import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";
import SiteTracker from "@/components/SiteTracker";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  style: ["normal", "italic"],
});

const SITE_URL = "https://jayaremala.com";
const SITE_TITLE = "Jaya Sabarish Reddy Remala — Software Engineer";
const SITE_DESC =
  "Software Engineer specializing in Agentic AI, distributed systems, and production ML infrastructure. Qualcomm Edge AI Hackathon Winner. NYU Tandon CS.";

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: SITE_DESC,
  authors: [{ name: "Jaya Sabarish Reddy Remala" }],
  keywords: ["Software Engineer", "AI", "Distributed Systems", "LangGraph", "FastAPI", "NYU"],
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: SITE_TITLE,
    description: SITE_DESC,
    siteName: "Jaya Sabarish Reddy Remala",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESC,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${sourceSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg text-fg">
        <ThemeProvider>
          <SiteTracker />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
