import { proseMetadata, ProseView } from "@/views/ProseView";

export const generateMetadata = () => proseMetadata("en", "terms");

export default function Terms() {
  return <ProseView locale="en" page="terms" />;
}
