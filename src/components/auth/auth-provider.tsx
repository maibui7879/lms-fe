"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { authService, clearClientSession } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth-store";
import { useRouter } from "next/navigation";
import { safeReturnPath } from "@/lib/auth-path";
import { isPublicDashboardPath } from "@/route/paths";
import type { AuthUser } from "@/lib/types";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  login: typeof authService.login;
  logout: typeof authService.logout;
  refreshSession: typeof authService.refreshSession;
  reloadSession: () => Promise<void>;
}
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const session = useAuthStore((state) => state.session);
  const loading = useAuthStore((state) => state.loading);
  const [error, setError] = useState<string | null>(null);
  async function reloadSession() {
    setError(null);
    useAuthStore.setState({ loading: true });
    try {
      await authService.restoreSession();
    } catch {
      setError("Không thể kiểm tra phiên đăng nhập. Vui lòng thử lại.");
    }
  }
  useEffect(() => {
    let active = true;
    authService.restoreSession().catch(() => {
      if (active)
        setError("Không thể kiểm tra phiên đăng nhập. Vui lòng thử lại.");
    });
    const expired = () => {
      clearClientSession();
      setError(null);
      if (
        window.location.pathname.startsWith("/dashboard") &&
        !isPublicDashboardPath(window.location.pathname)
      ) {
        router.replace(
          `/login?next=${encodeURIComponent(safeReturnPath(window.location.pathname + window.location.search))}`,
        );
        router.refresh();
      }
    };
    window.addEventListener("lms:unauthorized", expired);
    const channel =
      typeof BroadcastChannel === "undefined"
        ? null
        : new BroadcastChannel("lms-auth");
    if (channel)
      channel.onmessage = (event: MessageEvent) => {
        if (event.data === "logout") {
          clearClientSession();
          setError(null);
          router.refresh();
          return;
        }
        authService.restoreSession().catch(() => {
          if (active)
            setError("Không thể kiểm tra phiên đăng nhập. Vui lòng thử lại.");
        });
      };
    return () => {
      active = false;
      channel?.close();
      window.removeEventListener("lms:unauthorized", expired);
    };
  }, [router]);
  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        loading,
        error,
        login: async (input) => {
          setError(null);
          return authService.login(input);
        },
        logout: async () => {
          setError(null);
          await authService.logout();
        },
        refreshSession: authService.refreshSession,
        reloadSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
