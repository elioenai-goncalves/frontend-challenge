import { ws } from "msw";

import type { NftUpdatedEvent, OrderUpdatedEvent } from "@/contracts/api";

const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";

const socketUrl = `${protocol}//${window.location.host}`;

const socketLink = ws.link(socketUrl);

const readyClients = new Set<string>();

function encodeEvent(
  eventName: "nft.updated" | "order.updated",
  payload: NftUpdatedEvent | OrderUpdatedEvent,
): string {
  return `42${JSON.stringify([eventName, payload])}`;
}

export function emitNftUpdated(event: NftUpdatedEvent): void {
  const message = encodeEvent("nft.updated", event);

  socketLink.clients.forEach((client) => {
    if (readyClients.has(client.id)) {
      client.send(message);
    }
  });
}

export function emitOrderUpdated(event: OrderUpdatedEvent): void {
  const message = encodeEvent("order.updated", event);

  socketLink.clients.forEach((client) => {
    if (readyClients.has(client.id)) {
      client.send(message);
    }
  });
}

export const realtimeHandlers = [
  socketLink.addEventListener("connection", ({ client }) => {
    console.info(
      "[realtime:mock] WebSocket interceptado:",
      client.url.toString(),
    );
    client.addEventListener("message", (messageEvent) => {
      const packet = messageEvent.data;

      console.info("[realtime:mock] Pacote recebido:", packet);

      if (packet === "40") {
        client.send(
          `40${JSON.stringify({
            sid: client.id,
          })}`,
        );

        readyClients.add(client.id);

        console.info("[realtime:mock] Socket.IO conectado:", client.id);

        return;
      }

      if (packet === "3") return;
    });

    client.addEventListener("close", () => {
      readyClients.delete(client.id);

      console.info("[realtime:mock] Socket.IO desconectado:", client.id);
    });

    queueMicrotask(() => {
      console.info("[realtime:mock] Enviando handshake Engine.IO");

      client.send(
        `0${JSON.stringify({
          sid: client.id,
          upgrades: [],
          pingInterval: 2_000_000_000,
          pingTimeout: 100_000_000,
          maxPayload: 1_000_000,
        })}`,
      );
    });
  }),
];
