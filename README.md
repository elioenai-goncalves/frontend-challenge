# Kurio — Marketplace de NFTs

Marketplace de NFTs desenvolvido com **React, TypeScript e Vite**, integrado a uma API simulada com **Mock Service Worker (MSW)**. O projeto demonstra navegação responsiva, autenticação, catálogo, favoritos, carrinho, cupons, checkout, recibo persistente e atualizações em tempo real via **Socket.IO**.

**Demonstração:** https://frontend-challenge-two-ruddy.vercel.app/  
**Repositório:** https://github.com/elioenai-goncalves/frontend-challenge

> **Ambiente de demonstração:** não há pagamentos reais, blockchain, API hospedada nem carteiras conectadas a redes reais. Os dados e as operações são simulados no navegador; cada navegador possui seu próprio estado de demonstração.

## Tecnologias

- React 19, TypeScript 6, Vite 8 e Tailwind CSS 4.
- TanStack Router para navegação e TanStack Query para consultas e cache.
- Axios para comunicação HTTP.
- MSW 3 para endpoints REST, cenários de falha e transporte WebSocket simulado.
- `socket.io-client` para eventos de atualização de NFTs e pedidos.
- Playwright para testes E2E em Chromium desktop e mobile.

## Executar localmente

**Pré-requisito:** Node.js 22 ou superior e npm.

```bash
npm install
```

Crie um arquivo `.env` a partir de `.env.example`:

```dotenv
VITE_API_BASE_URL=/api
VITE_ENABLE_MOCKS=true
VITE_MOCK_SCENARIO=success
```

```bash
npm run dev
```

O MSW é inicializado antes da renderização da aplicação. O arquivo `public/mockServiceWorker.js` acompanha o projeto.

### Comandos

| Comando | Finalidade |
| --- | --- |
| `npm run dev` | Iniciar o ambiente local |
| `npm run typecheck` | Verificar tipos TypeScript |
| `npm run lint` | Executar ESLint |
| `npm run build` | Gerar o build em `dist/` |
| `npm run preview` | Servir o build localmente |
| `npm run test:e2e` | Executar toda a suíte Playwright (Chromium desktop e mobile) |
| `npm run test:e2e:report` | Abrir o relatório HTML do Playwright |

Para instalar o navegador usado pelos testes:

```bash
npx playwright install chromium
```

Os testes usam a aplicação local por padrão. Para executá-los contra a URL publicada no **PowerShell**:

```powershell
$env:PLAYWRIGHT_BASE_URL = 'https://frontend-challenge-two-ruddy.vercel.app'
npm run test:e2e
Remove-Item Env:PLAYWRIGHT_BASE_URL
```

### Testes E2E — evidências de execução

Os arquivos `tests/e2e/home.spec.ts` e `tests/e2e/purchase.spec.ts` são executados pelo Playwright, com os perfis **Chromium desktop (1440 × 900)** e **Chromium mobile (390 × 844)**. A execução de **25/10/2026, informada pelo desenvolvedor**, apresentou **12/12 execuções aprovadas**: são **6 cenários executados em cada viewport**, não 12 fluxos funcionalmente distintos.

| Teste | Validação automatizada |
| --- | --- |
| Home (smoke) | Carregamento, título principal e controles de navegação pertinentes a desktop/mobile |
| 01 — Compra completa | Detalhe do NFT → carrinho → login → seleção/conexão de carteira simulada → revalidação → confirmação; recibo persiste após refresh |
| 02 — Carrinho e cupom | Alteração de quantidade, persistência após F5, mesclagem do carrinho visitante após login e desconto `BEMVINDO10` na cotação |
| 03 — Pagamento recusado | Cenário `payment-refused`, clique repetido no botão e ausência de pedido duplicado |
| 04 — Timeout e recuperação | Cenário `order-timeout`, pedido confirmado no armazenamento do mock apesar da resposta perdida, recuperação após F5 e idempotência |
| 05 — Preço via Socket.IO | Emissão de `nft.updated`, atualização do valor exibido no checkout, bloqueio de confirmação com cotação antiga e aprovação após nova revisão |

Os testes reiniciam o estado do MSW para isolar os cenários de compra. O runner utiliza relatório HTML, screenshots, vídeos e traces de falha; os artefatos gerados não devem ser versionados.

```bash
npm run test:e2e
npm run test:e2e:report
```

Para executar apenas os fluxos de compra no desktop:

```bash
npx playwright test tests/e2e/purchase.spec.ts --project=chromium-desktop
```

