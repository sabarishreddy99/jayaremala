import Image from "next/image";
import GVLink from "@/components/gradevitian/GVLink";
import { GV_GROUPS } from "@/lib/gradevitian/nav";

export default function GradeVITianNotFound() {
  return (
    <section className="mx-auto flex max-w-2xl flex-col items-center px-4 py-20 text-center">
      <Image src="/gradevitian/not-found.svg" alt="" width={220} height={170} className="w-56 max-w-full" />
      <h1 className="mt-8 text-3xl font-bold tracking-tight text-fg">Page not found</h1>
      <p className="mt-2 text-fg-muted">That page wandered off — but every tool is just a tap away.</p>

      <div className="mt-10 w-full space-y-7 text-left">
        {GV_GROUPS.map((g) => (
          <div key={g.label}>
            <p className="mb-2.5 px-1 text-[10px] font-bold uppercase tracking-widest text-fg-subtle">{g.label}</p>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {g.items.map((it) => (
                <GVLink
                  key={it.href}
                  href={it.href}
                  className="group flex items-center gap-3 rounded-2xl border border-border-subtle bg-surface/60 px-4 py-3 transition-all duration-200 hover:border-accent/40 hover:bg-surface-raised"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent-light text-accent">{it.icon}</span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-fg transition-colors group-hover:text-accent">{it.label}</span>
                    <span className="block truncate text-[11px] text-fg-subtle">{it.desc}</span>
                  </span>
                </GVLink>
              ))}
            </div>
          </div>
        ))}
      </div>

      <GVLink href="/" className="mt-10 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-fg transition hover:bg-accent-hover">
        Back to gradeVITian home
      </GVLink>
    </section>
  );
}
