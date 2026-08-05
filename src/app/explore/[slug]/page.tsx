import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BodyPanel } from "@/components/explore/body-panel";
import { BODIES, bodyBySlug } from "@/data/bodies";

export function generateStaticParams() {
  return BODIES.map((body) => ({ slug: body.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/explore/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const body = bodyBySlug(slug);
  if (!body) return {};

  return {
    title: `${body.name} · Solar System Journey`,
    description: body.short,
  };
}

export default async function BodyPage({ params }: PageProps<"/explore/[slug]">) {
  const { slug } = await params;
  const body = bodyBySlug(slug);
  if (!body) notFound();

  // a fresh caption per body, so the fade-up replays on every arrival
  return <BodyPanel key={body.slug} body={body} />;
}
