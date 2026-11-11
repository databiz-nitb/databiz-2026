/**
 * Phase 11 seed: Quantum ML post, DataBrew event + episode, FAQ items.
 * Idempotent on slug / question text.
 *
 *   pnpm db:seed
 */
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { randomUUID } from "node:crypto";

config({ path: ".env.local" });

const url = process.env.DATABASE_URL?.trim();
if (!url) {
  console.error("DATABASE_URL missing in .env.local");
  process.exit(1);
}

const sql = neon(url);

const QUANTUM_BODY = `Quantum machine learning sits at the intersection of quantum computing and classical ML. The question for practitioners is not whether the math is interesting — it is whether today's noisy intermediate-scale quantum (NISQ) devices can beat classical baselines on real data.

## What "ready" would mean

A useful QML system would improve accuracy, sample efficiency, or wall-clock cost on a problem that matters outside a lab notebook. Benchmarks that only work on toy datasets, or that ignore data-loading and error mitigation costs, do not settle that question.

## Where the field stands

Hybrid algorithms (variational circuits, quantum kernels) show promise in papers. Hardware noise, limited qubit counts, and the cost of encoding classical features into quantum states still dominate most applied attempts. Classical ML remains the default for tabular, vision, and language work that societies like DataBiz ship.

## What students should take away

Learn the classical foundations first. Treat QML as an advanced elective: understand the claims, read the caveats, and keep an eye on hardware roadmaps. When a workflow is ready for real-world data, the evaluation will look like any other ML pitch — holdout sets, cost, and honesty about failure modes.
`;

const FAQ = [
  {
    question: "Who can join DataBiz?",
    answer:
      "MANIT students sign in with an @stu.manit.ac.in address and apply while a recruitment drive is open.",
  },
  {
    question: "What does the club do?",
    answer:
      "Learning pathways, workshops, hackathons, industry talks, student projects, the blog, and The DataBrew Show.",
  },
  {
    question: "How do events work?",
    answer:
      "Each event has its own page with details and RSVP. Register on that page before the deadline.",
  },
  {
    question: "How does hiring work?",
    answer:
      "Open drives run an online assessment, then interviews, then a result you can see on your account.",
  },
];

async function upsertTeamDebashish() {
  const existing = await sql`
    select id from team_members where name = 'Debashish' limit 1
  `;
  if (existing[0]?.id) return existing[0].id;
  const id = randomUUID();
  await sql`
    insert into team_members (id, name, role_title, bio, sort_order, is_current, year_label)
    values (${id}, 'Debashish', 'Writer', '', 100, false, null)
  `;
  return id;
}

async function upsertPost(authorId) {
  const slug = "quantum-machine-learning-real-world-data";
  const existing = await sql`select id from posts where slug = ${slug} limit 1`;
  if (existing[0]?.id) {
    console.log("post already seeded:", slug);
    return existing[0].id;
  }
  const id = randomUUID();
  const publishedAt = new Date("2026-01-10T12:00:00+05:30");
  await sql`
    insert into posts (
      id, slug, title, excerpt, body, author_name, author_id, tags, status, published_at, created_at, updated_at
    ) values (
      ${id},
      ${slug},
      ${"Quantum Machine Learning: Is It Ready for Real World Data?"},
      ${"A practical look at whether QML is ready beyond the lab — and what students should learn first."},
      ${QUANTUM_BODY},
      ${"Debashish"},
      ${authorId},
      ${JSON.stringify(["quantum", "machine-learning"])}::jsonb,
      ${"published"},
      ${publishedAt},
      now(),
      now()
    )
  `;
  console.log("seeded post:", slug);
  return id;
}

