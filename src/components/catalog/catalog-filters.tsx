import { useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import { LoadingSkeleton } from '@/components/ui/loading-skeleton'
import { TextField } from '@/components/ui/text-field'
import type { ListNftsRequest, Network, NftFacetsResponse } from '@/contracts/api'
import { compareEth, ETH_PATTERN } from '@/lib/decimal'

const NETWORK_LABELS: Record<Network, string> = {
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  solana: 'Solana',
}

interface CatalogFiltersProps {
  search: ListNftsRequest
  facets: NftFacetsResponse | undefined
  isLoading: boolean
  hasActiveFilters: boolean
  onChange: (patch: Partial<ListNftsRequest>) => void
  onClear: () => void
}

function toggle<T extends string>(list: T[] | undefined, value: T): T[] | undefined {
  const next = list?.includes(value) ? list.filter((item) => item !== value) : [...(list ?? []), value]
  return next.length > 0 ? next : undefined
}

function CheckboxRow({
  label,
  count,
  checked,
  onChange,
}: {
  label: string
  count: number
  checked: boolean
  onChange: () => void
}) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 text-sm">
      <span className="flex items-center gap-2">
        <input type="checkbox" checked={checked} onChange={onChange} className="size-4 accent-primary" />
        {label}
      </span>
      <span className="text-text-secondary">({count})</span>
    </label>
  )
}

function PriceFilter({
  minEth,
  maxEth,
  range,
  onApply,
}: {
  minEth: string | undefined
  maxEth: string | undefined
  range: NftFacetsResponse['priceRange']
  onApply: (min: string | undefined, max: string | undefined) => void
}) {
  const [min, setMin] = useState(minEth ?? '')
  const [max, setMax] = useState(maxEth ?? '')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextMin = min.trim()
    const nextMax = max.trim()

    if ((nextMin && !ETH_PATTERN.test(nextMin)) || (nextMax && !ETH_PATTERN.test(nextMax))) {
      setError('Use apenas números, com ponto decimal (ex.: 0.5).')
      return
    }
    if (nextMin && nextMax && compareEth(nextMin, nextMax) > 0) {
      setError('O valor mínimo não pode ser maior que o máximo.')
      return
    }

    setError(null)
    onApply(nextMin || undefined, nextMax || undefined)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
      {range && (
        <p className="text-xs text-text-secondary">
          Preço: {range.minEth} – {range.maxEth} ETH
        </p>
      )}

      <div className="grid grid-cols-2 gap-2">
        <TextField
          label="Mínimo (ETH)"
          name="minPriceEth"
          inputMode="decimal"
          value={min}
          onChange={(event) => setMin(event.target.value)}
        />
        <TextField
          label="Máximo (ETH)"
          name="maxPriceEth"
          inputMode="decimal"
          value={max}
          onChange={(event) => setMax(event.target.value)}
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" className="h-10 w-full">
        Aplicar
      </Button>
    </form>
  )
}

export function CatalogFilters({
  search,
  facets,
  isLoading,
  hasActiveFilters,
  onChange,
  onClear,
}: CatalogFiltersProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <LoadingSkeleton className="h-6 w-24" />
        <LoadingSkeleton className="h-44 w-full" />
        <LoadingSkeleton className="h-32 w-full" />
      </div>
    )
  }

  if (!facets) {
    return <p className="text-sm text-text-secondary">Não foi possível carregar os filtros.</p>
  }

  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="filtro-colecoes">
        <h3 id="filtro-colecoes" className="mb-2 text-sm font-bold">
          Coleções
        </h3>
        {facets.categories.map((category) => (
          <CheckboxRow
            key={category.name}
            label={category.name}
            count={category.count}
            checked={search.categories?.includes(category.name) ?? false}
            onChange={() => onChange({ categories: toggle(search.categories, category.name) })}
          />
        ))}
      </section>

      <section aria-labelledby="filtro-preco">
        <h3 id="filtro-preco" className="mb-2 text-sm font-bold">
          Faixa de preço
        </h3>
        <PriceFilter
          key={`${search.minPriceEth ?? ''}-${search.maxPriceEth ?? ''}`}
          minEth={search.minPriceEth}
          maxEth={search.maxPriceEth}
          range={facets.priceRange}
          onApply={(min, max) => onChange({ minPriceEth: min, maxPriceEth: max })}
        />
      </section>

      <section aria-labelledby="filtro-rede">
        <h3 id="filtro-rede" className="mb-2 text-sm font-bold">
          Rede
        </h3>
        {facets.networks.map((item) => (
          <CheckboxRow
            key={item.network}
            label={NETWORK_LABELS[item.network]}
            count={item.count}
            checked={search.networks?.includes(item.network) ?? false}
            onChange={() => onChange({ networks: toggle(search.networks, item.network) })}
          />
        ))}
      </section>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={onClear}
          className="self-start text-sm text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-primary"
        >
          Limpar filtros
        </button>
      )}
    </div>
  )
}