import { expect, test, type Page } from '@playwright/test'

type MockControls = {
  reset: (reload?: boolean) => Promise<void>
  setScenario: (name: string) => void
  updateNftEdition: (input: {
    nftId: string
    editionId: string
    priceEth?: string
    availableQuantity?: number
  }) => unknown
}

async function resetMocks(page: Page) {
  await page.goto('/')

  await expect
    .poll(() =>
      page.evaluate(() =>
        Boolean((window as Window & { mocks?: MockControls }).mocks),
      ),
    )
    .toBe(true)

  await page.evaluate(async () => {
    const mocks = (window as Window & { mocks?: MockControls }).mocks
    if (!mocks) throw new Error('Os mocks MSW não foram iniciados')
    await mocks.reset(false)
  })

  await page.reload()
}

async function setScenario(page: Page, scenario: string) {
  await page.evaluate((value) => {
    const mocks = (window as Window & { mocks?: MockControls }).mocks
    if (!mocks) throw new Error('MSW indisponível')
    mocks.setScenario(value)
  }, scenario)
}

async function addFirstNft(page: Page) {
  await page.goto('/nfts/nft-01')
  await expect(
    page.getByRole('heading', { name: /Ape Jaqueta Verde #01/i }),
  ).toBeVisible()
  await page.getByRole('button', { name: /Adicionar ao carrinho/i }).click()
  await expect(page).toHaveURL(/\/cart(?:\?|$)/)
  await expect(page.getByRole('link', { name: 'Ir para pagamento' })).toBeVisible()
}

async function loginFromCart(page: Page) {
  await page.getByRole('link', { name: 'Ir para pagamento' }).click()
  await expect(page).toHaveURL(/\/login/)

  const dialog = page.getByRole('dialog')
  await dialog.getByRole('textbox', { name: 'E-mail' }).fill('ana@example.com')
  await dialog.locator('input[name="password"]').fill('Senha123!')
  await dialog.getByRole('button', { name: 'Entrar', exact: true }).click()

  await expect(page).toHaveURL(/\/checkout/)
  await expect(page.getByRole('heading', { name: 'Pagamento' })).toBeVisible()
}

async function preparePayment(page: Page) {
  await page.getByLabel('Carteira cadastrada').selectOption('wallet-ana-1')
  await page
    .getByRole('button', { name: 'Simular conexão da carteira' })
    .click()
  const review = page.getByRole('button', { name: 'Revalidar e revisar compra' })
  await expect(review).toBeEnabled()
  await review.click()
  await expect(
    page.getByRole('button', { name: 'Confirmar pagamento' }),
  ).toBeVisible()
}

async function expectConfirmedReceipt(page: Page) {
  await expect(page).toHaveURL(/\/orders\/[^/]+\/confirmation/)
  await expect(
    page.getByRole('heading', { name: 'Compra confirmada!' }),
  ).toBeVisible()
  await expect(page.getByText('Confirmado', { exact: true })).toBeVisible()
}

async function countStoredOrders(page: Page) {
  return page.evaluate(() => {
    const raw = localStorage.getItem('frontend-challenge:mock-db')
    if (!raw) throw new Error('Banco MSW ausente')
    return (JSON.parse(raw) as { orders: unknown[] }).orders.length
  })
}

test.beforeEach(async ({ page }) => {
  await resetMocks(page)
})

test('01 - compra completa: catálogo até recibo persistido', async ({ page }) => {
  await addFirstNft(page)
  await loginFromCart(page)
  await preparePayment(page)

  await page.getByRole('button', { name: 'Confirmar pagamento' }).click()
  await expectConfirmedReceipt(page)
  expect(await countStoredOrders(page)).toBe(1)

  await page.reload()
  await expectConfirmedReceipt(page)
})

test('02 - carrinho persiste após F5 e login; cupom altera a cotação', async ({ page }) => {
  await addFirstNft(page)

  const items = page.getByRole('list', { name: 'Itens do carrinho' })
  await items.getByLabel('Quantidade').selectOption('2')
  await expect(items.getByLabel('Quantidade')).toHaveValue('2')

  await page.reload()
  await expect(items.getByLabel('Quantidade')).toHaveValue('2')

  await loginFromCart(page)
  await page.goto('/cart')
  await expect(items.getByLabel('Quantidade')).toHaveValue('2')

  await page.getByLabel('Cupom de desconto').fill('BEMVINDO10')
  await page.getByRole('button', { name: 'Aplicar' }).click()
  await expect(page.getByText('Cupom BEMVINDO10 aplicado.')).toBeVisible()

  await expect(page.getByRole('list', { name: 'Itens do carrinho' })).toContainText('Ape Jaqueta Verde')
  await expect(page.getByRole('complementary', { name: 'Resumo do carrinho' })).toContainText('0.238 ETH')
})

test('03 - pagamento recusado: clique repetido não duplica pedido', async ({ page }) => {
  await addFirstNft(page)
  await loginFromCart(page)
  await preparePayment(page)
  await setScenario(page, 'payment-refused')

  const confirm = page.getByRole('button', { name: 'Confirmar pagamento' })
  await expect(confirm).toBeEnabled()

  await confirm.evaluate((element: HTMLButtonElement) => {
    element.click()
    element.click()
  })

  await expect(page.getByText(/Pagamento recusado pela rede/i)).toBeVisible()
  expect(await countStoredOrders(page)).toBe(1)
})


test('04 - timeout: recupera o mesmo pedido após refresh', async ({ page }) => {
  test.setTimeout(60_000)

  await addFirstNft(page)
  await loginFromCart(page)
  await preparePayment(page)
  await setScenario(page, 'order-timeout')

  await page
    .getByRole('button', { name: 'Confirmar pagamento' })
    .click()

  await expect.poll(
    async () => {
      return page.evaluate(() => {
        const raw = localStorage.getItem(
          'frontend-challenge:mock-db',
        )

        const pending = localStorage.getItem(
          'frontend-challenge:pending-order:user-ana',
        )

        if (!raw || !pending) return false

        const database = JSON.parse(raw) as {
          orders: Array<{ status: string }>
        }

        return (
          database.orders.length === 1 &&
          database.orders[0].status === 'confirmed'
        )
      })
    },
    { timeout: 15_000 },
  ).toBe(true)

  await page.reload()

  await expectConfirmedReceipt(page)

  expect(await countStoredOrders(page)).toBe(1)

  await expect.poll(
    () =>
      page.evaluate(() =>
        localStorage.getItem(
          'frontend-challenge:pending-order:user-ana',
        ),
      ),
  ).toBeNull()
})


test('05 - preço via Socket.IO exige nova revisão antes de pagar', async ({ page }) => {
  await addFirstNft(page)
  await loginFromCart(page)
  await preparePayment(page)

  await page.evaluate(() => {
    const mocks = (window as Window & { mocks?: MockControls }).mocks
    if (!mocks) throw new Error('MSW indisponível')
    mocks.updateNftEdition({
      nftId: 'nft-01',
      editionId: 'nft-01-standard',
      priceEth: '1.55',
    })
  })

  const quote = page.getByRole('complementary', { name: 'Revisão do pagamento' })
  await expect(quote).toContainText('1.55 ETH')

  const confirm = page.getByRole('button', { name: 'Confirmar pagamento' })
  await expect(confirm).toBeEnabled()
  await confirm.click()

  await expect(page.getByText(/Os valores mudaram/i)).toBeVisible()
  expect(await countStoredOrders(page)).toBe(0)

  await page.getByRole('button', { name: 'Revalidar e revisar compra' }).click()
  const confirmAgain = page.getByRole('button', { name: 'Confirmar pagamento' })
  await expect(confirmAgain).toBeEnabled()
  await confirmAgain.click()
  await expectConfirmedReceipt(page)
  expect(await countStoredOrders(page)).toBe(1)
})
