import { Outlet, useRouterState } from "@tanstack/react-router";

import { DesktopHeader } from "@/components/layout/desktop-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MobileNavigation } from "@/components/layout/mobile-navigation";

export function RouteLayout() {
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      {!isConfirmation && <DesktopHeader showDivider={showDesktopDivider} />}

      <MobileNavigation />

      <main
        className={[
          "px-6 py-6 lg:py-12",
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