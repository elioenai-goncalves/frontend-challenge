import { ws } from "msw";

import type {
  NftUpdatedEvent,
  Order,
  OrderUpdatedEvent,
} from "@/contracts/api";

import { db } from "./db";
import { getScenario } from "./scenario";

const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";

const socketUrl = `${protocol}//${window.location.host}`;

const socketLink = ws.link(socketUrl);

interface AuthenticatedConnection {
  userId: string;
  token: string;
}

const readyClients = new Set<string>();

const authenticatedClients = new Map<string, AuthenticatedConnection>();

function validSession(token: string) {
  if (getScenario() === "session-expired") {
    return null;
  }

  const session = db().sessions.find((item) => item.token === token);

  if (!session || Date.parse(session.expiresAt) <= Date.now()) {
    return null;
  }

  const userExists = db().users.some((user) => user.id === session.userId);

  return userExists ? session : null;
}

function tokenFromConnectPacket(packet: string): string | null {
  if (packet === "40") return null;

  try {
    const parsed: unknown = JSON.parse(packet.slice(2));

    if (
      parsed !== null &&
      typeof parsed === "object" &&
      "token" in parsed &&
      typeof parsed.token === "string"
    ) {
      return parsed.token;
    }
  } catch {
    // Pacote de autenticação inválido.
  }

  return null;
}

function encodeEvent(
  name: "nft.updated" | "order.updated",
  payload: NftUpdatedEvent | OrderUpdatedEvent,
): string {
  return `42${JSON.stringify([name, payload])}`;
}

export function emitNftUpdated(event: NftUpdatedEvent): void {
  const message = encodeEvent("nft.updated", event);

  socketLink.clients.forEach((client) => {
    if (readyClients.has(client.id)) {
      client.send(message);
    }
  });
}

export function emitOrderUpdated(order: Order): void {
  const eventId = crypto.randomUUID();

  socketLink.clients.forEach((client) => {
    if (!readyClients.has(client.id)) return;

    const connection = authenticatedClients.get(client.id);

    if (!connection) return;

    if (connection.userId !== order.userId) {
      return;
    }

    const session = validSession(connection.token);

    if (!session || session.userId !== order.userId) {
      authenticatedClients.delete(client.id);
      return;
    }

    const event: OrderUpdatedEvent = {
      eventId,
      resourceId: order.id,
      version: order.version,
      occurredAt: order.updatedAt,

      sessionId: client.id,

      userId: order.userId,
      order: structuredClone(order),
    };

    client.send(encodeEvent("order.updated", event));
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

      if (typeof packet !== "string") return;

      console.info("[realtime:mock] Tipo de pacote:", packet.slice(0, 2));

      if (packet === "40" || packet.startsWith("40{")) {
        if (readyClients.has(client.id)) {
          return;
        }

        const token = tokenFromConnectPacket(packet);

        if (token) {
          const session = validSession(token);

          if (!session) {
            client.send(
              `44${JSON.stringify({
                message: "Sessão inválida ou expirada.",
              })}`,
            );
            return;
          }

          authenticatedClients.set(client.id, {
            userId: session.userId,
            token,
          });
        }

        client.send(
          `40${JSON.stringify({
            sid: client.id,
          })}`,
        );

        readyClients.add(client.id);

        console.info(
          "[realtime:mock] Socket.IO conectado:",
          client.id,
          token ? "(autenticado)" : "(visitante)",
        );

        return;
      }

      if (packet === "3") return;
    });

    client.addEventListener("close", () => {
      readyClients.delete(client.id);
      authenticatedClients.delete(client.id);

      console.info("[realtime:mock] Socket.IO desconectado:", client.id);
    });

    queueMicrotask(() => {
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

export function disconnectMockRealtimeClients(): number {
  const clients = [...socketLink.clients];

  for (const client of clients) {
    client.close(4001, "Interrupção simulada para teste");
  }

  console.info("[realtime:mock] Conexões interrompidas:", clients.length);

  return clients.length;
}
