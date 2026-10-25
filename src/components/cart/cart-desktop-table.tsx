import { Link } from '@tanstack/react-router'
import { Minus, Plus, Trash2 } from 'lucide-react'
import type { CartItem, Nft } from '@/contracts/api'

interface DesktopCartTableProps {
  items: CartItem[]
  nftById: Map<string, Nft | undefined>
  busy: boolean
  onUpdate: (itemId: string, quantity: number) => void
  onRemove: (itemId: string) => void
}

/** Monetary presentation only; actual pricing always comes from the quote API. */
function lineTotal(price: string, quantity: number): string {
  const [whole, fraction = ''] = price.split('.')
  const amount = BigInt(whole || '0') * 10n ** 18n + BigInt(fraction.padEnd(18, '0').slice(0, 18))
  const total = amount * BigInt(quantity)
  const integer = total / 10n ** 18n
  const decimal = (total % 10n ** 18n).toString().padStart(18, '0').replace(/0+$/, '')
  return decimal ? `${integer}.${decimal}` : String(integer)
}

export function DesktopCartTable({ items, nftById, busy, onUpdate, onRemove }: DesktopCartTableProps) {
  return (
    <div className="hidden lg:block min-w-0">
      <div className="mb-3 grid grid-cols-[minmax(0,2.3fr)_1fr_1fr_1fr_32px] gap-3 border-b border-primary/35 pb-3 text-sm font-bold">
        <span>NFTs</span><span>Preço</span><span>Edições</span><span>Total</span><span className="sr-only">Ações</span>
      </div>
      <ul aria-label="Itens do carrinho" aria-busy={busy} className="space-y-3">
        {items.map((item) => {
          const nft = nftById.get(item.nftId)
          const edition = nft?.editions.find((part) => part.id === item.editionId)
          const limit = edition ? Math.min(edition.availableQuantity, edition.maxPerOrder) : 0
          const missing = !nft || !edition || item.quantity > limit
          return (
            <li
              key={item.id}
              className="grid grid-cols-[minmax(0,2.3fr)_1fr_1fr_1fr_32px] items-center gap-3 bg-card px-3 py-2"
            >
              <div className="flex min-w-0 items-center gap-3">
                {nft?.imageUrls[0] ? (
                  <img src={nft.imageUrls[0]} alt="" width={72} height={72} className="size-[72px] shrink-0 rounded-md object-cover" />
                ) : (
                  <span className="grid size-[72px] shrink-0 place-items-center rounded-md bg-background text-xs">Sem imagem</span>
                )}
                <div className="min-w-0">
                  {nft ? (
                    <Link to="/nfts/$nftId" params={{ nftId: nft.id }} className="block truncate text-xs font-bold hover:text-primary">
                      {nft.name}
                    </Link>
                  ) : <strong className="text-xs">NFT indisponível</strong>}
                  <p className="mt-1 truncate text-xs text-text-secondary">{edition?.label ?? 'Edição indisponível'}</p>
                  <p className="mt-1 truncate text-[11px] text-text-secondary">ID: {nft?.id ?? item.nftId}</p>
                </div>
              </div>
              <span className="text-xs text-text-secondary">{edition?.priceEth ?? '—'} ETH</span>
              <div className="flex items-center gap-2">
                <button
                  type="button" aria-label={`Diminuir quantidade de ${nft?.name ?? 'NFT'}`}
                  disabled={busy || item.quantity <= 1}
                  onClick={() => onUpdate(item.id, item.quantity - 1)}
                  className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-40"
                ><Minus size={13} aria-hidden="true" /></button>
                <select
                  aria-label="Quantidade"
                  value={item.quantity}
                  onChange={(event) => onUpdate(item.id, Number(event.currentTarget.value))}
                  disabled={busy || limit === 0}
                  className="h-8 w-8 appearance-none bg-transparent text-center text-xs focus-visible:outline-2 focus-visible:outline-primary"
                >
                  {Array.from({ length: Math.max(item.quantity, limit) }, (_, index) => index + 1).map((value) => (
                    <option key={value} value={value} disabled={value > limit}>{value}</option>
                  ))}
                </select>
                <button
                  type="button" aria-label={`Aumentar quantidade de ${nft?.name ?? 'NFT'}`}
                  disabled={busy || limit === 0 || item.quantity >= limit}
                  onClick={() => onUpdate(item.id, item.quantity + 1)}
                  className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-40"
                ><Plus size={13} aria-hidden="true" /></button>
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-primary">{edition ? lineTotal(edition.priceEth, item.quantity) : '—'} ETH</span>
                {missing && <p role="status" className="mt-1 text-[11px] text-destructive">Revise a quantidade</p>}
              </div>
              <button
                type="button" aria-label={`Remover ${nft?.name ?? 'NFT'} do carrinho`}
                disabled={busy} onClick={() => onRemove(item.id)}
                className="grid size-8 place-items-center text-text-secondary hover:text-destructive disabled:opacity-40"
              ><Trash2 size={18} aria-hidden="true" /></button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
