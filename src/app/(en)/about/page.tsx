import { proseMetadata, ProseView } from "@/views/ProseView";

export const generateMetadata = () => proseMetadata("en", "about");

export default function About() {
  return <ProseView locale="en" page="about" />;
}
