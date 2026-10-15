"use client";

import ScrollReveal from "@/components/ui/ScrollReveal";
import { COPY, COMPARISON, FIELD_TESTS } from "@/data/vrfbricks/copy";
import { IS_STANDARD } from "@/data/vrfbricks/business";
import { useLang } from "./VRFLang";
import VRFFaq from "./VRFFaq";
import { PHOTOS } from "./VRFPhoto";
import {
  Section, Inner, Chapter, Headline, Eyebrow, WhatsAppButton, TextLink, SERIF,
} from "./VRFUi";
import { waSimple } from "./whatsapp";

export default function VRFWhyPage() {
  const { t } = useLang();

  return (
    <>
      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="vrf-bond pointer-events-none absolute inset-0" />
        <Inner className="relative py-16 sm:py-20">
          <div className="max-w-3xl">
            <Eyebrow>{t(COPY.why.h1)}</Eyebrow>
            <h1
              className="text-[2.3rem] font-light leading-[1.05] tracking-[-0.015em] text-fg sm:text-[3.2rem]"
              style={{ fontFamily: SERIF }}
            >
              {t(COPY.home.storyTitle)}
            </h1>
            <p className="mt-6 text-[1.08rem] leading-[1.75] text-fg-muted">{t(COPY.why.lede)}</p>
          </div>
        </Inner>
      </section>

      {/* ── Comparison ─────────────────────────────────────────────────────
          A real table, not a marketing graphic: it has rows where the other
          product wins, and those rows are not hidden. A buyer who catches you
          being fair about the drawback believes you on everything else. */}
      <Section className="py-16 sm:py-20">
        <ScrollReveal>
          <Headline className="text-center">{t(COPY.why.tableTitle)}</Headline>
        </ScrollReveal>

        <ScrollReveal>
          <div className="mt-10 overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-[0.95rem]">
              <thead>
                <tr>
                  <th scope="col" className="w-1/4 pb-3 pr-4" />
                  <th
                    scope="col"
                    className="w-[37.5%] bg-accent-light px-4 pb-3 pt-3 align-bottom text-[0.85rem] font-bold text-accent"
                  >
                    {t(COPY.why.colFly)}
                  </th>
                  <th
                    scope="col"
                    className="w-[37.5%] px-4 pb-3 pt-3 align-bottom text-[0.85rem] font-bold text-fg-subtle"
                  >
                    {t(COPY.why.colClay)}
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row) => (
                  <tr key={row.feature.en} className="border-t border-border-subtle align-top">
                    <th scope="row" className="py-4 pr-4 font-semibold text-fg">
                      {t(row.feature)}
                    </th>
                    <td
                      className={`bg-accent-light px-4 py-4 leading-relaxed text-fg-muted ${
                        row.advantage === "fly" ? "font-semibold" : ""
                      }`}
                    >
                      {t(row.fly)}
                    </td>
                    <td
                      className={`px-4 py-4 leading-relaxed text-fg-muted ${
                        row.advantage === "clay" ? "font-semibold" : ""
                      }`}
                    >
                      {t(row.clay)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ScrollReveal>
      </Section>

      {/* ── Where clay wins ─────────────────────────────────────────────── */}
      <Section bond className="py-16 sm:py-24">
        <Chapter index="01" label={t(COPY.chapters.trust)} />
        <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:gap-14">
          <ScrollReveal className="lg:col-span-5">
            {/* True 1400x932 ratio on the container, so the photo is never
                cropped or stretched to fit the column. */}
            <div
              className="overflow-hidden rounded-2xl bg-surface-sunken ring-1 ring-border"
              style={{ aspectRatio: `${PHOTOS.clay.w} / ${PHOTOS.clay.h}` }}
            >
              {/* Static export: plain img with an explicit aspect ratio. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={PHOTOS.clay.src}
                alt="A mason bedding a red clay brick into fresh mortar with a trowel, working to a string line."
                width={PHOTOS.clay.w}
                height={PHOTOS.clay.h}
                loading="lazy"
                decoding="async"
                sizes="(max-width: 1024px) 100vw, 480px"
                className="vrf-photo h-full w-full object-contain"
              />
            </div>
            <p className="mt-2.5 text-[0.8rem] text-fg-subtle">
              {t({
                en: "Red clay brickwork. Illustrative photograph, not our product.",
                te: "ఎర్ర మట్టి ఇటుక పని. ఉదాహరణ చిత్రం, మా ఉత్పత్తి కాదు.",
              })}
            </p>
          </ScrollReveal>
          <ScrollReveal delay={90} className="lg:col-span-7">
            <Headline>{t(COPY.why.fairTitle)}</Headline>
            <p className="mt-5 text-[1.05rem] leading-[1.8] text-fg-muted">
              {t(COPY.why.fairBody)}
            </p>
          </ScrollReveal>
        </div>
      </Section>

      {/* ── The standard ────────────────────────────────────────────────── */}
      <Section className="py-16 sm:py-24">
        <Chapter index="02" label={t(COPY.chapters.quality)} />
        <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:gap-14">
          <ScrollReveal className="lg:col-span-7">
            <Eyebrow>{IS_STANDARD.code}</Eyebrow>
            <Headline>{t(COPY.why.standardTitle)}</Headline>
            <p className="mt-5 text-[1.05rem] leading-[1.8] text-fg-muted">
              {t(COPY.why.standardBody)}
            </p>
          </ScrollReveal>

          <ScrollReveal delay={90} className="lg:col-span-5">
            <aside className="rounded-2xl bg-surface ring-1 ring-border p-6">
              <h3 className="text-nano font-bold uppercase tracking-[0.16em] text-fg-subtle">
                {IS_STANDARD.title}
              </h3>
              <dl className="mt-5 space-y-4 text-[0.94rem]">
                {IS_STANDARD.classes.map((c) => (
                  <div
                    key={c.grade}
                    className="flex items-baseline justify-between gap-4 border-b border-border-subtle pb-3"
                  >
                    <dt className="font-semibold text-fg">{c.grade}</dt>
                    <dd className="text-right">
                      <span className="text-[1.2rem] font-semibold tabular-nums text-accent">
                        {c.strengthMPa}
                      </span>{" "}
                      <span className="text-fg-subtle">N/mm²</span>
                    </dd>
                  </div>
                ))}
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="font-semibold text-fg">{t(COPY.why.maxAbsorption)}</dt>
                  <dd>
                    <span className="text-[1.2rem] font-semibold tabular-nums text-accent">
                      {IS_STANDARD.maxWaterAbsorptionPct}%
                    </span>
                  </dd>
                </div>
              </dl>
              <p className="mt-5 text-[0.82rem] leading-relaxed text-fg-subtle">
                {t(COPY.why.standardNote)}
              </p>
            </aside>
          </ScrollReveal>
        </div>
      </Section>

      {/* ── Field tests ─────────────────────────────────────────────────── */}
      <Section bond className="py-16 sm:py-24">
        <ScrollReveal>
          <div className="mx-auto max-w-2xl text-center">
            <Headline>{t(COPY.why.howToCheckTitle)}</Headline>
            <p className="mt-4 text-[1.02rem] leading-relaxed text-fg-muted">
              {t(COPY.why.howToCheckLede)}
            </p>
          </div>
        </ScrollReveal>

        <ol className="mx-auto mt-12 grid max-w-4xl gap-6 sm:grid-cols-2">
          {FIELD_TESTS.map((test, i) => (
            <ScrollReveal key={test.title.en} delay={i * 70}>
              <li className="h-full rounded-2xl bg-surface ring-1 ring-border p-6">
                <span className="text-nano font-bold tracking-[0.18em] text-accent">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-2.5 text-[1.1rem] font-semibold text-fg">{t(test.title)}</h3>
                <p className="mt-2.5 text-[0.95rem] leading-[1.7] text-fg-muted">{t(test.body)}</p>
              </li>
            </ScrollReveal>
          ))}
        </ol>

        <div className="mt-14 flex flex-wrap items-center justify-center gap-5">
          <WhatsAppButton href={waSimple(t(COPY.quote.msgIntro))}>
            {t(COPY.common.getQuote)}
          </WhatsAppButton>
          <TextLink href="/bricks/">{t(COPY.home.seeAllBricks)}</TextLink>
        </div>
      </Section>

      <VRFFaq page="why" chapter="03" />
    </>
  );
}
