import {
  Link,
} from '@tanstack/react-router'

export { NftDetailsPage } from './nft-details-page'
export { CartPage } from './cart-page'
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