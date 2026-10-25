import { useState, type CSSProperties, type FormEvent } from 'react'

import type { NftFacetsResponse } from '@/contracts/api'

type PriceRange = NftFacetsResponse['priceRange']

interface PriceRangeFilterProps {
  minEth?: string
  maxEth?: string
  range: PriceRange
  onApply: (min: string | undefined, max: string | undefined) => void
}

function cents(value: string, round: 'up' | 'down'): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return 0
  return round === 'up' ? Math.ceil(parsed * 100) : Math.floor(parsed * 100)
}

function fromCents(value: number): string {
  return (value / 100).toFixed(2).replace(/0+$/, '').replace(/\.$/, '')
}

function formatted(value: string): string {
  return value.replace('.', ',')
}

export function PriceRangeFilter({ minEth, maxEth, range, onApply }: PriceRangeFilterProps) {
  const absoluteMin = range ? cents(range.minEth, 'down') : 0
  const absoluteMax = range ? cents(range.maxEth, 'up') : 100
  const max = Math.max(absoluteMin + 1, absoluteMax)

  const initialMin = Math.min(max, Math.max(absoluteMin, minEth ? cents(minEth, 'down') : absoluteMin))
  const initialMax = Math.max(absoluteMin, Math.min(max, maxEth ? cents(maxEth, 'up') : max))

  const [selectedMin, setSelectedMin] = useState(Math.min(initialMin, initialMax))
  const [selectedMax, setSelectedMax] = useState(Math.max(initialMin, initialMax))

  if (!range) {
    return <p className="text-xs text-text-secondary">Faixa de preços indisponível.</p>
  }

  const minPosition = ((selectedMin - absoluteMin) / (max - absoluteMin)) * 100
  const maxPosition = ((selectedMax - absoluteMin) / (max - absoluteMin)) * 100

  function handleApply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onApply(
      selectedMin === absoluteMin ? undefined : fromCents(selectedMin),
      selectedMax === max ? undefined : fromCents(selectedMax),
    )
  }

  return (
    <form onSubmit={handleApply} className="space-y-3">
      <div
        className="price-dual-range"
        style={{
          '--range-start': `${minPosition}%`,
          '--range-end': `${maxPosition}%`,
        } as CSSProperties}
      >
        <div className="price-dual-range__track" aria-hidden="true" />
        <input
          type="range"
          aria-label="Preço mínimo em ETH"
          min={absoluteMin}
          max={max}
          step={1}
          value={selectedMin}
          onChange={(event) => setSelectedMin(Math.min(Number(event.target.value), selectedMax))}
        />
        <input
          type="range"
          aria-label="Preço máximo em ETH"
          min={absoluteMin}
          max={max}
          step={1}
          value={selectedMax}
          onChange={(event) => setSelectedMax(Math.max(Number(event.target.value), selectedMin))}
        />
      </div>
      <p className="text-xs leading-5 text-text-secondary" aria-live="polite">
        Preço: {formatted(fromCents(selectedMin))} – {formatted(fromCents(selectedMax))} ETH
      </p>
      <button
        type="submit"
        className="min-h-9 rounded-md bg-primary px-4 text-sm font-bold text-primary-foreground focus-visible:outline-2 focus-visible:outline-primary"
      >
        Aplicar
      </button>
    </form>
  )
}
