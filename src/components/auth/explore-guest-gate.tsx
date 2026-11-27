"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./auth-provider";
import { paths } from "@/route/paths";

/** Covers client navigation and refresh-only sessions as well as full reloads. */
export function ExploreGuestGate({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (user?.id) {
      router.replace(paths.dashboard);
      router.refresh();
    }
  }, [user?.id, router]);
  return user ? <p role="status">Đang mở dashboard…</p> : children;
}
