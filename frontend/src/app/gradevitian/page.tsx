import type { Metadata } from "next";
import GVHome from "@/components/gradevitian/GVHome";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "gradeVITian",
  url: "https://gradevitian.jayaremala.com",
  description:
    "Free GPA, CGPA, grade prediction, CGPA estimation and attendance calculators for VIT students. A high-traffic PWA scaled to 17K+ monthly active users.",
  applicationCategory: "EducationalApplication",
  operatingSystem: "Any (web browser)",
  browserRequirements: "Requires JavaScript",
  inLanguage: "en",
  isAccessibleForFree: true,
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  author: { "@type": "Person", name: "Jaya Sabarish Reddy Remala", url: "https://jayaremala.com" },
  featureList: [
    "GPA Calculator",
    "CGPA Calculator",
    "Grade Predictor",
    "CGPA Estimator",
    "Attendance Calculator",
    "Weightage Converter",
  ],
};

export default function GradeVITianHome() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <GVHome />
    </>
  );
}
