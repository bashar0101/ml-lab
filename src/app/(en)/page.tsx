import { homeMetadata, HomeView } from "@/views/HomeView";

export const generateMetadata = () => homeMetadata("en");

export default function Home() {
  return <HomeView locale="en" />;
}
