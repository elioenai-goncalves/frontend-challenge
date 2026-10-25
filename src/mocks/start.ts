import { worker } from "./browser";
import { commit, db, initMockDb, resetMockDb } from "./db";
import {
  clearScenario,
  getScenario,
  isScenario,
  SCENARIOS,
  setScenario,
  type ScenarioName,
} from "./scenario";

import type { NftUpdatedEvent } from "@/contracts/api";
import type { RealtimeSocket } from "@/lib/realtime-client";
import { toNft } from "./mappers";
import { emitNftUpdated } from "./socket-io";

interface UpdateNftEditionInput {
  nftId: string;
  editionId: string;
  priceEth?: string;
  availableQuantity?: number;
}

let probeSocket: RealtimeSocket | null = null;

function updateNftEdition(input: UpdateNftEditionInput): NftUpdatedEvent {
  const nft = db().nfts.find((item) => item.id === input.nftId);

  if (!nft) {
    throw new Error("NFT não encontrado.");
  }

  const edition = nft.editions.find((item) => item.id === input.editionId);

  if (!edition) {
    throw new Error("Edição não encontrada.");
  }

  if (input.priceEth === undefined && input.availableQuantity === undefined) {
    throw new Error("Informe priceEth ou availableQuantity.");
  }

  if (
    input.priceEth !== undefined &&
    (!/^\d+(?:\.\d{1,18})?$/.test(input.priceEth) ||
      !/[1-9]/.test(input.priceEth))
  ) {
    throw new Error(
      "Preço ETH inválido. Use uma string decimal positiva com até 18 casas.",
    );
  }

  if (
    input.availableQuantity !== undefined &&
    (!Number.isSafeInteger(input.availableQuantity) ||
      input.availableQuantity < 0)
  ) {
    throw new Error("A disponibilidade deve ser um inteiro não negativo.");
  }

  const priceChanged =
    input.priceEth !== undefined && edition.priceEth !== input.priceEth;

  const stockChanged =
    input.availableQuantity !== undefined &&
    edition.availableQuantity !== input.availableQuantity;

  // Não publica um evento se nada mudou.
  if (!priceChanged && !stockChanged) {
    throw new Error("Nenhum dado foi alterado.");
  }

  if (input.priceEth !== undefined) {
    edition.priceEth = input.priceEth;
  }

  if (input.availableQuantity !== undefined) {
    edition.availableQuantity = input.availableQuantity;
  }

  nft.version += 1;
  commit();

  const event: NftUpdatedEvent = {
    eventId: crypto.randomUUID(),
    resourceId: nft.id,
    version: nft.version,
    occurredAt: new Date().toISOString(),
    nft: toNft(nft),
  };

  emitNftUpdated(event);

  console.info("[realtime:mock] nft.updated emitido:", event);

  return event;
}
declare global {
  interface Window {
    mocks?: {
      reset: (reload?: boolean) => Promise<void>;
      scenario: () => ScenarioName;
      scenarios: readonly ScenarioName[];
      setScenario: (name: string) => void;
      probeRealtime: () => Promise<void>;
      stopRealtimeProbe: () => void;
      updateNftEdition: (input: UpdateNftEditionInput) => NftUpdatedEvent;
    };
  }
}

export async function startMocks(): Promise<void> {
  await initMockDb();
  window.mocks = {
    reset: async (reload = true) => {
      clearScenario();
      await resetMockDb();
      if (reload) window.location.reload();
    },
    scenario: getScenario,
    scenarios: SCENARIOS,
    setScenario: (name) => {
      if (!isScenario(name)) {
        throw new Error(
          `Cenário inválido: "${name}". Use um de: ${SCENARIOS.join(", ")}`,
        );
      }
      setScenario(name);
      console.info(`[mocks] Cenário ativo: ${name}`);
    },
    probeRealtime: async () => {
      const { createRealtimeSocket } = await import("@/lib/realtime-client");

      probeSocket?.disconnect();

      const socket = createRealtimeSocket();

      probeSocket = socket;

      socket.on("connect", () => {
        console.info("[realtime:client] Conectado:", socket.id);
      });

      socket.on("connect_error", (error) => {
        console.error("[realtime:client] Erro de conexão:", error.message);
      });

      socket.on("disconnect", (reason) => {
        console.info("[realtime:client] Desconectado:", reason);
      });

      socket.on("nft.updated", (event) => {
        console.info("[realtime:client] nft.updated recebido:", event);
      });

      socket.on("order.updated", (event) => {
        console.info("[realtime:client] order.updated recebido:", event);
      });

      socket.connect();
    },

    stopRealtimeProbe: () => {
      probeSocket?.disconnect();
      probeSocket = null;
    },

    updateNftEdition,
  };
  await worker.start({ onUnhandledFrame: "bypass" });
}
