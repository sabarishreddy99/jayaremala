import type { Metadata } from "next";
import { GVAuthProvider } from "@/components/gradevitian/GVAuthProvider";
import GVNav from "@/components/gradevitian/GVNav";
import GVFooter from "@/components/gradevitian/GVFooter";
import GVScrollTop from "@/components/gradevitian/GVScrollTop";
import GVServiceWorker from "@/components/gradevitian/GVServiceWorker";
import GVIntroScreen from "@/components/gradevitian/GVIntroScreen";
import GVCanonicalRedirect from "@/components/gradevitian/GVCanonicalRedirect";
import GVJsonLd from "@/components/gradevitian/GVJsonLd";
import { gvSiteLd } from "@/lib/gradevitian/seo";
import ScrollProgress from "@/components/ScrollProgress";

const GV_URL = "https://gradevitian.jayaremala.com";
const GV_TITLE = "gradeVITian — GPA, CGPA, Grade & Attendance calculators for VITians";
const GV_DESC =
  "Free online grading tools for VIT students: compute your GPA, CGPA, predict your grades, estimate the GPA you need, and track attendance — fast, mobile-first, and accurate.";

export const metadata: Metadata = {
  metadataBase: new URL(GV_URL),
  title: {
    default: GV_TITLE,
    template: "%s — gradeVITian",
  },
  description: GV_DESC,
  applicationName: "gradeVITian",
  keywords: [
    "VIT", "VITian", "VIT Vellore", "GPA calculator", "CGPA calculator",
    "VIT GPA", "VIT CGPA", "grade predictor", "CGPA estimator",
    "attendance calculator", "VIT grading", "gradeVITian",
  ],
  manifest: "/gradevitian/manifest.webmanifest",
  // Graduation-cap icon for the browser tab and the installed/home-screen app.
  icons: {
    icon: [
      { url: "/gradevitian/gv-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/gradevitian/gv-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/gradevitian/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  // Ensures iOS shows "gradeVITian" (not the page title) under the home-screen icon.
  appleWebApp: { capable: true, title: "gradeVITian", statusBarStyle: "default" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  openGraph: {
    type: "website",
    siteName: "gradeVITian",
    url: GV_URL,
    title: GV_TITLE,
    description: GV_DESC,
    locale: "en_US",
    images: [{ url: "/gradevitian/LOGO-512px.png", width: 512, height: 512, alt: "gradeVITian" }],
  },
  twitter: {
    card: "summary",
    title: GV_TITLE,
    description: GV_DESC,
    images: ["/gradevitian/LOGO-512px.png"],
  },
};

export default function GradeVITianLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <GVJsonLd data={gvSiteLd()} />
      <GVCanonicalRedirect />
      <GVAuthProvider>
        <GVIntroScreen />
        <ScrollProgress />
        <div className="flex min-h-screen flex-col">
          <GVNav />
          <main className="relative flex-1">{children}</main>
          <GVFooter />
        </div>
        <GVScrollTop />
        <GVServiceWorker />
      </GVAuthProvider>
    </>
  );
}
