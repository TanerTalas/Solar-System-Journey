import { ExploreShell } from "@/components/explore/explore-shell";

/** the canvas lives in the layout so the scene survives body-to-body navigation */
export default function ExploreLayout({ children }: LayoutProps<"/explore">) {
  return <ExploreShell>{children}</ExploreShell>;
}
