import { proseMetadata, ProseView } from "@/views/ProseView";

export const generateMetadata = () => proseMetadata("en", "privacy");

export default function Privacy() {
  return <ProseView locale="en" page="privacy" />;
}
