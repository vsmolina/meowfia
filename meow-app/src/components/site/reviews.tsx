import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { Stars } from "@/components/site/stars";
import { ReviewForm } from "@/components/site/review-form";

/** Reviews list + summary + (if eligible) the review form */
export async function Reviews({ templateId, productId, canReview }: { templateId?: string; productId?: string; canReview: boolean }) {
  const where = { approved: true, ...(templateId ? { templateId } : { productId }) };
  const [reviews, agg] = await Promise.all([
    db.review.findMany({ where, orderBy: { createdAt: "desc" }, take: 20 }),
    db.review.aggregate({ where, _avg: { rating: true }, _count: { _all: true } }),
  ]);
  const avg = agg._avg.rating ?? 0;
  const count = agg._count._all;
  const dist = [5, 4, 3, 2, 1].map((r) => ({ r, n: reviews.filter((x) => x.rating === r).length }));

  return (
    <section id="reviews" aria-labelledby="reviews-h" className="scroll-mt-24">
      <h2 id="reviews-h" className="font-stencil text-2xl text-olive-dark">After-action reports</h2>
      <div className="mt-4 grid gap-8 md:grid-cols-[240px_1fr]">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <p className="font-stencil text-4xl">{count ? avg.toFixed(1) : "-"}</p>
            <div>
              <Stars rating={avg} />
              <p className="text-sm text-muted-foreground">{count} review{count === 1 ? "" : "s"}</p>
            </div>
          </div>
          <ul className="space-y-1">
            {dist.map(({ r, n }) => (
              <li key={r} className="flex items-center gap-2 text-xs">
                <span className="w-3">{r}</span>
                <span className="h-2 flex-1 overflow-hidden rounded bg-ink/10">
                  <span className="block h-full bg-[#d4a72c]" style={{ width: `${reviews.length ? (n / reviews.length) * 100 : 0}%` }} />
                </span>
                <span className="w-5 text-right text-muted-foreground">{n}</span>
              </li>
            ))}
          </ul>
          {canReview ? (
            <ReviewForm templateId={templateId} productId={productId} />
          ) : (
            <p className="text-xs text-muted-foreground">Reviews are from verified owners. Buy or claim it to share your report.</p>
          )}
        </div>
        <ul className="space-y-4">
          {reviews.length === 0 && <li className="text-muted-foreground">No reports filed yet. Be the first recruit to review it.</li>}
          {reviews.map((rv) => (
            <li key={rv.id} className="rounded-lg border-2 border-ink/70 bg-paper p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Stars rating={rv.rating} />
                <p className="text-xs text-muted-foreground">{formatDate(rv.createdAt)}</p>
              </div>
              {rv.title && <p className="mt-2 font-semibold">{rv.title}</p>}
              <p className="mt-1 text-sm">{rv.body}</p>
              <p className="mt-2 font-mono text-[0.7rem] uppercase tracking-widest text-muted-foreground">{rv.authorName} · verified recruit</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
