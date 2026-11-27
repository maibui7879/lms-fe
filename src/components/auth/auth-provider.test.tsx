import { StrictMode } from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "./auth-provider";
import { authRequest } from "@/lib/auth-client";
import { ApiClientError } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth-store";

vi.mock("@/lib/auth-client", () => ({ authRequest: vi.fn() }));
const { router } = vi.hoisted(() => ({
  router: { replace: vi.fn(), refresh: vi.fn() },
}));
vi.mock("next/navigation", () => ({
  useRouter: () => router,
}));
const identity = {
  user: { id: "u1", email: "student@example.test", role: "STUDENT" as const },
};
function Consumer() {
  const { user, loading, logout } = useAuth();
  return (
    <>
      <p>{loading ? "Checking session" : user?.email || "Signed out"}</p>
      <button onClick={() => logout()}>Sign out</button>
    </>
  );
}
beforeEach(() => {
  vi.mocked(authRequest).mockReset();
  useAuthStore.setState({ session: null, loading: true });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("AuthProvider", () => {
  it("clears another tab on logout without restoring its cookie session", async () => {
    const channels: { onmessage: ((event: MessageEvent) => void) | null }[] =
      [];
    vi.stubGlobal(
      "BroadcastChannel",
      class {
        onmessage: ((event: MessageEvent) => void) | null = null;
        constructor() {
          channels.push(this);
        }
        close() {}
      },
    );
    vi.mocked(authRequest).mockResolvedValueOnce(identity);
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );
    await screen.findByText(identity.user.email);
    channels[0].onmessage?.(new MessageEvent("message", { data: "logout" }));
    await screen.findByText("Signed out");
    expect(authRequest).toHaveBeenCalledTimes(1);
    expect(router.refresh).toHaveBeenCalled();
  });
  it("restores identity after reload without putting tokens in browser state", async () => {
    vi.mocked(authRequest).mockResolvedValueOnce(identity);
    render(
      <StrictMode>
        <AuthProvider>
          <Consumer />
        </AuthProvider>
      </StrictMode>,
    );
    expect(await screen.findByText(identity.user.email)).toBeInTheDocument();
    expect(authRequest).toHaveBeenCalledTimes(1);
    expect(authRequest).toHaveBeenCalledWith("session");
    expect(useAuthStore.getState().session).toEqual(identity);
    expect(localStorage.length).toBe(0);
  });
  it("finishes session checking when there is no valid cookie session", async () => {
    vi.mocked(authRequest).mockRejectedValueOnce(
      new ApiClientError(
        "Unauthorized",
        401,
        "UNAUTHORIZED",
        undefined,
        undefined,
        {},
      ),
    );
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );
    expect(await screen.findByText("Signed out")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
  it("clears identity when signing out", async () => {
    vi.mocked(authRequest)
      .mockResolvedValueOnce(identity)
      .mockResolvedValueOnce(null);
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );
    await screen.findByText(identity.user.email);
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Sign out" }));
    await waitFor(() => expect(useAuthStore.getState().session).toBeNull());
    expect(authRequest).toHaveBeenCalledWith("logout");
  });
});
