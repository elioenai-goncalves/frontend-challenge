// ======================================================
// Tipos compartilhados
// ======================================================

// Exemplo: "1.19". Nunca transportar ETH como number.
export type EthAmount = string;

// Datas trafegam como strings ISO 8601.
export type ISODate = string;

export type Network = "ethereum" | "polygon" | "solana";

export interface SuccessResponse {
  success: true;
}

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "INVALID_CREDENTIALS"
  | "SESSION_EXPIRED"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "OUT_OF_STOCK"
  | "INVALID_COUPON"
  | "EXPIRED_COUPON"
  | "QUOTE_CHANGED"
  | "IDEMPOTENCY_CONFLICT"
  | "TRANSIENT_ERROR";

export interface ApiErrorResponse {
  error: {
    code: ApiErrorCode;
    message: string;
    fieldErrors?: Record<string, string[]>;
  };
}

// ======================================================
// Conta e sessão
// ======================================================

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SessionResponse {
  user: User;
  accessToken: string;
  expiresAt: ISODate;
}

// ======================================================
// NFTs
// ======================================================

export interface NftEdition {
  id: string;
  label: string;
  priceEth: EthAmount;
  availableQuantity: number;
  maxPerOrder: number;
}

export interface Nft {
  id: string;
  name: string;
  description: string;
  creatorName: string;
  collectionId: string;
  collectionName: string;
  category: string;
  network: Network;
  imageUrls: string[];
  editions: NftEdition[];
  attributes: Record<string, string>;
  featured: boolean;
  createdAt: ISODate;
  version: number;
}

export type NftSort =
  | "recent"
  | "price-asc"
  | "price-desc"
  | "name-asc";

export interface ListNftsRequest {
  search?: string;
  collectionIds?: string[];
  categories?: string[];
  networks?: Network[];
  minPriceEth?: EthAmount;
  maxPriceEth?: EthAmount;
  sort?: NftSort;
  page?: number;
  pageSize?: number;
}

export interface ListNftsResponse {
  items: Nft[];
  total: number;
  page: number;
  pageSize: number;
}

export interface NftResponse {
  nft: Nft;
}

// ======================================================
// Favoritos
// ======================================================

export interface FavoritesResponse {
  nftIds: string[];
}

export interface AddFavoriteRequest {
  nftId: string;
}

// ======================================================
// Carrinho
// ======================================================

export interface CartItem {
  id: string;
  nftId: string;
  editionId: string;
  quantity: number;
}

export interface CartResponse {
  id: string;
  userId: string | null;
  items: CartItem[];
  version: number;
}

export interface AddCartItemRequest {
  nftId: string;
  editionId: string;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

export interface MergeCartRequest {
  guestCartId: string;
}

// ======================================================
// Cotação
// ======================================================

export interface QuoteRequest {
  network: Network;
  couponCode?: string;
}

export interface QuoteItem {
  nftId: string;
  editionId: string;
  nftName: string;
  editionLabel: string;
  imageUrl: string;
  quantity: number;
  unitPriceEth: EthAmount;
  lineTotalEth: EthAmount;
}

export interface QuoteResponse {
  id: string;
  cartId: string;
  cartVersion: number;
  network: Network;
  items: QuoteItem[];
  couponCode: string | null;
  subtotalEth: EthAmount;
  discountEth: EthAmount;
  networkFeeEth: EthAmount;
  totalEth: EthAmount;
  expiresAt: ISODate;
}

// ======================================================
// Perfil e carteiras
// ======================================================

export interface ProfileResponse {
  user: User;
}

export interface UpdateProfileRequest {
  name: string;
  email: string;
  avatarUrl: string | null;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export type WalletRole = "primary" | "secondary";

export interface Wallet {
  id: string;
  label: string;
  address: string;
  network: Network;
  role: WalletRole;
}

export interface SaveWalletRequest {
  label: string;
  address: string;
  network: Network;
  role: WalletRole;
}

export interface WalletResponse {
  wallet: Wallet;
}

export interface WalletsResponse {
  items: Wallet[];
}

// ======================================================
// Pedidos
// ======================================================

export type OrderStatus = "pending" | "confirmed" | "rejected";

export interface CollectorData {
  name: string;
  email: string;
}

export interface CreateOrderRequest {
  quoteId: string;
  walletId: string;
  network: Network;
  collector: CollectorData;
}

// Metadado enviado no cabeçalho, não no JSON do pedido.
export interface CreateOrderHeaders {
  "Idempotency-Key": string;
}

export interface Order {
  id: string;
  userId: string;
  status: OrderStatus;

  // Snapshot: não reconstruir usando os preços atuais do catálogo.
  receipt: QuoteResponse;

  collector: CollectorData;
  wallet: Wallet;
  transactionReference: string | null;
  rejectionReason: string | null;
  createdAt: ISODate;
  updatedAt: ISODate;
  version: number;
}

export interface OrderResponse {
  order: Order;
}

// ======================================================
// Eventos Socket.IO
// ======================================================

export interface NftUpdatedEvent {
  eventId: string;
  resourceId: string;
  version: number;
  occurredAt: ISODate;
  nft: Nft;
}

export interface OrderUpdatedEvent {
  eventId: string;
  resourceId: string;
  version: number;
  occurredAt: ISODate;
  sessionId: string;
  userId: string;
  order: Order;
}

export interface ServerToClientEvents {
  "nft.updated": (event: NftUpdatedEvent) => void;
  "order.updated": (event: OrderUpdatedEvent) => void;
}