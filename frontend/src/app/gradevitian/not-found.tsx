import Image from "next/image";
import GVLink from "@/components/gradevitian/GVLink";

export default function GradeVITianNotFound() {
  return (
    <section className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center">
      <Image src="/gradevitian/not-found.svg" alt="" width={260} height={200} className="w-64 max-w-full" />
      <h1 className="mt-8 text-3xl font-bold tracking-tight text-fg">Page not found</h1>
      <p className="mt-2 text-fg-muted">That page wandered off — but your toolkit is right where you left it.</p>
      <GVLink href="/" className="mt-6 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-fg transition hover:bg-accent-hover">
        Back to gradeVITian
      </GVLink>
    </section>
  );
}
