import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/* ──────────────────────────────────────────
   GitHub API helpers
   ────────────────────────────────────────── */
const GH_OWNER = process.env.GITHUB_OWNER!;
const GH_REPO = process.env.GITHUB_REPO!;
const GH_TOKEN = process.env.GITHUB_TOKEN!;
const GH_BASE = "https://api.github.com";

function ghHeaders(contentType = false) {
    return {
        Authorization: `Bearer ${GH_TOKEN}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        ...(contentType ? { "Content-Type": "application/json" } : {}),
    };
}

/* ──────────────────────────────────────────
   GET /api/zenn/[slug]
   記事の生テキスト + sha を返す
   ────────────────────────────────────────── */
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        if (!slug) return Response.json({ error: "slug が必要です" }, { status: 400 });

        const apiUrl = `${GH_BASE}/repos/${GH_OWNER}/${GH_REPO}/contents/articles/${slug}.md`;

        const res = await fetch(apiUrl, {
            headers: ghHeaders(),
            cache: "no-store",
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(`GitHub API error ${res.status}: ${err.message ?? "unknown"}`);
        }

        const fileData = await res.json();
        const content = Buffer.from(fileData.content, "base64").toString("utf-8");

        return Response.json(
            { success: true, slug, content, sha: fileData.sha },
            { headers: { "Cache-Control": "no-store" } }
        );
    } catch (err) {
        console.error("[Zenn Slug API] GET error:", err);
        return Response.json(
            { error: err instanceof Error ? err.message : "Internal server error" },
            { status: 500 }
        );
    }
}

/* ──────────────────────────────────────────
   PUT /api/zenn/[slug]
   body: { content: string; sha: string; commitMessage?: string }
   記事内容を GitHub に保存する
   ────────────────────────────────────────── */
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        const { content, sha, commitMessage } = await req.json();

        if (!slug || !content || !sha) {
            return Response.json(
                { error: "slug / content / sha が必要です" },
                { status: 400 }
            );
        }

        if (!GH_OWNER || !GH_REPO || !GH_TOKEN) {
            throw new Error("GITHUB_OWNER / GITHUB_REPO / GITHUB_TOKEN が設定されていません");
        }

        const apiUrl = `${GH_BASE}/repos/${GH_OWNER}/${GH_REPO}/contents/articles/${slug}.md`;
        const newContentBase64 = Buffer.from(content, "utf-8").toString("base64");

        const putRes = await fetch(apiUrl, {
            method: "PUT",
            headers: ghHeaders(true),
            body: JSON.stringify({
                message: commitMessage ?? `docs: update article ${slug}`,
                content: newContentBase64,
                sha,
            }),
        });

        if (!putRes.ok) {
            const err = await putRes.json().catch(() => ({}));
            throw new Error(`GitHub push エラー: ${err.message ?? putRes.status}`);
        }

        const result = await putRes.json();

        return Response.json({
            success: true,
            slug,
            commitSha: result.commit?.sha ?? null,
            newSha: result.content?.sha ?? null,
        });
    } catch (err) {
        console.error("[Zenn Slug API] PUT error:", err);
        return Response.json(
            { error: err instanceof Error ? err.message : "Internal server error" },
            { status: 500 }
        );
    }
}