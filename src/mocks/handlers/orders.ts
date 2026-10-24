import { http, HttpResponse } from "msw/http";
import type { CreateOrderRequest, Order, OrderResponse } from "@/contracts/api";
import { commit, db } from "../db";
import { authenticate, errorResponse, readJson } from "../utils";
import { EMAIL_PATTERN } from "./auth";
import { delay } from "msw/utils/delay";
import { applyOnce, getScenario } from "../scenario";

function randomHex(bytes: number): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(bytes)), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}

export const orderHandlers = [
  http.post("/api/orders", async ({ request }) => {
    const auth = authenticate(request);
    if ("response" in auth) return auth.response;

    const body = await readJson<CreateOrderRequest>(request);
    const name = body.collector?.name?.trim() ?? "";
    const email = body.collector?.email?.trim() ?? "";

    const fieldErrors: Record<string, string> = {};
    if (!body.quoteId) fieldErrors.quoteId = "Cotação obrigatória.";
    if (!body.walletId) fieldErrors.walletId = "Selecione uma carteira.";
    if (name.length < 2)
      fieldErrors["collector.name"] = "Informe o nome do colecionador.";
    if (!EMAIL_PATTERN.test(email))
      fieldErrors["collector.email"] = "Informe um e-mail válido.";
    if (Object.keys(fieldErrors).length > 0) {
      return errorResponse(
        422,
        "VALIDATION_ERROR",
        "Verifique os campos informados.",
        fieldErrors,
      );
    }

    const quote = db().quotes.find((q) => q.id === body.quoteId);
    const cart = db().carts.find((c) => c.userId === auth.user.id);
    if (!quote || !cart || quote.cartId !== cart.id) {
      return errorResponse(404, "NOT_FOUND", "Cotação não encontrada.");
    }
    if (
      new Date(quote.expiresAt).getTime() <= Date.now() ||
      quote.cartVersion !== cart.version
    ) {
      return errorResponse(
        409,
        "QUOTE_CHANGED",
        "A cotação mudou. Revise os valores e confirme novamente.",
      );
    }

    const wallet = (db().wallets[auth.user.id] ?? []).find(
      (w) => w.id === body.walletId,
    );
    if (!wallet) {
      return errorResponse(422, "VALIDATION_ERROR", "Carteira inválida.", {
        walletId: "Selecione uma das suas carteiras.",
      });
    }
    if (wallet.network !== body.network || body.network !== quote.network) {
      return errorResponse(422, "VALIDATION_ERROR", "Rede incompatível.", {
        network: "A rede deve ser a mesma da carteira e da cotação.",
      });
    }

    const purchases = quote.items.map((item) => {
      const nft = db().nfts.find((n) => n.id === item.nftId);
      const edition = nft?.editions.find((e) => e.id === item.editionId);
      return { item, nft, edition };
    });
    for (const { item, edition } of purchases) {
      if (!edition || edition.availableQuantity < item.quantity) {
        return errorResponse(
          409,
          "OUT_OF_STOCK",
          `${item.nftName} não tem mais estoque suficiente.`,
        );
      }
      if (edition.priceEth !== item.unitPriceEth) {
        return errorResponse(
          409,
          "QUOTE_CHANGED",
          "O preço de um item mudou. Revise os valores e confirme novamente.",
        );
      }
    }

    if (getScenario() === "payment-refused") {
      const refusedAt = new Date().toISOString();
      const refused: Order = {
        id: crypto.randomUUID(),
        userId: auth.user.id,
        status: "rejected",
        receipt: structuredClone(quote),
        collector: { name, email },
        wallet: { ...wallet },
        transactionReference: null,
        rejectionReason:
          "Pagamento recusado pela rede. Tente novamente ou use outra carteira.",
        createdAt: refusedAt,
        updatedAt: refusedAt,
        version: 1,
      };
      db().orders.push(refused);
      commit();
      const refusedResponse: OrderResponse = { order: refused };
      return HttpResponse.json(refusedResponse, { status: 201 });
    }

    for (const { item, nft, edition } of purchases) {
      if (!nft || !edition) continue;
      edition.availableQuantity -= item.quantity;
      nft.version += 1;
    }

    const now = new Date().toISOString();
    const order: Order = {
      id: crypto.randomUUID(),
      userId: auth.user.id,
      status: "confirmed",
      receipt: structuredClone(quote),
      collector: { name, email },
      wallet: { ...wallet },
      transactionReference: `0x${randomHex(32)}`,
      rejectionReason: null,
      createdAt: now,
      updatedAt: now,
      version: 1,
    };
    db().orders.push(order);

    cart.items = cart.items.filter(
      (ci) =>
        !quote.items.some(
          (qi) => qi.nftId === ci.nftId && qi.editionId === ci.editionId,
        ),
    );
    cart.version += 1;
    commit();

    if (getScenario() === "order-timeout" && applyOnce("order-timeout")) {
      await delay(3000);
      return HttpResponse.error();
    }

    const response: OrderResponse = { order };
    return HttpResponse.json(response, { status: 201 });
  }),

  http.get("/api/orders/:orderId", ({ request, params }) => {
    const auth = authenticate(request);
    if ("response" in auth) return auth.response;

    const order = db().orders.find(
      (o) => o.id === params.orderId && o.userId === auth.user.id,
    );
    if (!order)
      return errorResponse(404, "NOT_FOUND", "Pedido não encontrado.");
    const response: OrderResponse = { order };
    return HttpResponse.json(response);
  }),
];
