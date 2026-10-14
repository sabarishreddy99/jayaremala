import { Fragment } from "react";
import Link from "next/link";
import { profile } from "@/data/profile";
import { experience } from "@/data/experience";
import { testimonials } from "@/data/testimonials";
import StillRunning, { type Laid } from "./StillRunning";
import Rise from "./Rise";

/* ───────────────────────────────────────────────────────────────────────────
   Direction sheet: "The page is the object" · seed 1975244060
   Hero: tabbed folder stack · Type: Bodoni Moda / Jost · Colour: bone, green,
   chocolate · Sections: intro, work, showcase, proof, about, list,
   testimonial, contact.

   The idea: the courses of fly-ash bricks curing in the yard at Kavali become
   the stacked, tabbed panels the page is laid from. Every section is another
   course. Nothing floats: no shadows, no outlines, no rules — surfaces are
   separated by a 3px gap, which is the mortar line.

   Pictures are the project's own, nine of them. The only photograph of the
   actual yard is yard-kavali.jpg (flagged `authentic: true` in VRFPhoto.tsx);
   the other yard photos in that folder are sourced stock and are deliberately
   NOT used here, because the page must not caption stock as this yard.
   ─────────────────────────────────────────────────────────────────────────── */

export const metadata = {
  title: "Jaya Sabarish Reddy Remala",
  robots: { index: false, follow: false },
};

const laid: Laid[] = (profile.shipped ?? []).map((s) => ({
  name: s.name,
  what: s.what,
  who: s.who,
  shippedAt: s.shippedAt,
  url: s.url,
}));

/* Two to four roles, impact first — the curated set already in experience.json */
const roles = experience.filter((e) => e.featured).slice(0, 3);