**Limite da evidência:** o resultado 12/12 foi relatado **antes da rodada visual mais recente de carrinho e autenticação**. Se essas alterações foram aplicadas depois, a suíte precisa ser reexecutada antes de declarar a versão final novamente aprovada. Os testes também não substituem uma auditoria completa de acessibilidade, responsividade, regressão visual e Lighthouse.

## Credenciais fictícias

| Usuário | E-mail | Senha |
| --- | --- | --- |
| Ana Souza | `ana@example.com` | `Senha123!` |
| Bruno Lima | `bruno@example.com` | `Senha456!` |

Use essas contas apenas na aplicação de demonstração. O cadastro de novos usuários é simulado.

## Funcionalidades disponíveis

### Catálogo e detalhes

- Listagem, busca e filtros por categoria, coleção, rede e preço (inclusive faixa com slider duplo), ordenação e paginação numérica. Abas de catálogo incluem **Todos os NFTs**, **Novos lançamentos** e **Em alta**; a última reaproveita a marcação `featured` da API simulada, sem inventar métrica de popularidade.
- Detalhe de NFT com galeria, atributos, edições, estoque, limite por pedido e controles de compra; composição adaptada a desktop e mobile.
- Favoritos com atualização otimista, rollback em caso de erro e isolamento por usuário.
- Seções editoriais de Home (banners, artigos demonstrativos e NFT em destaque), além de estados de carregamento, lista vazia, erro e recurso inexistente.

### Autenticação e carrinho

- Cadastro, login, recuperação de sessão após refresh, logout e proteção de rotas privadas. Apresentação de autenticação em modal no desktop e formulário adaptado no mobile.
- Carrinho para visitantes e usuários autenticados: adicionar, alterar quantidade e remover itens.
- Persistência local após refresh e mesclagem do carrinho visitante ao autenticar, respeitando limites de estoque.
- Contador de itens compartilhado entre página, cabeçalho desktop e navegação mobile. Carrinho com apresentação em tabela no desktop e cartões compactos no mobile, preservando atualização de quantidade e remoção.
- Atualização de preços e disponibilidade na interface sem recarregar a página.

### Cotação e checkout

- Cotação por rede (Ethereum, Polygon ou Solana), subtotal, taxa, desconto e total retornados pela API simulada.
- Cupons válidos, inválidos e expirados.
- Checkout autenticado com seleção de carteira cadastrada, dados do colecionador, revisão e revalidação da cotação.
- Pedidos idempotentes: reenvios com a mesma chave e mesmo conteúdo não geram outra compra.
- Cenários de aprovação, recusa, estoque insuficiente, preço alterado e perda de resposta após o pedido ser gravado.
- Recuperação de tentativa pendente após refresh, sem criar outro pedido, e recibo consultável posteriormente.

### Tempo real

- Conexão Socket.IO iniciada automaticamente após o MSW.
- `nft.updated`: mudanças de preço e estoque refletidas em catálogo, detalhes e carrinho.
- `order.updated`: mudanças de pedido entregues apenas à conexão autenticada do proprietário.
- Proteção por versão contra eventos repetidos ou antigos; revalidação REST após reconexão.
- Encerramento de listeners e limpeza de cache privado na troca de sessão.

## Cupons de demonstração

| Cupom | Comportamento |
| --- | --- |
| `BEMVINDO10` | 10% de desconto |
| `ARTE25` | 25% de desconto |
| `VERAO5` | Expirado |
| Qualquer outro | Inválido |

Taxas de rede simuladas, em ETH: Ethereum `0.002`, Polygon `0.0005`, Solana `0.0001`. Os valores monetários são transportados como **strings decimais**; os cálculos do mock usam `BigInt` com escala de 18 casas, evitando operações financeiras em ponto flutuante no frontend.

## Cenários de simulação

No Console do navegador:

```js
window.mocks.scenarios                 // cenários disponíveis
window.mocks.setScenario('success')   // selecionar cenário
window.mocks.scenario()               // consultar cenário atual
await window.mocks.reset()            // restaurar dados e recarregar
```

| Cenário | Comportamento |
| --- | --- |
| `success` / `payment-confirmed` | Operação bem-sucedida |
| `empty` | Catálogo vazio |
| `latency` | Atraso determinístico nas operações |
| `out-of-order` | Respostas de listagens fora da ordem de envio |
| `network-error` | Falha de rede nos recursos de negócio |
| `http-4xx` / `http-5xx` | Respostas 403 / 503 |
| `session-expired` | Sessão expirada (401) |
| `register-conflict` | Conflito no cadastro |
| `validation-error` | Erros de campos (422) |
| `coupon-invalid` / `coupon-expired` | Erros de cupom |
| `price-changed` | Preço alterado durante tentativa de pedido |
| `sold-out` | Estoque insuficiente |
| `payment-refused` | Pedido recusado, sem reduzir estoque |
| `order-timeout` | Pedido gravado, mas resposta perdida; recuperação idempotente |

