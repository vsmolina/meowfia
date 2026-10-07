import Link from "next/link";
import { TikTokEmbed } from "@/components/brand/tiktok-embed";

export type VideoCardData = { id: string; url: string; tiktokId: string | null; title: string; thumbnailUrl: string | null; template?: { slug: string; name: string } | null };

export function VideoCard({ video }: { video: VideoCardData }) {
  return (
    <div className="space-y-2">
      <TikTokEmbed videoId={video.tiktokId} url={video.url} title={video.title} thumbnailUrl={video.thumbnailUrl} />
      {video.template && (
        <Link href={`/fleet/${video.template.slug}`} className="block rounded-md border-2 border-ink bg-paper px-3 py-2 text-center text-sm font-semibold shadow-stamp-sm transition hover:-translate-y-0.5 hover:bg-[#e7d27c]">
          Get the {video.template.name} template →
        </Link>
      )}
    </div>
  );
}
