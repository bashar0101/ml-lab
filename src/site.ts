/**
 * Public origin of the site. Set NEXT_PUBLIC_SITE_URL for a custom domain; on Vercel the
 * production domain is used automatically; locally it is the preview server.
 */
export function siteUrl(env: Record<string, string | undefined> = typeof process === "undefined" ? {} : process.env): string {
  if (env.NEXT_PUBLIC_SITE_URL) return env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "");
  if (env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3100";
}

export const SITE_URL = siteUrl();

export const GITHUB_URL = "https://github.com/bashar0101";
export const CONTACT_EMAIL = "basharhas1999@gmail.com";
