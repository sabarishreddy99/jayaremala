import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Source_Serif_4, Playfair_Display, EB_Garamond, Roboto, Cormorant_Garamond } from "next/font/google";
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
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});
const ebGaramond = EB_Garamond({
  variable: "--font-eb-garamond",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
});
const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "900"],
  style: ["normal", "italic"],
});
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const SITE_URL = "https://jayaremala.com";
const SITE_TITLE = "Jaya Sabarish Reddy Remala — Software Engineer";
const SITE_DESC =
  "Software Engineer specializing in Agentic AI, distributed systems, and production ML infrastructure. Qualcomm Edge AI Hackathon Winner. NYU Tandon CS.";
const OG_IMAGE = `${SITE_URL}/og-image.png`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s — Jaya Sabarish Reddy Remala",
  },
  description: SITE_DESC,
  authors: [{ name: "Jaya Sabarish Reddy Remala", url: SITE_URL }],
  creator: "Jaya Sabarish Reddy Remala",
  keywords: [
    "Software Engineer", "Jaya Sabarish Reddy Remala", "Jaya Remala",
    "Agentic AI", "RAG", "LangGraph", "FastAPI", "Distributed Systems",
    "Machine Learning", "LLM", "NYU", "Qualcomm Hackathon", "Python",
    "Edge AI", "Production ML", "AI Infrastructure",
  ],
  alternates: {
    canonical: SITE_URL,
    types: { "application/rss+xml": `${SITE_URL}/feed.xml` },
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: SITE_TITLE,
    description: SITE_DESC,
    siteName: "Jaya Sabarish Reddy Remala",
    locale: "en_US",
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESC,
    images: [OG_IMAGE],
    creator: "@jayaremala",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
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
      className={`${geistSans.variable} ${geistMono.variable} ${sourceSerif.variable} ${playfair.variable} ${ebGaramond.variable} ${roboto.variable} ${cormorant.variable} h-full antialiased`}
    >
      <head>
        {/* Anti-FOUC: apply saved color-theme before first paint */}
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('color-theme')||'midnight';document.documentElement.setAttribute('data-theme',t);}catch(e){}` }} />
      </head>
      <body className="min-h-full flex flex-col bg-bg text-fg">
        <ThemeProvider>
          <SiteTracker />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
