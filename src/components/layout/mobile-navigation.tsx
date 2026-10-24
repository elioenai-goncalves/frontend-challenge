import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import mobileTabBar from "@/assets/navigation/mobile-tab-bar.svg";
import mobileMenuSymbol from "@/assets/navigation/mobile-menu-symbol.svg";
import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import {
  ArrowLeft,
  Heart,
  House,
  Menu,
  Search,
  ShoppingCart,
  UserRound,
  X,
} from "lucide-react";

const focusClassName =
  "rounded focus-visible:outline-2 focus-visible:outline-offset-4 " +
  "focus-visible:outline-primary";

export function MobileNavigation() {
  const router = useRouter();

  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const dialogId = useId();
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const isHome = pathname === "/";

  const isStandalone =
    pathname === "/login" ||
    pathname === "/register" ||
    /^\/orders\/[^/]+\/confirmation\/?$/.test(pathname);

  const pageTitle =
    pathname === "/cart"
      ? "Carrinho de NFTs"
      : pathname === "/checkout"
        ? "Pagamento"
        : pathname === "/profile"
          ? "Perfil do colecionador"
          : pathname === "/wallets"
            ? "Carteiras"
            : pathname.startsWith("/nfts/")
              ? "Detalhes do NFT"
              : "Kurio";

  function openMenu(trigger: HTMLButtonElement) {
    const dialog = dialogRef.current;

    if (!dialog || dialog.open) return;

    triggerRef.current = trigger;
    dialog.showModal();
    setIsOpen(true);
    closeButtonRef.current?.focus();
  }

  function closeMenu() {
    dialogRef.current?.close();
  }

  function handleClose() {
    setIsOpen(false);

    if (triggerRef.current?.isConnected) {
      triggerRef.current.focus();
    }
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const search = String(formData.get("search") ?? "").trim();

    void router.navigate({
      to: "/",
      search: (previous) => ({
        ...previous,
        search: search || undefined,
        page: 1,
      }),
    });
  }

  useEffect(() => {
    dialogRef.current?.close();
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 64rem)");

    function handleResize() {
      if (media.matches) {
        dialogRef.current?.close();
      }
    }

    media.addEventListener("change", handleResize);

    return () => {
      media.removeEventListener("change", handleResize);
    };
  }, []);

  if (isStandalone) return null;

  return (
    <div className="lg:hidden">
      <header className="px-6 pt-6">
        <div className="mx-auto flex max-w-300 items-center gap-3">
          {isHome ? (
            <form
              role="search"
              aria-label="Buscar NFTs"
              onSubmit={handleSearch}
              className="flex min-w-0 flex-1 items-center rounded-lg bg-card px-3"
            >
              <label htmlFor="mobile-catalog-search" className="sr-only">
                Buscar NFTs
              </label>

              <input
                id="mobile-catalog-search"
                name="search"
                type="search"
                placeholder="Explorar coleções"
                className={`min-h-11 min-w-0 flex-1 bg-transparent text-xs text-foreground placeholder:text-text-secondary ${focusClassName}`}
              />

              <button
                type="submit"
                aria-label="Buscar"
                className={`inline-flex size-11 shrink-0 items-center justify-center text-primary ${focusClassName}`}
              >
                <Search size={20} aria-hidden="true" />
              </button>
            </form>
          ) : (
            <>
              <Link
                to="/"
                search={{}}
                aria-label="Voltar ao início"
                className={`inline-flex size-11 shrink-0 items-center justify-center bg-card text-primary ${focusClassName}`}
              >
                <ArrowLeft size={20} aria-hidden="true" />
              </Link>

              <p className="min-w-0 flex-1 text-center text-sm font-bold">
                {pageTitle}
              </p>
            </>
          )}

          <button
            type="button"
            aria-label="Abrir menu de navegação"
            aria-haspopup="dialog"
            aria-controls={dialogId}
            aria-expanded={isOpen}
            onClick={(event) => openMenu(event.currentTarget)}
            className={`mobile-menu-trigger inline-flex shrink-0 items-center justify-center bg-primary text-primary-foreground ${focusClassName}`}
          >
            <Menu size={20} aria-hidden="true" />
          </button>
        </div>
      </header>

      {isHome && (
        <nav aria-label="Navegação inferior" className="mobile-tab-bar">
          <img
            src={mobileTabBar}
            alt=""
            aria-hidden="true"
            draggable={false}
            className="mobile-tab-bar__background"
          />

          <div className="mobile-tab-bar__items">
            <Link
              to="/"
              search={{}}
              aria-label="Início"
              aria-current="page"
              className={`mobile-tab-bar__item text-primary ${focusClassName}`}
            >
              <House
                size={20}
                fill="currentColor"
                strokeWidth={1.5}
                aria-hidden="true"
              />
            </Link>

            <button
              type="button"
              disabled
              aria-label="Favoritos — indisponível nesta etapa"
              className="mobile-tab-bar__item cursor-not-allowed text-text-secondary opacity-60"
            >
              <Heart
                size={20}
                fill="currentColor"
                strokeWidth={1.5}
                aria-hidden="true"
              />
            </button>

            <span aria-hidden="true" />

            <Link
              to="/cart"
              aria-label="Carrinho"
              className={`mobile-tab-bar__item text-text-secondary ${focusClassName}`}
            >
              <ShoppingCart
                size={20}
                fill="currentColor"
                strokeWidth={1.5}
                aria-hidden="true"
              />
            </Link>

            <Link
              to="/profile"
              aria-label="Meu perfil"
              className={`mobile-tab-bar__item text-text-secondary ${focusClassName}`}
            >
              <UserRound
                size={20}
                fill="currentColor"
                strokeWidth={1.5}
                aria-hidden="true"
              />
            </Link>
          </div>

          <button
            type="button"
            aria-label="Abrir menu de navegação"
            aria-haspopup="dialog"
            aria-controls={dialogId}
            aria-expanded={isOpen}
            onClick={(event) => openMenu(event.currentTarget)}
            className={`mobile-tab-bar__center ${focusClassName}`}
          >
            <img
              src={mobileMenuSymbol}
              alt=""
              aria-hidden="true"
              draggable={false}
              width={27}
              height={24}
              className="pointer-events-none"
            />
          </button>
        </nav>
      )}

      <dialog
        ref={dialogRef}
        id={dialogId}
        aria-labelledby={titleId}
        onClose={handleClose}
        className="mobile-navigation-dialog"
      >
        <div className="flex items-center justify-between gap-4">
          <h2 id={titleId} className="text-lg font-bold">
            Navegação
          </h2>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={closeMenu}
            aria-label="Fechar menu"
            className={`inline-flex size-11 items-center justify-center ${focusClassName}`}
          >
            <X size={22} aria-hidden="true" />
          </button>
        </div>

        <nav aria-label="Menu mobile" className="mt-6 flex flex-col gap-2">
          <Link
            to="/"
            search={{}}
            onClick={closeMenu}
            className={`px-3 py-3 ${focusClassName}`}
          >
            Início / catálogo
          </Link>

          <Link
            to="/cart"
            onClick={closeMenu}
            className={`px-3 py-3 ${focusClassName}`}
          >
            Carrinho
          </Link>

          <Link
            to="/profile"
            onClick={closeMenu}
            className={`px-3 py-3 ${focusClassName}`}
          >
            Meu perfil
          </Link>

          <Link
            to="/wallets"
            onClick={closeMenu}
            className={`px-3 py-3 ${focusClassName}`}
          >
            Carteiras
          </Link>

          <Link
            to="/login"
            search={{}}
            onClick={closeMenu}
            className={`px-3 py-3 ${focusClassName}`}
          >
            Entrar
          </Link>

          <Link
            to="/register"
            onClick={closeMenu}
            className={`px-3 py-3 ${focusClassName}`}
          >
            Criar conta
          </Link>
        </nav>
      </dialog>
    </div>
  );
}
