import { redirect } from "next/navigation";
import { BODIES } from "@/data/bodies";

export default function ExploreIndex() {
  redirect(`/explore/${BODIES[0].slug}`);
}
