import { SiteShell } from "@/components/SiteShell";
import { NotFoundView } from "@/views/NotFoundView";

export default function NotFound() {
  return (
    <SiteShell locale="en">
      <NotFoundView locale="en" />
    </SiteShell>
  );
}
