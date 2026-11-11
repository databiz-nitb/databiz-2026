import { desc, eq, ne } from "drizzle-orm";
import { getDb, isDatabaseConfigured } from "@/db";
import { posts as postsTable } from "@/db/schema";
import { posts as seedPosts, type Post } from "@/content/posts";
import { mediaUrl } from "@/lib/media";

export type { Post };

export type PostItem = Post & {
  id?: string;
  coverPublicId?: string;
  coverUrl?: string;
};

const quantumPostSlug = "quantum-machine-learning-real-world-data";
const quantumPostSourceNote =
  "*Republished from the DataBiz blog. Source: https://www.databiz.in/blogs/6962b5113c528f3442e5e8d4*";

function withSeedIds(list: Post[]): PostItem[] {
  return list.map((post) => ({
    ...post,
    id: post.slug,
  }));
}

function mapRow(row: typeof postsTable.$inferSelect): PostItem {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    body:
      row.slug === quantumPostSlug
        ? row.body.replace(quantumPostSourceNote, "").trim()
        : row.body,
    author: row.authorName || "DataBiz",
    tags: row.tags ?? [],
    publishedAt: (row.publishedAt ?? row.createdAt).toISOString(),
    status: (row.status as Post["status"]) || "draft",
    coverPublicId: row.coverPublicId ?? undefined,
    coverUrl: mediaUrl(row.coverPublicId),
  };
}

export function isPostsDbReady() {
  return isDatabaseConfigured();
}

export async function listAdminPosts(): Promise<PostItem[]> {
  const db = getDb();
  if (!db) return withSeedIds(seedPosts);

  const rows = await db
    .select()
    .from(postsTable)
    .orderBy(desc(postsTable.updatedAt));
  return rows.map(mapRow);
}

export async function getAdminPost(id: string): Promise<PostItem | null> {
  const db = getDb();
  if (!db) {
    return withSeedIds(seedPosts).find((p) => p.id === id || p.slug === id) ?? null;
  }
  const [row] = await db
    .select()
    .from(postsTable)
    .where(eq(postsTable.id, id))
    .limit(1);
  return row ? mapRow(row) : null;
}

export async function getPublishedPosts(): Promise<PostItem[]> {
  const seed = withSeedIds(seedPosts)
    .filter((p) => p.status === "published")
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );

  const db = getDb();
  if (!db) return seed;

  const rows = await db
    .select()
    .from(postsTable)
    .where(eq(postsTable.status, "published"))
    .orderBy(desc(postsTable.publishedAt));
  const mapped = rows.map(mapRow);
  return mapped.length > 0 ? mapped : seed;
}

function isAbortLike(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const candidate = error as {
    name?: string;
    message?: string;
    cause?: { name?: string; message?: string };
  };
  const text = [
    candidate.name,
    candidate.message,
    candidate.cause?.name,
    candidate.cause?.message,
  ]
    .filter(Boolean)
    .join(" ");
  return /abort/i.test(text);
}

export async function getPostBySlug(slug: string): Promise<PostItem | null> {
  const seedMatch =
    withSeedIds(seedPosts).find(
      (p) => p.slug === slug && p.status === "published",
    ) ?? null;

  const db = getDb();
  if (!db) return seedMatch;

  const load = async () => {
    const [row] = await db
      .select()
      .from(postsTable)
      .where(eq(postsTable.slug, slug))
      .limit(1);

    if (!row || row.status === "draft") return seedMatch;
    return mapRow(row);
  };

  try {
    return await load();
  } catch (error) {
    // Neon/dev navigations often abort in-flight HTTP; retry once, then seed.
    if (!isAbortLike(error)) throw error;
    try {
      return await load();
    } catch (retryError) {
      if (isAbortLike(retryError)) {
        console.warn("[posts] getPostBySlug aborted twice for", slug);
        return seedMatch;
      }
      throw retryError;
    }
  }
}

export async function listPublicPostSlugs() {
  const seedSlugs = seedPosts
    .filter((p) => p.status === "published")
    .map((p) => p.slug);

  const db = getDb();
  if (!db) return seedSlugs;

  const rows = await db
    .select({ slug: postsTable.slug })
    .from(postsTable)
    .where(ne(postsTable.status, "draft"));
  const dbSlugs = rows.map((r) => r.slug);
  return dbSlugs.length > 0 ? dbSlugs : seedSlugs;
}

/** Cache Components requires at least one static param. */
export async function listStaticPostParams() {
  const slugs = await listPublicPostSlugs();
  return slugs.length > 0 ? slugs.map((slug) => ({ slug })) : [{ slug: "no-posts" }];
}