export default function HomeV2() {
  const hero = profile.hero;
  const stats = profile.heroStats ?? [];

  return (
    <main>
      {/* ── Nav: wordmark, four plain links, one action. No bar chrome. ───── */}
      <div className="wrap">
        <nav className="nav">
          <Link href="/" className="display" style={{ fontSize: "var(--step-lead)" }}>
            Remala
          </Link>
          <div className="nav-links t-small" style={{ color: "var(--ink)" }}>
            <Link href="/case-studies">Case studies</Link>
            <Link href="/projects">Work</Link>
            <Link href="/experience">Experience</Link>
            <Link href="/blog">Writing</Link>
          </div>
          <a className="btn" href={profile.booking_url || "#contact"} target="_blank" rel="noopener noreferrer">
            Book a call
          </a>
        </nav>
      </div>

      {/* ── HERO ───────────────────────────────────────────────────────────
          The artefact as a single filled panel on a contrasting ground: the
          course of bricks is the photograph itself, full bleed, with the name
          plate sitting on the bone above it. */}
      <section className="hero">
        <div className="wrap">
          <Rise>
            <h1 style={{ maxWidth: "15ch" }}>I build things that stay up.</h1>
          </Rise>
          <Rise delay={90}>
            <p className="t-lead hero-lead" style={{ maxWidth: "46ch" }}>
              Software engineer. I build AI infrastructure and distributed systems, then
              I stay on call for them.
            </p>
          </Rise>
          <Rise delay={180}>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "2rem" }}>
              <a className="btn" href={profile.booking_url || "#contact"} target="_blank" rel="noopener noreferrer">
                Book a call
              </a>
              <Link className="btn btn-quiet" href="/case-studies">
                Read a case study
              </Link>
            </div>
          </Rise>
        </div>

        <Rise delay={260}>
          <figure
            className="bleed"
            style={{ marginTop: "clamp(2.5rem,1.5rem+4vw,5rem)", aspectRatio: "1152 / 464", maxHeight: "62vh" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/vrfbricks/photos/yard-kavali.jpg"
              alt="Fly-ash cement bricks laid out in courses to cure at the yard in Kavali, with the mixer, the delivery lorry and the maize field behind."
              width={1152}
              height={464}
              fetchPriority="high"
            />
          </figure>
        </Rise>

        <div className="wrap">
          <Rise>
            <p className="t-small" style={{ marginTop: "0.9rem", maxWidth: "70ch" }}>
              The yard at Kavali, Nellore district. My father&rsquo;s bricks, curing in courses.
              The first website I ever built was for this.
            </p>
          </Rise>
        </div>
      </section>

      {/* ── INTRO · Title, note, facts row ─────────────────────────────── */}
      <section>
        <div className="wrap">
          <Rise>
            <h2 style={{ maxWidth: "18ch" }}>Why I build</h2>
          </Rise>
          <div
            style={{
              display: "grid",
              gap: "clamp(1.5rem,1rem+3vw,4rem)",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 24rem), 1fr))",
              marginTop: "clamp(1.5rem,1rem+2vw,2.5rem)",
            }}
          >
            <Rise delay={70}>
              <p>
                In 2020 my father started a brick business in our town. I built him a
                one-page website. HTML, some JavaScript, and a stubborn amount of SEO.
                No framework, no analytics, no plan.
              </p>
              <p style={{ marginTop: "1.1rem" }}>
                People started finding him through it. During COVID, that little page
                was doing real work.
              </p>
            </Rise>
            <Rise delay={140}>
              <p>
                I&rsquo;ve since built systems that carry 115GB a day and answer 3,000
                requests a second. None of them taught me more than that one did:
                software is at its best when it&rsquo;s the shortest path between
                someone&rsquo;s need and someone&rsquo;s help.
              </p>
              <p style={{ marginTop: "1.1rem" }}>Everything on this page is downstream of that.</p>
            </Rise>
          </div>

          {/* facts row — the numbers, set large, no cards */}
          <Rise delay={210}>
            <dl className="facts">
              {stats.map((s) => (
                <Fragment key={s.label}>
                  <dt>
                    {s.value}
                    {s.suffix}
                  </dt>
                  {/* Label and detail on one body-size line. A small line stacked
                      above the next row's figure reads as a kicker, which the
                      house rules ban. Casing is left alone: lowercasing the first
                      letter turned "Snapdragon NPU" into "snapdragon NPU". */}
                  <dd style={{ margin: 0 }}>
                    {s.label}, {s.sub}
                  </dd>
                </Fragment>
              ))}
            </dl>
          </Rise>
        </div>
      </section>

      {/* ── WORK · Stacked folders with tabs (rendered as courses) ──────── */}
      <section>
        <div className="wrap">
          <Rise>
            <h2 style={{ maxWidth: "20ch" }}>Where it held up</h2>
          </Rise>
          <Rise delay={70}>
            <p className="t-lead" style={{ marginTop: "1.25rem", maxWidth: "48ch" }}>
              Three employers, one habit: ship it, then stay responsible for it.
            </p>
          </Rise>

          <div className="course" style={{ marginTop: "clamp(2rem,1.5rem+2vw,3.5rem)" }}>
            {roles.map((job, i) => {
              const short = job.company.split(/\s+[–-]\s+|\s+\(/)[0].trim();
              const qualifier = job.company.slice(short.length).replace(/^[\s–\-(]+|[)\s]+$/g, "").trim();
              return (
                <Rise key={`${job.company}-${job.role}`} delay={i * 80}>
                  <article className="brick">
                    <div
                      style={{
                        display: "grid",
                        gap: "clamp(.75rem,.5rem+1.5vw,2.5rem)",
                        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 18rem), 1fr))",
                      }}
                    >
                      <div>
                        <h3>{short}</h3>
                        <p style={{ marginTop: ".4rem" }}>{job.role}</p>
                        <p className="t-small" style={{ marginTop: ".4rem" }}>
                          {qualifier ? `${qualifier} · ` : ""}
                          {job.start} – {job.end}
                        </p>
                      </div>
                      <p>{job.bullets[0]}</p>
                    </div>
                  </article>
                </Rise>
              );
            })}
          </div>

          {/* real pictures of that work: his own */}
          <Rise delay={240}>
            <div
              style={{
                display: "grid",
                gap: "3px",
                gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 16rem), 1fr))",
                marginTop: "3px",
              }}
            >
              {[
                { src: "/gallery/nyu-it-hsrn-mpuqx9l1.jpeg", alt: "Demo day for the NYU IT High-Speed Research Network, spring 2025." },
                { src: "/gallery/1725162969704-mpwxn3ge-8jb.jpg", alt: "The NYU IT High-Speed Research Network team, May 2025." },
                { src: "/gallery/wipro-shell-aoms-mpvrylub-c1k.png", alt: "Shell recognition for the AOMS work at Wipro, November 2022." },
              ].map((p) => (
                <figure key={p.src} style={{ aspectRatio: "4 / 3" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.src} alt={p.alt} loading="lazy" decoding="async" />
                </figure>
              ))}
            </div>
          </Rise>
        </div>
      </section>

      {/* ── SHOWCASE · Square plate, spare text ─────────────────────────── */}
      <section>
        <div className="wrap">
          <div
            style={{
              display: "grid",
              gap: "clamp(1.5rem,1rem+3vw,4rem)",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 22rem), 1fr))",
              alignItems: "center",
            }}
          >
            <Rise>
              <figure style={{ aspectRatio: "1 / 1" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/home-v2/gradevitian-gpa.png"
                  alt="The VIT GPA calculator on gradeVITian: twelve rows of grade and credit inputs, and the result the moment you stop typing."
                  loading="lazy"
                  decoding="async"
                  data-ui=""
                  style={{ objectPosition: "top center" }}
                />
              </figure>
            </Rise>
            <Rise delay={90}>
              <div>
                <h2 style={{ maxWidth: "20ch" }}>Still on call since 2020.</h2>
                <p className="t-lead" style={{ marginTop: "1.25rem" }}>
                  I built gradeVITian as an undergrad. It works out grades and attendance for
                  about 17,000 students a month, and it is still mine to answer for.
                </p>
                <p style={{ marginTop: "1.1rem" }}>
                  Twenty thousand registered accounts, second on Google for the queries
                  that matter, sub-second on a phone. Five graduating classes have used
                  it. I rebuilt it on Next.js and FastAPI in 2026 and it is still mine to
                  answer for.
                </p>
                <a
                  className="btn"
                  href="https://gradevitian.jayaremala.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ marginTop: "1.75rem" }}
                >
                  See it live
                </a>
              </div>
            </Rise>
          </div>
        </div>
      </section>

      {/* ── PROOF · The printed guest list (and the live thing) ─────────── */}
      <section className="field">
        <div className="wrap">
          <Rise>
            <h2 style={{ maxWidth: "16ch" }}>Still running</h2>
          </Rise>
          <Rise delay={70}>
            <p className="t-lead" style={{ marginTop: "1.25rem", maxWidth: "44ch" }}>
              Three things I shipped that are still in production. The clocks are real.
              Tap one.
            </p>
          </Rise>
          <Rise delay={140}>
            <div style={{ marginTop: "clamp(2rem,1.5rem+2vw,3rem)" }}>
              <StillRunning items={laid} />
            </div>
          </Rise>
          <Rise delay={210}>
            <p className="t-small" style={{ marginTop: "1.5rem" }}>
              {profile.shippedNote}
            </p>
          </Rise>
        </div>
      </section>

      {/* ── ABOUT · Founder's letter ────────────────────────────────────── */}
      <section>
        <div className="wrap">
          <div
            style={{
              display: "grid",
              gap: "clamp(1.5rem,1rem+3vw,4rem)",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 20rem), 1fr))",
            }}
          >
            <Rise>
              <div>
                <h2 style={{ maxWidth: "12ch" }}>What I optimise for</h2>
                <figure style={{ aspectRatio: "5 / 4", marginTop: "clamp(1.5rem,1rem+2vw,2.5rem)" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/vrfbricks/photos/yard-kavali.jpg"
                    alt="The courses of curing bricks at the yard, close."
                    loading="lazy"
                    decoding="async"
                    style={{ objectPosition: "50% 78%" }}
                  />
                </figure>
              </div>
            </Rise>
            <Rise delay={90}>
              <div>
                <p className="t-lead">{profile.hopeMolecules?.definition}</p>
                <p style={{ marginTop: "1.25rem" }}>{profile.hopeMolecules?.belief}</p>
                <p style={{ marginTop: "1.25rem" }}>{profile.hopeMolecules?.footnote}</p>
                <p className="display" style={{ fontSize: "var(--step-lead)", marginTop: "2rem" }}>
                  {profile.hopeMolecules?.closing}
                </p>
              </div>
            </Rise>
          </div>
        </div>
      </section>

      {/* ── LIST · The printed menu sheet ───────────────────────────────── */}
      <section>
        <div className="wrap">
          <Rise>
            <h2 style={{ maxWidth: "18ch" }}>Where I stand</h2>
          </Rise>
          <Rise delay={70}>
            <p className="t-lead" style={{ marginTop: "1.25rem", maxWidth: "50ch" }}>
              {profile.opinions?.deck}
            </p>
          </Rise>

          <div className="course" style={{ marginTop: "clamp(2rem,1.5rem+2vw,3.5rem)" }}>
            {(profile.opinions?.for ?? []).map((o, i) => (
              <Rise key={o.term} delay={i * 60}>
                <div className="brick">
                  <div
                    style={{
                      display: "grid",
                      gap: "clamp(.5rem,.4rem+1.2vw,2.5rem)",
                      gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 18rem), 1fr))",
                      alignItems: "baseline",
                    }}
                  >
                    <h3>{o.term}</h3>
                    <p>{o.line}</p>
                  </div>
                </div>
              </Rise>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIAL · Quotes on paper slips ─────────────────────────── */}
      <section>
        <div className="wrap">
          <Rise>
            <h2 style={{ maxWidth: "16ch" }}>What they said</h2>
          </Rise>
          <div
            style={{
              display: "grid",
              gap: "3px",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 20rem), 1fr))",
              marginTop: "clamp(2rem,1.5rem+2vw,3rem)",
            }}
          >
            {testimonials.slice(0, 3).map((t, i) => (
              <Rise key={t.name} delay={i * 80}>
                <blockquote className="brick" style={{ margin: 0, height: "100%" }}>
                  <p style={{ maxWidth: "none" }}>{t.description}</p>
                  <footer style={{ marginTop: "1.25rem" }}>
                    <span style={{ display: "block", fontWeight: 500 }}>{t.name}</span>
                    <span className="t-small">
                      {t.designation}, {t.company}
                    </span>
                  </footer>
                </blockquote>
              </Rise>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT · Visit card on a photograph ────────────────────────── */}
      <section id="contact" style={{ paddingBlockEnd: 0 }}>
        <div className="wrap">
          <Rise>
            <h2 style={{ maxWidth: "14ch" }}>Let&rsquo;s talk</h2>
          </Rise>
          <Rise delay={70}>
            <p className="t-lead" style={{ marginTop: "1.25rem", maxWidth: "46ch" }}>
              {profile.contact_description}
            </p>
          </Rise>
          <Rise delay={140}>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "2rem" }}>
              <a className="btn" href={profile.booking_url} target="_blank" rel="noopener noreferrer">
                Book a 30-minute call
              </a>
              <a className="btn btn-quiet" href={`mailto:${profile.email}`}>
                {profile.email}
              </a>
            </div>
          </Rise>
          <Rise delay={200}>
            <p className="t-small" style={{ marginTop: "1.25rem" }}>
              {profile.availability?.label} · {(profile.availability?.types ?? []).join(", ")} ·{" "}
              {(profile.availability?.locations ?? []).join(" or ")} · {profile.location}
            </p>
          </Rise>
        </div>

        {/* The footer is the back of the object: the name returns at full width. */}
        <footer style={{ marginTop: "clamp(4rem,3rem+5vw,8rem)" }}>
          <figure style={{ aspectRatio: "1152 / 300", maxHeight: "40vh" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/gallery/jayaremalacom-system-architecture-mq5s772p.png"
              alt="The system architecture of jayaremala.com, drawn out in full."
              loading="lazy"
              decoding="async"
            />
          </figure>
          <div className="field">
            <div className="wrap" style={{ paddingBlock: "clamp(2.5rem,2rem+3vw,4.5rem)" }}>
              <p className="display t-display" style={{ maxWidth: "none", lineHeight: 0.9 }}>
                Jaya Sabarish
                <br />
                Reddy Remala
              </p>
              <p className="t-small" style={{ marginTop: "1.5rem" }}>
                {hero?.signature ?? "Do hard things!"} · {profile.location} ·{" "}
                <a href={profile.github} target="_blank" rel="noopener noreferrer">GitHub</a> ·{" "}
                <a href={profile.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>
              </p>
              <p className="t-small" style={{ marginTop: "0.75rem" }}>
                Photographs on this page are my own. The yard at Kavali is my father&rsquo;s.
              </p>
            </div>
          </div>
        </footer>
      </section>
    </main>
  );
}
