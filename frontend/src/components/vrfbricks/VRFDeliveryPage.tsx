"use client";

import ScrollReveal from "@/components/ui/ScrollReveal";
import { BRICKS, DELIVERY, NEEDS_CONFIRMATION, fmtHours } from "@/data/vrfbricks/business";
import { COPY } from "@/data/vrfbricks/copy";
import { useLang } from "./VRFLang";
import VRFFaq from "./VRFFaq";
import {
  Section, Inner, Headline, Eyebrow, WhatsAppButton, TextLink,
  TruckIcon, ClockIcon, PinIcon, SERIF,
} from "./VRFUi";
import { waSimple } from "./whatsapp";

export default function VRFDeliveryPage() {
  const { t, lang } = useLang();
  const nf = new Intl.NumberFormat(lang === "te" ? "te-IN" : "en-IN");
  const stocked = BRICKS.filter((b) => b.perTruck !== null);

  return (
    <>
      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="vrf-bond pointer-events-none absolute inset-0" />
        <Inner className="relative py-16 sm:py-20">
          <div className="max-w-3xl">
            <Eyebrow>{t(COPY.delivery.h1)}</Eyebrow>
            <h1
              className="text-[2.3rem] font-light leading-[1.05] tracking-[-0.015em] text-fg sm:text-[3.2rem]"
              style={{ fontFamily: SERIF }}
            >
              {t(COPY.delivery.h1)}
            </h1>
            <p className="mt-6 text-[1.12rem] leading-[1.75] text-fg-muted">
              {t(COPY.delivery.lede)}
            </p>
          </div>
        </Inner>
      </section>

      {/* ── Truck loads ────────────────────────────────────────────────────
          The most-asked question after price. Answered as a number, large,
          before anything else on the page. */}
      <Section className="py-16 sm:py-20">
        <ScrollReveal>
          <Headline>{t(COPY.delivery.loadsTitle)}</Headline>
        </ScrollReveal>

        <div className="mt-9 grid gap-6 sm:grid-cols-2">
          {stocked.map((b, i) => (
            <ScrollReveal key={b.id} delay={i * 80}>
              <div className="h-full rounded-2xl bg-surface ring-1 ring-border p-7">
                <TruckIcon className="h-7 w-7 text-accent" />
                <p
                  className="mt-5 text-[3.2rem] font-light leading-none tabular-nums text-fg"
                  style={{ fontFamily: SERIF }}
                >
                  {nf.format(b.perTruck as number)}
                </p>
                <p className="mt-2 text-[0.95rem] font-semibold text-fg">
                  {t(COPY.delivery.perTruckUnit)}
                </p>
                <p className="mt-3 text-[0.92rem] leading-relaxed text-fg-subtle">
                  {t(b.name)} · {b.inches.l}×{b.inches.w}×{b.inches.h}&Prime;
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal>
          <div className="mt-8">
            <p className="text-[0.92rem] leading-relaxed text-fg-subtle">
              {t(COPY.delivery.calcHint)}
            </p>
            <div className="mt-3">
              <TextLink href="/bricks/#calculator">{t(COPY.bricks.calcTitle)}</TextLink>
            </div>
          </div>
        </ScrollReveal>
      </Section>

      {/* ── Terms ──────────────────────────────────────────────────────── */}
      <Section bond className="py-16 sm:py-24">
        <div className="grid gap-px bg-border-subtle sm:grid-cols-3">
          {[
            {
              icon: <ClockIcon className="h-6 w-6" />,
              title: COPY.delivery.leadTitle,
              body: COPY.delivery.leadBody,
              stat: `${DELIVERY.leadTimeDays[0]}–${DELIVERY.leadTimeDays[1]}`,
              statLabel: COPY.delivery.days,
            },
            {
              icon: <TruckIcon className="h-6 w-6" />,
              title: COPY.delivery.chargesTitle,
              body: COPY.delivery.chargesBody,
              stat: null,
              statLabel: null,
            },
            {
              icon: <PinIcon className="h-6 w-6" />,
              title: COPY.delivery.pickupTitle,
              body: COPY.delivery.pickupBody,
              stat: fmtHours(lang),
              statLabel: COPY.delivery.everyDay,
            },
          ].map((card, i) => (
            <ScrollReveal key={card.title.en} delay={i * 70} className="bg-bg">
              <div className="h-full bg-surface p-7 sm:p-8">
                <span className="text-accent">{card.icon}</span>
                <h2 className="mt-4 text-[1.2rem] font-semibold text-fg">{t(card.title)}</h2>
                {card.stat && (
                  <p className="mt-3 flex items-baseline gap-2">
                    <span
                      className="text-[2.1rem] font-light leading-none text-fg"
                      style={{ fontFamily: SERIF }}
                    >
                      {card.stat}
                    </span>
                    {card.statLabel && (
                      <span className="text-[0.85rem] text-fg-subtle">{t(card.statLabel)}</span>
                    )}
                  </p>
                )}
                <p className="mt-3 text-[0.96rem] leading-[1.7] text-fg-muted">{t(card.body)}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Delivery radius renders only once confirmed. An invented
            "we deliver within 50 km" is exactly the kind of claim that costs a
            supplier their word the first time it turns out to be wrong. */}
        {NEEDS_CONFIRMATION.deliveryRadiusKm.confirmed &&
          NEEDS_CONFIRMATION.deliveryRadiusKm.value && (
            <p className="mt-10 text-[1rem] text-fg-muted">
              {t({
                en: `We deliver up to ${NEEDS_CONFIRMATION.deliveryRadiusKm.value} km from the yard.`,
                te: `ప్రాంగణం నుండి ${NEEDS_CONFIRMATION.deliveryRadiusKm.value} కి.మీ. వరకు డెలివరీ చేస్తాము.`,
              })}
            </p>
          )}

        <div className="mt-14 flex justify-center">
          <WhatsAppButton href={waSimple(t(COPY.quote.msgIntro))}>
            {t(COPY.common.getQuoteLong)}
          </WhatsAppButton>
        </div>
      </Section>

      <VRFFaq page="delivery" chapter="01" />
    </>
  );
}
