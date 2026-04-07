// app/api/trends/route.ts  ── RSS版

export const dynamic = "force-dynamic";
export const revalidate = 0;

// ── Types ──────────────────────────────────────────────────
export type TrendCategory =
  | "AI/LLM"
  | "Frontend"
  | "GIS"
  | "Japanese"
  | "Other";

export type TrendItem = {
  id: string;
  title: string;
  summary: string;
  category: TrendCategory;
  publishedAt: string; // ISO string
  sourceUrl: string;
  sourceName: string;
  isFeatured?: boolean;
};

export type TrendResponse = {
  items: TrendItem[];
  fetchedAt: string;
};

// ── Feed 定義 ──────────────────────────────────────────────
type FeedDef = {
  url: string;
  sourceName: string;
  category: TrendCategory;
  limit: number; // このフィードから最大何件取るか
};

const FEEDS: FeedDef[] = [
  // AI/LLM
  {
    url: "https://www.anthropic.com/rss.xml",
    sourceName: "Anthropic Blog",
    category: "AI/LLM",
    limit: 8,
  },
  {
    url: "https://openai.com/blog/rss.xml",
    sourceName: "OpenAI Blog",
    category: "AI/LLM",
    limit: 8,
  },
  // Frontend
  {
    url: "https://vercel.com/atom",
    sourceName: "Vercel Blog",
    category: "Frontend",
    limit: 8,
  },
  {
    url: "https://nextjs.org/feed.xml",
    sourceName: "Next.js Blog",
    category: "Frontend",
    limit: 8,
  },
  // Japanese
  {
    url: "https://zenn.dev/feed",
    sourceName: "Zenn",
    category: "Japanese",
    limit: 10,
  },
  {
    url: "https://qiita.com/popular-items/feed",
    sourceName: "Qiita",
    category: "Japanese",
    limit: 10,
  },
  // GIS
  {
    url: "https://blog.esrij.com/feed/",
    sourceName: "ESRIジャパン",
    category: "GIS",
    limit: 10,
  },
];

// ── XML パーサー ──────────────────────────────────────────
function extractTag(xml: string, tag: string): string {
  // CDATA対応
  const cdataRe = new RegExp(
    `<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${tag}>`,
    "i",
  );
  const m1 = xml.match(cdataRe);
  if (m1) return m1[1].trim();

  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const m2 = xml.match(re);
  if (m2)
    return m2[1]
      .replace(/<[^>]+>/g, "")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&#\d+;/g, "")
      .trim();
  return "";
}

function extractAttr(xml: string, tag: string, attr: string): string {
  const re = new RegExp(`<${tag}[^>]*${attr}=["']([^"']+)["'][^>]*>`, "i");
  const m = xml.match(re);
  return m ? m[1] : "";
}

/** <item> or <entry> ブロックを配列で返す */
function splitItems(xml: string): string[] {
  // RSS 2.0
  const rssItems: string[] = [];
  const rssRe = /<item[\s>]([\s\S]*?)<\/item>/gi;
  let m: RegExpExecArray | null;
  while ((m = rssRe.exec(xml)) !== null) rssItems.push(m[1]);
  if (rssItems.length > 0) return rssItems;

  // Atom
  const atomItems: string[] = [];
  const atomRe = /<entry[\s>]([\s\S]*?)<\/entry>/gi;
  while ((m = atomRe.exec(xml)) !== null) atomItems.push(m[1]);
  return atomItems;
}

/** Atom の <link href="..."> からURLを取る */
function extractLinkUrl(block: string): string {
  // <link>url</link>
  const plain = extractTag(block, "link");
  if (plain.startsWith("http")) return plain;
  // <link href="url" .../>
  const href = extractAttr(block, "link", "href");
  if (href.startsWith("http")) return href;
  return "";
}

function extractDescription(block: string): string {
  // summary → content → description の順で試す
  for (const tag of ["summary", "content", "description"]) {
    const v = extractTag(block, tag);
    if (v) return v.slice(0, 200);
  }
  return "";
}

function extractPubDate(block: string): string {
  for (const tag of ["pubDate", "published", "updated", "dc:date"]) {
    const v = extractTag(block, tag);
    if (v) {
      const d = new Date(v);
      if (!isNaN(d.getTime())) return d.toISOString();
    }
  }
  return new Date(0).toISOString();
}

// ── 1フィードを取得してパース ────────────────────────────
async function fetchFeed(def: FeedDef): Promise<TrendItem[]> {
  try {
    const res = await fetch(def.url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; LumoBlog/1.0; +https://your-domain.com)",
        Accept:
          "application/rss+xml, application/atom+xml, application/xml, text/xml",
      },
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      console.warn(`[RSS] ${def.sourceName}: HTTP ${res.status}`);
      return [];
    }

    const xml = await res.text();
    const blocks = splitItems(xml);

    const items: TrendItem[] = blocks
      .slice(0, def.limit)
      .map((block, idx) => {
        const title = extractTag(block, "title") || "(no title)";
        const sourceUrl = extractLinkUrl(block);
        const summary = extractDescription(block);
        const publishedAt = extractPubDate(block);

        return {
          id: `${def.category}-${def.sourceName}-${idx}`,
          title,
          summary,
          category: def.category,
          publishedAt,
          sourceUrl,
          sourceName: def.sourceName,
          isFeatured: false,
        };
      })
      .filter((item) => item.sourceUrl !== ""); // URLなしは除外

    console.log(`[RSS] ${def.sourceName}: ${items.length} items`);
    return items;
  } catch (err) {
    console.warn(`[RSS] ${def.sourceName} failed:`, (err as Error).message);
    return [];
  }
}

// ── 全フィードを並列取得 ─────────────────────────────────
async function fetchAllFeeds(): Promise<TrendItem[]> {
  const results = await Promise.allSettled(FEEDS.map(fetchFeed));
  return results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
}

// ── GET /api/trends ─────────────────────────────────────────
export async function GET() {
  try {
    const items = await fetchAllFeeds();

    // 新しい順にソート
    items.sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );

    // カテゴリごとの先頭記事を featured 候補にする（最新記事）
    const featuredIds = new Set<string>();
    const seenCategories = new Set<TrendCategory>();
    for (const item of items) {
      if (!seenCategories.has(item.category)) {
        featuredIds.add(item.id);
        seenCategories.add(item.category);
      }
    }

    // 全体の先頭1件だけ isFeatured = true
    let markedFeatured = false;
    items.forEach((item) => {
      if (!markedFeatured) {
        item.isFeatured = true;
        markedFeatured = true;
      }
    });

    const response: TrendResponse = {
      items,
      fetchedAt: new Date().toISOString(),
    };

    return Response.json(response, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=1800",
      },
    });
  } catch (err) {
    console.error("[Trends RSS] Error:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }
}
