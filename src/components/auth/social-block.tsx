const PROVIDERS = [
  { name: 'Google', mark: 'G' },
  { name: 'Facebook', mark: 'f' },
]

export function SocialBlock() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 text-xs">
        <span aria-hidden="true" className="h-px flex-1 bg-border" />
        <span>Ou continue com</span>
        <span aria-hidden="true" className="h-px flex-1 bg-border" />
      </div>

      {PROVIDERS.map((provider) => (
        <button
          key={provider.name}
          type="button"
          disabled
          title="Indisponível nesta demonstração"
          className="flex h-10 cursor-not-allowed items-center justify-center gap-2 rounded-md border border-border text-sm opacity-60"
        >
          <span aria-hidden="true" className="font-bold">
            {provider.mark}
          </span>
          Continuar com {provider.name}
        </button>
      ))}
    </div>
  )
}