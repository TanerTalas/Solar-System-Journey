import { bodyBySlug } from "@/data/bodies";

export const revalidate = 86400;

type NasaItem = {
  links?: { href?: string }[];
  data?: { title?: string }[];
};

export async function GET(_request: Request, { params }: { params: Promise<{ body: string }> }) {
  const { body } = await params;
  const meta = bodyBySlug(body);
  if (!meta) return Response.json({ images: [] }, { status: 404 });

  try {
    const res = await fetch(
      `https://images-api.nasa.gov/search?media_type=image&q=${encodeURIComponent(meta.nasaQuery)}`,
      { next: { revalidate: 86400 } },
    );
    if (!res.ok) return Response.json({ images: [] });

    const json = (await res.json()) as { collection?: { items?: NasaItem[] } };
    const images = (json.collection?.items ?? [])
      .filter((item) => item.links?.[0]?.href)
      .slice(0, 9)
      .map((item) => ({ src: item.links![0].href!, title: item.data?.[0]?.title ?? "" }));

    return Response.json({ images });
  } catch {
    return Response.json({ images: [] });
  }
}
