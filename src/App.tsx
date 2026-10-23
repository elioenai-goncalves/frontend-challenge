import { useNfts } from '@/hooks/use-nfts'
import { getApiErrorMessage } from '@/lib/api-client'

function App() {
  const { data, isPending, isError, error } = useNfts()

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-1200px">
        <h1 className="text-2xl font-bold">Teste do TanStack Query</h1>

        {isPending && <p>Carregando NFTs...</p>}

        {isError && (
          <p role="alert" className="mt-4 text-destructive">
            {getApiErrorMessage(error)}
          </p>
        )}

        {data && (
          <pre className="mt-4 overflow-auto rounded-md bg-muted p-4 text-sm text-muted-foreground">
            {JSON.stringify(data, null, 2)}
          </pre>
        )}
      </div>
    </main>
  )
}

export default App