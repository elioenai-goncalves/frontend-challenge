import {
  Link,
  useSearch,
} from '@tanstack/react-router'
interface PlaceholderPageProps {
  title: string
  description: string
}

function PlaceholderPage({
  title,
  description,
}: PlaceholderPageProps) {
  return (
    <section>
      <h1 className="text-2xl font-bold">{title}</h1>

      <p className="mt-4 text-text-secondary">
        {description}
      </p>
    </section>
  )
}

export function HomePage() {
  const search = useSearch({ from: '/' })

  return (
    <section>
      <h1 className="text-2xl font-bold">Início</h1>

      <p className="mt-4 text-text-secondary">
        O catálogo será implementado na Issue 13.
      </p>

      <div className="mt-6 flex flex-wrap gap-4">
        <Link
          to="/"
          search={(previous) => ({
            ...previous,
            search: 'arte',
            page: 1,
          })}
          className="text-primary underline underline-offset-4"
        >
          Testar busca por arte
        </Link>

        <Link
          to="/"
          search={(previous) => ({
            ...previous,
            page: (previous.page ?? 1) + 1,
          })}
          className="text-primary underline underline-offset-4"
        >
          Próxima página
        </Link>

        <Link
          to="/"
          search={{}}
          className="text-primary underline underline-offset-4"
        >
          Limpar filtros
        </Link>
      </div>

      <h2 className="mt-8 text-lg font-bold">
        Parâmetros validados — diagnóstico
      </h2>

      <pre className="mt-4 overflow-auto rounded bg-muted p-4 text-sm text-muted-foreground">
        {JSON.stringify(search, null, 2)}
      </pre>
    </section>
  )
}

export function NftDetailsPage() {
  return (
    <PlaceholderPage
      title="Detalhes do NFT"
      description="O detalhe será implementado na Issue 14."
    />
  )
}

export function CartPage() {
  return (
    <PlaceholderPage
      title="Carrinho"
      description="O carrinho será implementado na Issue 16."
    />
  )
}

export function CheckoutPage() {
  return (
    <PlaceholderPage
      title="Pagamento"
      description="O pagamento será implementado na Issue 18."
    />
  )
}

export function OrderConfirmationPage() {
  return (
    <PlaceholderPage
      title="Confirmação do pedido"
      description="O recibo será implementado na Issue 19."
    />
  )
}

export function ProfilePage() {
  return (
    <PlaceholderPage
      title="Perfil"
      description="A edição de perfil será implementada na Issue 21."
    />
  )
}

export function WalletsPage() {
  return (
    <PlaceholderPage
      title="Carteiras"
      description="As carteiras serão implementadas na Issue 21."
    />
  )
}

export function NotFoundPage() {
  return (
    <section>
      <h1 className="text-2xl font-bold">
        Página não encontrada
      </h1>

      <p className="mt-4 text-text-secondary">
        O endereço informado não existe.
      </p>

      <Link
        to="/"
        className="mt-6 inline-block text-primary underline underline-offset-4"
      >
        Voltar ao início
      </Link>
    </section>
  )
}