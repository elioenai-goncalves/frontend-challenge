import { http, HttpResponse } from "msw/http";
import type {
  ListNftsResponse,
  Network,
  NftResponse,
  NftSort,
} from "@/contracts/api";
import { db } from "../db";
import { ETH_PATTERN, toUnits } from "../decimal";
import { listingPrice, toNft } from "../mappers";
import { errorResponse } from "../utils";

const NETWORKS: Network[] = ["ethereum", "polygon", "solana"];
const SORTS: NftSort[] = ["recent", "price-asc", "price-desc", "name-asc"];
const DEFAULT_PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 48;

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function positiveInt(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function ethUnits(value: string | null): bigint | null {
  return value && ETH_PATTERN.test(value) ? toUnits(value) : null;
}

function compare(a: bigint, b: bigint): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function comparePrice(
  a: bigint | null,
  b: bigint | null,
  direction: 1 | -1,
): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return compare(a, b) * direction;
}

export const nftHandlers = [
  http.get("/api/nfts", ({ request }) => {
    const params = new URL(request.url).searchParams;

    const search = normalize(params.get("search")?.trim() ?? "");
    const collectionIds = params.getAll("collectionIds");
    const categories = params.getAll("categories").map(normalize);
    const networks = params
      .getAll("networks")
      .filter((value): value is Network => NETWORKS.includes(value as Network));
    const minPrice = ethUnits(params.get("minPriceEth"));
    const maxPrice = ethUnits(params.get("maxPriceEth"));
    const sortParam = params.get("sort") as NftSort | null;
    const sort: NftSort =
      sortParam && SORTS.includes(sortParam) ? sortParam : "recent";
    const page = positiveInt(params.get("page"), 1);
    const pageSize = Math.min(
      positiveInt(params.get("pageSize"), DEFAULT_PAGE_SIZE),
      MAX_PAGE_SIZE,
    );

    const filtered = db().nfts.filter((nft) => {
      const price = listingPrice(nft);
      if (search) {
        const haystack = normalize(
          `${nft.name} ${nft.creatorName} ${nft.collectionName}`,
        );
        if (!haystack.includes(search)) return false;
      }
      if (collectionIds.length > 0 && !collectionIds.includes(nft.collectionId))
        return false;
      if (
        categories.length > 0 &&
        !categories.includes(normalize(nft.category))
      )
        return false;
      if (networks.length > 0 && !networks.includes(nft.network)) return false;
      if ((minPrice !== null || maxPrice !== null) && price === null)
        return false;
      if (price !== null && minPrice !== null && price < minPrice) return false;
      if (price !== null && maxPrice !== null && price > maxPrice) return false;
      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      switch (sort) {
        case "price-asc":
          return (
            comparePrice(listingPrice(a), listingPrice(b), 1) ||
            a.id.localeCompare(b.id)
          );
        case "price-desc":
          return (
            comparePrice(listingPrice(a), listingPrice(b), -1) ||
            a.id.localeCompare(b.id)
          );
        case "name-asc":
          return (
            a.name.localeCompare(b.name, "pt-BR") || a.id.localeCompare(b.id)
          );
        default:
          return (
            b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id)
          );
      }
    });

    const start = (page - 1) * pageSize;
    const body: ListNftsResponse = {
      items: sorted.slice(start, start + pageSize).map(toNft),
      total: sorted.length,
      page,
      pageSize,
    };
    return HttpResponse.json(body);
  }),

  http.get("/api/nfts/:nftId", ({ params }) => {
    const nft = db().nfts.find((item) => item.id === params.nftId);
    if (!nft) return errorResponse(404, "NOT_FOUND", "NFT não encontrado.");
    const body: NftResponse = { nft: toNft(nft) };
    return HttpResponse.json(body);
  }),
];
