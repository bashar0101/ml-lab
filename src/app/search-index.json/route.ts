import { searchIndexResponse } from "@/search/route";

export const dynamic = "force-static";

/** Written to out/search-index.json at build time; the search palette fetches it on first open. */
export function GET() {
  return searchIndexResponse("en");
}
