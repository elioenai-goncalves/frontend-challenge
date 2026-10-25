import { http, HttpResponse } from "msw/http";
import { delay } from "msw/utils/delay";
import type { ListNftsResponse } from "@/contracts/api";
import { commit, db } from "../db";
import { fromUnits, toUnits } from "../decimal";
import { applyOnce, getScenario, nextCount } from "../scenario";
import { errorResponse } from "../utils";
import { toNft } from "../mappers";
import { emitNftUpdated } from "../socket-io";

const BUSINESS_PREFIXES = [
  "/api/nfts",
  "/api/favorites",
  "/api/cart",
  "/api/quotes",
  "/api/orders",
  "/api/profile",
  "/api/wallets",
];
const AUTH_OPEN_PATHS = ["/api/auth/login", "/api/auth/register"];
const OUT_OF_ORDER_DELAYS = [1500, 200, 800];

function isBusinessPath(pathname: string): boolean {
  return BUSINESS_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function stableDelay(key: string): number {
  let hash = 0;
  for (const char of key) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return 300 + (hash % 2000);
}

function positiveInt(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

async function readBody<T>(request: Request): Promise<Partial<T>> {
  try {
    return (await request.clone().json()) as Partial<T>;
  } catch {
    return {};
  }
}

function forcedValidationErrors(
  method: string,
  pathname: string,
): Record<string, string> | null {
  if (method === "POST" && pathname === "/api/auth/register") {
    return {
      name: "Informe seu nome.",
      email: "Informe um e-mail válido.",
      password: "A senha deve ter ao menos 8 caracteres.",
    };
  }
  if (method === "PATCH" && pathname === "/api/profile") {
    return { name: "Informe seu nome.", email: "Informe um e-mail válido." };
  }
  if (method === "PUT" && pathname === "/api/profile/password") {
    return { newPassword: "A senha deve ter ao menos 8 caracteres." };
  }
  if (
    (method === "POST" && pathname === "/api/wallets") ||
    (method === "PATCH" && pathname.startsWith("/api/wallets/"))
  ) {
    return { address: "Endereço inválido para a rede escolhida." };
  }
  if (method === "POST" && pathname === "/api/orders") {
    return {
      "collector.name": "Informe o nome do colecionador.",
      "collector.email": "Informe um e-mail válido.",
    };
  }
  return null;
}

async function applyScenario(request: Request): Promise<Response | undefined> {
  const url = new URL(request.url);
  const { pathname } = url;
  const { method } = request;
  const scenario = getScenario();

  switch (scenario) {
    case "empty": {
      if (method === "GET" && pathname === "/api/nfts") {
        const body: ListNftsResponse = {
          items: [],
          total: 0,
          page: positiveInt(url.searchParams.get("page"), 1),
          pageSize: Math.min(
            positiveInt(url.searchParams.get("pageSize"), 12),
            48,
          ),
        };
        return HttpResponse.json(body);
      }
      break;
    }

    case "latency": {
      await delay(stableDelay(`${method} ${pathname}${url.search}`));
      break;
    }

    case "out-of-order": {
      if (method === "GET" && pathname === "/api/nfts") {
        const index = nextCount("nfts-list");
        await delay(OUT_OF_ORDER_DELAYS[index % OUT_OF_ORDER_DELAYS.length]);
      }
      break;
    }

    case "network-error": {
      if (isBusinessPath(pathname)) return HttpResponse.error();
      break;
    }

    case "http-4xx": {
      if (isBusinessPath(pathname)) {
        return errorResponse(
          403,
          "FORBIDDEN",
          "Você não tem permissão para esta ação.",
        );
      }
      break;
    }

    case "http-5xx": {
      if (isBusinessPath(pathname)) {
        return errorResponse(
          503,
          "TRANSIENT_ERROR",
          "Serviço temporariamente indisponível. Tente novamente.",
        );
      }
      break;
    }

    case "session-expired": {
      if (
        request.headers.has("Authorization") &&
        !AUTH_OPEN_PATHS.includes(pathname)
      ) {
        return errorResponse(
          401,
          "SESSION_EXPIRED",
          "Sua sessão expirou. Entre novamente.",
        );
      }
      break;
    }

    case "register-conflict": {
      if (method === "POST" && pathname === "/api/auth/register") {
        return errorResponse(
          409,
          "CONFLICT",
          "Este e-mail já está cadastrado.",
          {
            email: "Este e-mail já está cadastrado.",
          },
        );
      }
      break;
    }

    case "validation-error": {
      const fieldErrors = forcedValidationErrors(method, pathname);
      if (fieldErrors) {
        return errorResponse(
          422,
          "VALIDATION_ERROR",
          "Verifique os campos informados.",
          fieldErrors,
        );
      }
      break;
    }

    case "coupon-invalid":
    case "coupon-expired": {
      if (method === "POST" && pathname === "/api/quotes") {
        const body = await readBody<{ couponCode: string }>(request);
        if (body.couponCode?.trim()) {
          return scenario === "coupon-invalid"
            ? errorResponse(400, "INVALID_COUPON", "Cupom inválido.", {
                couponCode: "Cupom inválido.",
              })
            : errorResponse(400, "EXPIRED_COUPON", "Este cupom expirou.", {
                couponCode: "Este cupom expirou.",
              });
        }
      }
      break;
    }

    case "price-changed":
    case "sold-out": {
      if (method === "POST" && pathname === "/api/orders") {
        const body = await readBody<{ quoteId: string }>(request);
        const firstItem = db().quotes.find((q) => q.id === body.quoteId)
          ?.items[0];
        const nft = db().nfts.find((n) => n.id === firstItem?.nftId);
        const edition = nft?.editions.find(
          (e) => e.id === firstItem?.editionId,
        );
        if (nft && edition && applyOnce(scenario)) {
          if (scenario === "price-changed") {
            edition.priceEth = fromUnits(
              (toUnits(edition.priceEth) * 110n) / 100n,
            );
          } else {
            edition.availableQuantity = 0;
          }
          nft.version += 1;
          commit();
          emitNftUpdated({
            eventId: crypto.randomUUID(),
            resourceId: nft.id,
            version: nft.version,
            occurredAt: new Date().toISOString(),
            nft: toNft(nft),
          });
        }
      }
      break;
    }

    default:
      break;
  }

  return undefined;
}

export const scenarioHandlers = [
  http.all("/api/*", ({ request }) => applyScenario(request)),
];