async function upsertEventAndEpisode() {
  const slug = "the-databrew-show-with-consultant";
  let eventId;
  const existingEvent = await sql`select id from events where slug = ${slug} limit 1`;
  if (existingEvent[0]?.id) {
    eventId = existingEvent[0].id;
    console.log("event already seeded:", slug);
  } else {
    eventId = randomUUID();
    const starts = new Date("2026-02-21T18:00:00+05:30");
    const ends = new Date("2026-02-21T19:30:00+05:30");
    const summary =
      "The session covers what Big 4 audit teaches about thinking at scale, how finance, research, and analytics meet in global consulting, what it takes to reach institutions like the World Bank Group, and the shift from compliance to impact.";
    const poster =
      "https://res.cloudinary.com/dvil2pqgj/image/upload/v1771598566/databiz/xvnlv5c26zw1skfccmzn.jpg";
    await sql`
      insert into events (
        id, slug, title, summary, body, poster_public_id, venue, meeting_url,
        starts_at, ends_at, status, recap_body, template, published_at, created_at, updated_at
      ) values (
        ${eventId},
        ${slug},
        ${"The DataBrew Show with Consultant"},
        ${summary},
        ${"An online DataBrew conversation on Zoom with Rishabh Chhabra."},
        ${poster},
        ${"Online · Zoom"},
        null,
        ${starts},
        ${ends},
        ${"past"},
        ${"A live conversation on audit at scale, consulting paths, and moving from compliance to impact."},
        ${"default"},
        ${starts},
        now(),
        now()
      )
    `;
    console.log("seeded event:", slug);
  }

  const epSlug = slug;
  const existingEp = await sql`select id from episodes where slug = ${epSlug} limit 1`;
  if (existingEp[0]?.id) {
    console.log("episode already seeded:", epSlug);
    return;
  }
  const episodeId = randomUUID();
  const publishedAt = new Date("2026-02-21T20:00:00+05:30");
  await sql`
    insert into episodes (
      id, slug, title, summary, show_notes, status, published_at, provider, embed_url, external_url, event_id
    ) values (
      ${episodeId},
      ${epSlug},
      ${"The DataBrew Show with Consultant"},
      ${"Rishabh Chhabra on Big 4 audit, consulting, and impact at institutions like the World Bank Group."},
      ${"## Show notes\n\nGuest: **Rishabh Chhabra**, Consultant, World Bank Group; ex-Deloitte India (Audit).\n\nTopics: thinking at scale after Big 4 audit, where finance and analytics meet in global consulting, paths into institutions like the World Bank Group, and the shift from compliance to impact.\n\nThe recording embed will appear here once the core pastes a YouTube or Spotify link."},
      ${"published"},
      ${publishedAt},
      ${"youtube"},
      null,
      null,
      ${eventId}
    )
  `;
  await sql`
    insert into episode_guests (id, episode_id, name, title, organization, sort_order)
    values (
      ${randomUUID()},
      ${episodeId},
      ${"Rishabh Chhabra"},
      ${"Consultant"},
      ${"World Bank Group; ex-Deloitte India (Audit)"},
      0
    )
  `;
  console.log("seeded episode:", epSlug);
}

async function upsertFaq() {
  for (let i = 0; i < FAQ.length; i += 1) {
    const item = FAQ[i];
    const existing = await sql`
      select id from faq_items where question = ${item.question} limit 1
    `;
    if (existing[0]?.id) continue;
    await sql`
      insert into faq_items (id, question, answer, sort_order, published)
      values (${randomUUID()}, ${item.question}, ${item.answer}, ${i}, true)
    `;
    console.log("seeded faq:", item.question);
  }
}

async function upsertSitePages() {
  const pages = [
    {
      slug: "guidelines",
      title: "Community guidelines",
      body: `Be respectful in every session, channel, and collaboration.

Give credit for ideas, code, datasets, and writing that are not yours.

Do not share someone else's application materials, resume, or scores.

Use data work with care — accuracy, consent, and social impact matter.

Help peers learn. Confidence in this community comes from working together.`,
    },
    {
      slug: "privacy",
      title: "Privacy",
      body: `DataBiz stores information needed to run a student society online.

When you sign in with a MANIT college address, we keep your email, roll number, and session. Profile fields may include name, year, branch, and phone.

Applications may include a resume and portfolio link. Event RSVPs store the details you submit. Newsletter signup stores the email you provide.

Hiring data is visible to admins and to interviewers assigned to your application. We do not sell personal data.

Questions: databiz.nitb@gmail.com.`,
    },
    {
      slug: "terms",
      title: "Terms",
      body: `This site is a student-society service operated by DataBiz at NIT Bhopal.

Content is published by DataBiz core members. Accounts are for MANIT students with @stu.manit.ac.in addresses.

Do not misuse the site to harass others, scrape private hiring data, or distribute malware.

We may update these terms as the society's needs change. Continued use means you accept the current version.

Contact: databiz.nitb@gmail.com.`,
    },
  ];

  for (const page of pages) {
    await sql`
      insert into site_pages (slug, title, body, updated_at)
      values (${page.slug}, ${page.title}, ${page.body}, now())
      on conflict (slug) do update set
        title = excluded.title,
        body = excluded.body,
        updated_at = now()
    `;
    console.log("seeded site page:", page.slug);
  }
}

const authorId = await upsertTeamDebashish();
await upsertPost(authorId);
await upsertEventAndEpisode();
await upsertFaq();
await upsertSitePages();
console.log("Seed complete.");
