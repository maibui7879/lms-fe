"use client";

import { create } from "zustand";
import type { ClientSession } from "@/lib/types";

interface AuthState {
  session: ClientSession | null;
  loading: boolean;
  setSession: (session: ClientSession) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  loading: true,
  setSession: (session) =>
    set({ session: { user: session.user }, loading: false }),
  clearSession: () => set({ session: null, loading: false }),
}));
