/**
 * Where the site lives, for absolute share-card URLs.
 *
 * Vercel hands the domain over on its own, so a deploy needs no configuration:
 * production builds get the project domain, previews get their own. Set
 * NEXT_PUBLIC_SITE_URL to override, for a custom domain or another host.
 */
export function siteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return new URL(explicit);

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (vercel) return new URL(`https://${vercel}`);

  return new URL("http://localhost:3000");
}