Para experimentar o transporte em tempo real sem mudar o cache diretamente:

```js
window.mocks.updateNftEdition({
  nftId: 'nft-01',
  editionId: 'nft-01-standard',
  priceEth: '1.35',
  availableQuantity: 4,
})
```

Outros controles de diagnóstico: `await window.mocks.probeRealtime()`, `window.mocks.stopRealtimeProbe()`, `window.mocks.disconnectRealtimeClients()` e `window.mocks.replayNftEvent(eventId)`.

### Reproduzir falhas importantes

- **Pagamento recusado:** autentique-se, prepare carrinho e checkout, ative `payment-refused` e confirme o pagamento.
- **Cotação/preço alterado:** prepare a cotação, ative `price-changed` e tente confirmar; a API bloqueia o pedido com conflito até nova cotação.
- **Estoque esgotado:** use `sold-out` antes da confirmação.
- **Timeout após criação:** use `order-timeout`; a primeira resposta falha, mas o mesmo pedido pode ser recuperado pela chave de idempotência, sem gerar uma segunda compra.
- **Falha no catálogo:** use `network-error` ou `http-5xx` para verificar o feedback e a opção de tentar novamente.

Para retornar ao estado inicial, use `await window.mocks.reset()`. O reset apaga o banco de demonstração armazenado naquele navegador, incluindo pedidos e carrinhos.

## Deploy

A aplicação está publicada na **Vercel**:

https://frontend-challenge-two-ruddy.vercel.app/

O build de produção usa `npm run build`, publica `dist/` e requer as variáveis `VITE_ENABLE_MOCKS=true` e `VITE_API_BASE_URL=/api`. As rotas de aplicação única (SPA) precisam retornar `index.html` para que o acesso direto e o refresh funcionem. A publicação vinculada ao GitHub pode ser atualizada com novos commits na branch de produção. **Os ajustes locais e os testes descritos aqui só estarão refletidos na URL pública depois de commit, push e um deploy concluído; verifique o deployment final na Vercel.**

## Limitações conhecidas

O projeto foi desenvolvido para uma entrega com prazo limitado. As seguintes restrições permanecem explícitas:

- **Perfil e carteiras:** as APIs simuladas existem e o checkout consulta carteiras, mas as páginas `/profile` e `/wallets` ainda apresentam conteúdo provisório, sem formulários completos de gerenciamento.
- **Cotação em tempo real:** a revalidação e os bloqueios de negócio existem; o aviso visual dedicado à alteração recebida durante o checkout ainda não está integralmente concluído.
- **Testes automatizados:** seis cenários foram executados em dois viewports, com último resultado reportado de 12/12 aprovações. **Não representam cobertura integral do enunciado**: faltam outros cenários extremos, regressão visual automatizada e verificação abrangente de reconexões/erros. A última rodada de polimento visual deve ser testada novamente se posterior à execução reportada.
- **Fidelidade ao Figma:** foi realizado polimento das principais telas desktop/mobile, mas ainda há diferenças de conteúdo, recursos simplificados, estados secundários e detalhes de composição. **Não é uma reprodução 100% pixel-perfect.** Banners e artigos editoriais são demonstrativos, sem sistema de publicação completo.
- **Responsividade e acessibilidade:** E2E automatizado em 390 × 844 e 1440 × 900; revisão integral de 768 px, zoom, navegação por teclado, contraste e demais critérios de acessibilidade ainda não foi concluída.
- **Lighthouse:** não há relatórios com três medições por página/perfil e medianas de Performance, Accessibility, Best Practices, SEO, LCP, CLS e TBT. Não são atribuídas pontuações sem medições.
- **Escopo visual incompleto:** algumas interações de conteúdo e recursos fora dos fluxos principais, como páginas editoriais completas e estados auxiliares do Figma, permanecem aproximados ou não implementados.
- **Backend:** MSW e `localStorage` simulam serviços e persistência no navegador; não há serviço de produção, integração blockchain ou custódia real.

As escolhas e restrições técnicas estão detalhadas no [ARCHITECTURE.md](./ARCHITECTURE.md).
