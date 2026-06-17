import type { Metadata } from "next";
import { GVAuthProvider } from "@/components/gradevitian/GVAuthProvider";
import GVNav from "@/components/gradevitian/GVNav";
import GVFooter from "@/components/gradevitian/GVFooter";

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

// Canonicalize to the subdomain: if the path-form is opened on the main domain
// (jayaremala.com/gradevitian/...), redirect to gradevitian.jayaremala.com/... at
// parse time (before render — minimal flash). Never fires on the subdomain or localhost.
const CANONICAL_REDIRECT = `(function(){try{var h=location.hostname;if(h==='jayaremala.com'||h==='www.jayaremala.com'){var p=location.pathname.replace(/^\\/gradevitian/,'')||'/';location.replace('https://gradevitian.jayaremala.com'+p+location.search+location.hash);}}catch(e){}})();`;

export default function GradeVITianLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: CANONICAL_REDIRECT }} />
      <GVAuthProvider>
        <div className="flex min-h-screen flex-col">
          <GVNav />
          <main className="relative flex-1">{children}</main>
          <GVFooter />
        </div>
      </GVAuthProvider>
    </>
  );
}
