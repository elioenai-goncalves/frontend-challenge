import { Outlet, useRouter, useRouterState } from "@tanstack/react-router";

import { endDevSession } from "@/lib/dev-session";
import { DesktopHeader } from "@/components/layout/desktop-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MobileNavigation } from "@/components/layout/mobile-navigation";

export function RouteLayout() {
  const router = useRouter();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const isConfirmation = /^\/orders\/[^/]+\/confirmation\/?$/.test(pathname);

  const showDesktopDivider =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/profile" ||
    pathname === "/wallets";

  const showDesktopFooter =
    pathname === "/" ||
    /^\/nfts\/[^/]+\/?$/.test(pathname) ||
    pathname === "/cart" ||
    pathname === "/checkout";

  async function handleEndDevSession() {
    endDevSession();

    await router.invalidate();

    await router.navigate({
      to: "/login",
      search: {},
      replace: true,
    });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {!isConfirmation && <DesktopHeader showDivider={showDesktopDivider} />}

      <MobileNavigation />

      {import.meta.env.DEV && (
        <div className="px-6 pt-4">
          <div className="mx-auto max-w-300">
            <button
              type="button"
              onClick={handleEndDevSession}
              className="text-xs text-text-secondary underline underline-offset-4"
            >
              Desenvolvimento: encerrar sessão de teste
            </button>
          </div>
        </div>
      )}

      <main
        className={[
          "px-6 py-12",
          pathname === "/"
            ? "pb-[calc(8rem+env(safe-area-inset-bottom))] lg:pb-12"
            : "",
        ].join(" ")}
      >
        <div className="mx-auto max-w-300">
          <Outlet />
        </div>
      </main>

      {showDesktopFooter && <SiteFooter />}
    </div>
  );
}
