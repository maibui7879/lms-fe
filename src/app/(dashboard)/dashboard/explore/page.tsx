import { Suspense } from "react";
import type { Metadata } from "next";
import { ExploreGuestGate } from "@/components/auth/explore-guest-gate";
import { redirectAuthenticatedFromExplore } from "@/lib/require-user";
import { getDashboardRoute, paths } from "@/route";

export const metadata: Metadata = {
  title: getDashboardRoute(paths.explore)?.title,
};

async function Explore() {
  await redirectAuthenticatedFromExplore();
  return <ExploreGuestGate>{null}</ExploreGuestGate>;
}

export default function ExplorePage() {
  return (
    <Suspense fallback={null}>
      <Explore />
    </Suspense>
  );
}
