# Arquitetura — Kurio Marketplace de NFTs

Este documento descreve a arquitetura **implementada** no frontend, a API simulada, as decisões de estado e segurança, o consumo de eventos em tempo real e os desvios conhecidos de interface. Não representa uma arquitetura de serviços de produção.

## 1. Visão geral

```text
Navegador (React + TanStack Router)
    │
    ├── TanStack Query ── Axios ──► REST /api/* (MSW)
    │                                │
    │                                └── Banco do mock → localStorage
    │
    └── socket.io-client ──────────► WebSocket interceptado pelo MSW
                                     │
                                     └── nft.updated / order.updated
```

- **React 19 / TypeScript 6 / Vite 8:** interface, tipagem e build.
- **TanStack Router:** navegação e rotas privadas.
- **TanStack Query:** cache, consultas REST, mutations e invalidação.
- **Axios:** cliente único, autenticação nas requisições e tratamento de erros.
- **MSW 3:** handlers REST, banco fictício, cenários de falha e interceptação WebSocket.
- **Socket.IO client:** conexão autenticada e consumo de eventos em tempo real.
- **Tailwind CSS 4 / componentes próprios:** composição responsiva da interface.

Os contratos compartilhados ficam em `src/contracts/api.ts`. As respostas de negócio não são declaradas manualmente dentro dos componentes; são obtidas pelos handlers do MSW.

## 2. Inicialização e ambiente

Em `src/main.tsx`, os mocks são iniciados por import dinâmico quando `VITE_ENABLE_MOCKS=true`, antes de `initSession()` e da montagem do React. Essa ordem é indispensável para que o MSW intercepte o WebSocket usado pelo `socket.io-client`.

Variáveis:

```dotenv
VITE_ENABLE_MOCKS=true
VITE_API_BASE_URL=/api
VITE_MOCK_SCENARIO=success
```

O build Vite é estático (`dist/`), com hospedagem na Vercel. As rotas da SPA exigem rewrite/fallback para `index.html`. O MSW depende de `public/mockServiceWorker.js`, incluído na publicação.

## 3. Organização dos módulos

| Área | Responsabilidade |
| --- | --- |
| `src/router.ts` | Rotas, parâmetros e guards de autenticação |
| `src/main.tsx` | Inicialização do MSW, sessão e provedores |
| `src/lib/api-client.ts` | Axios, token em memória e tratamento de respostas |
| `src/lib/session.ts` | Login persistido, recuperação, logout e limpeza de estado |
| `src/lib/query-client.ts` | Política global do TanStack Query |
| `src/hooks/` | Queries e mutations de catálogo, carrinho, favoritos, cotações, pedidos e carteiras |
| `src/components/realtime-sync.tsx` | Ciclo de vida da conexão Socket.IO |
| `src/lib/realtime-cache.ts` | Aplicação de eventos ao TanStack Query |
| `src/lib/realtime-snapshots.ts` | Preferência por versões mais recentes |
| `src/mocks/handlers/` | Contratos REST e regras da API simulada |
| `src/mocks/socket-io.ts` | Handshake, envio e isolamento dos eventos |
| `src/mocks/db.ts` / `seed.ts` | Estado persistido e dados fictícios |
| `src/mocks/scenario.ts` | Seleção dos cenários determinísticos |
- `src/pages/` / `src/components/` | Páginas e componentes visuais |
| `tests/e2e/` / `playwright.config.ts` | Testes E2E e configuração desktop/mobile |

## 4. Rotas

| Rota | Conteúdo | Acesso |
| --- | --- | --- |
| `/` | Catálogo, destaques, busca e filtros | Público |
| `/nfts/$nftId` | Detalhe, edições e compra | Público |
| `/cart` | Carrinho, cupons e resumo | Público |
| `/checkout` | Formulário, carteira, revisão e pagamento | Autenticado |
| `/orders/$orderId/confirmation` | Estado do pedido e recibo | Autenticado |
| `/login` / `/register` | Autenticação e cadastro | Público |
| `/profile` / `/wallets` | Rotas protegidas; telas ainda provisórias | Autenticado |

As rotas protegidas aguardam `initSession()` e redirecionam para o login, preservando o destino validado. URLs desconhecidas apresentam uma página 404 com retorno ao catálogo.

## 5. Contratos REST

A API simulada usa prefixo `/api`, JSON para requisições e respostas e 204 sem corpo quando aplicável.

| Método | Endpoint | Operação |
| --- | --- | --- |
| POST | `/auth/register`, `/auth/login` | Cadastro e login |
| GET / POST | `/auth/session`, `/auth/logout` | Restauração e encerramento |
| GET | `/nfts`, `/nfts/:id`, `/nfts/facets` | Listagem, detalhe e filtros |
| GET / POST / DELETE | `/favorites`, `/favorites/:nftId` | Favoritos |
| GET | `/cart` | Consultar carrinho |
| POST | `/cart/items`, `/cart/merge` | Adicionar e mesclar itens |
| PATCH / DELETE | `/cart/items/:itemId` | Editar e remover itens |
| POST | `/quotes` | Calcular e registrar cotação |
| POST / GET | `/orders`, `/orders/:id` | Criar e consultar pedido |
| GET / PATCH | `/profile` | Ler e atualizar perfil via API |
| PUT | `/profile/password` | Trocar senha via API |
| GET / POST / PATCH | `/wallets`, `/wallets/:id` | Gerenciar carteiras via API |

### Regras de domínio e validação

- Filtros do catálogo combinam busca, categorias, coleções, redes, preço, ordenação e paginação. Arrays são enviados por parâmetros repetidos; páginas começam em 1, com tamanho padrão 12 e máximo 48. As abas são um estado de apresentação/consulta: **Todos** usa a listagem normal; **Novos lançamentos** prioriza ordenação recente; **Em alta** utiliza `featured: true` no pedido de listagem, sem gerar estatísticas falsas de popularidade.
- O preço de referência na listagem é o menor preço de edição disponível. Sem estoque, o NFT não satisfaz filtros de preço e aparece ao final da ordenação por preço. O slider de mínimo/máximo converte a seleção em filtros REST reais `minPriceEth` / `maxPriceEth`.
- ETH trafega como **string decimal**; o mock calcula com `BigInt` usando 18 casas. Não há cálculo financeiro com `Number` no frontend.
- Quantidades precisam ser inteiras positivas e respeitar `availableQuantity` e `maxPerOrder`.
- Datas usam ISO 8601. Contratos de erro seguem `ApiErrorResponse` com códigos como `VALIDATION_ERROR`, `OUT_OF_STOCK`, `QUOTE_CHANGED`, `SESSION_EXPIRED` e `IDEMPOTENCY_CONFLICT`.
- Os handlers aplicam autorização e validação, independentemente da proteção visual das rotas.

## 6. Sessão e separação de usuários

- A sessão usa `frontend-challenge:session` no `localStorage`, contendo token e expiração; o usuário é recuperado por `GET /auth/session` antes da renderização inicial.
- O token também fica em memória no Axios, que envia `Authorization: Bearer <token>` nas chamadas autenticadas.
- Falhas 401 que indiquem sessão inválida ou expirada encerram o estado local. Falhas de rede ou 5xx na restauração não removem automaticamente o token.
- Login, logout e troca de sessão limpam o cache privado do TanStack Query, snapshots de tempo real e conexões/listeners associados.
- Queries particulares incluem identificadores de usuário nas chaves. O backend simulado valida a propriedade de carteiras e pedidos.
- Senhas fictícias são armazenadas no banco do mock apenas como hash PBKDF2 SHA-256 com salt, não como texto claro.

**Limite de segurança:** `localStorage` não substitui sessões com cookie `httpOnly` de uma API real e permanece sujeito a riscos de XSS. O projeto é uma demonstração, sem serviço de autenticação de produção.

## 7. Carrinho, cotação e pagamento

### Carrinho

- Visitantes usam `X-Guest-Cart-Id`, salvo em `frontend-challenge:guest-cart-id`; usuários autenticados usam o token.
- A consulta autenticada executa `POST /cart/merge` quando há carrinho visitante pendente. O mock combina itens e aplica limites de estoque, excluindo o carrinho visitante após sucesso.
- O identificador visitante é removido localmente apenas após mesclagem bem-sucedida. Falhas o preservam para uma nova tentativa.
- Queries e mutations reutilizam o mesmo cache, alimentando o contador desktop/mobile. Alterações são persistidas no banco do mock e resistem ao refresh.

### Cotação

- `POST /quotes` monta itens e preços correntes, descontos, taxa por rede e total. A cotação tem prazo de cinco minutos e usa a versão do carrinho.
- Cupons de demonstração: `BEMVINDO10` (10%), `ARTE25` (25%), `VERAO5` (expirado).
- As chaves de cache consideram proprietário, carrinho, versão, rede e cupom. Uma mudança pode exigir nova cotação.

### Pedido e idempotência

- `POST /orders` exige `Idempotency-Key` (até 128 caracteres).
- Nova chave cria pedido (201); repetição com mesma chave e conteúdo recupera **o mesmo pedido** (200); reutilizar uma chave com outro conteúdo retorna 409.
- O registro de idempotência é isolado por usuário. A comparação envolve cotação, carteira, rede e dados do colecionador.
- O MSW revalida a cotação, estoque, preço e compatibilidade da carteira antes de criar o pedido. Conflitos bloqueiam a criação.
- Após confirmação, o mock reduz estoque e itens comprados do carrinho e persiste um recibo (`order.receipt`) com os valores originais. Recusa mantém o carrinho.
- A recuperação de uma resposta perdida usa a **mesma chave e o mesmo corpo**; a tentativa pendente fica persistida por usuário para recuperação após refresh ou reconexão.
- Pedidos `confirmed` e `rejected` são estados terminais. Apenas o proprietário pode obter o pedido pela API.
- O recibo usa os valores gravados na compra; não recalcula preços consultando o catálogo atual.

## 8. Tempo real e consistência de cache

### Transporte

O MSW 3 intercepta conexões WebSocket e simula o handshake Engine.IO 4 / Socket.IO no namespace padrão. O cliente usa exclusivamente o transporte WebSocket e é **importado dinamicamente após iniciar o MSW**, evitando capturar o WebSocket nativo antes da interceptação. Não há polling HTTP, mensagens binárias ou servidor Socket.IO completo de produção.

### Eventos

| Evento | Conteúdo | Destinatários |
| --- | --- | --- |
| `nft.updated` | `eventId`, `resourceId`, `version`, `occurredAt`, `nft` | Conexões disponíveis, inclusive visitantes |
| `order.updated` | `eventId`, `resourceId`, `version`, `occurredAt`, `sessionId`, `userId`, `order` | Apenas sessão autenticada do proprietário |

O token é enviado no handshake, validado no mock e **não deve aparecer em logs**. Ao enviar um evento privado, o mock revalida a sessão e a propriedade do pedido.

### Atualização e reconciliação

1. O mock persiste a alteração e só então publica o evento.
2. `RealtimeSync` escuta os eventos e verifica o ciclo de vida da sessão.
3. `realtime-snapshots.ts` mantém, em memória, a versão mais recente conhecida de cada recurso.
4. `realtime-cache.ts` descarta versões repetidas ou antigas, cancela consultas concorrentes e atualiza detalhes/listas do TanStack Query.
5. As consultas REST usam a mesma preferência por versões recentes antes de devolver dados ao cache.
6. Após conexão/reconexão, consultas ativas são invalidadas para reconciliar possíveis eventos perdidos, incluindo ordenação, filtros e paginação.
7. Logout ou troca de conta encerra conexões, remove listeners e descarta snapshots e cache privado.

Os cenários `out-of-order`, `price-changed`, `sold-out` e os controles de diagnóstico permitem experimentar a consistência. A verificação de todos os interleavings possíveis entre eventos e respostas REST não é reivindicada como prova formal.

## 9. MSW e cenários de teste

- `src/mocks/db.ts`: estado persistido na chave `frontend-challenge:mock-db`; versões de esquema podem reinicializar dados incompatíveis.
- `src/mocks/seed.ts`: contas e catálogo determinísticos.
- `src/mocks/handlers/scenario.ts`: perturba requisições conforme o cenário ativo.
- `src/mocks/start.ts`: inicializa o mock e disponibiliza `window.mocks` para diagnóstico.

O mock fornece cenários de sucesso, vazio, latência, resposta fora de ordem, falhas de rede e HTTP, sessão expirada, erro de validação, conflito de cadastro, cupom inválido/expirado, mudança de preço, falta de estoque, pagamento recusado e timeout após criação de pedido.

```js
window.mocks.setScenario('price-changed')
window.mocks.scenario()
await window.mocks.reset()

// Publica alteração real pelo transporte mockado:
window.mocks.updateNftEdition({
  nftId: 'nft-01',
  editionId: 'nft-01-standard',
  priceEth: '1.35',
})
```

Também existem `probeRealtime`, `stopRealtimeProbe`, `replayNftEvent` e `disconnectRealtimeClients`. Esses controles são exclusivos da demonstração e não atualizam diretamente o estado React.

## 10. Interface, design e acessibilidade

### Tokens e composição

A identidade visual foi aproximada a partir dos frames do Figma:

| Token | Valor |
| --- | --- |
| Fundo / Ink | `#140D0A` |
| Texto principal | `#F5F1EB` |
| Texto secundário | `#CFB28C` |
| Primária | `#D28A4C` |
| Acento | `#E89B55` |
| Painéis | `#241612` |

Fonte principal: **Roboto Mono**, servida localmente por Fontsource. Assets de NFTs ficam em `src/assets/images/nfts/`; elementos SVG de navegação ficam em `src/assets/navigation/`.

- Desktop: `DesktopHeader`, filtros laterais do catálogo, tabela de carrinho, rodapé e seções editoriais da Home nas páginas previstas.
- Mobile: `MobileNavigation`, navegação inferior, busca, carrinho em cartões e menu em `<dialog>` nativo; o foco volta ao acionador quando o diálogo é fechado.
- Estados compartilhados: `LoadingSkeleton` (com shimmer e preferência por movimento reduzido), `EmptyState` e `ErrorState`.
- A página de detalhes mostra galeria, edições, atributos, quantidade e ações de compra; a composição desktop/mobile foi refinada para aproximar os frames de referência. O carrinho usa os dados atuais de estoque e preços, com ações reais mesmo no layout em tabela.
- Elementos relevantes incluem rótulos, estados de erro e foco visível nos componentes revisados.

### Desvios conhecidos em relação ao Figma

- Abas de catálogo, slider duplo de preço, paginação numérica, galeria de detalhes e carrinho foram refinados para refletir melhor a composição do Figma. As abas usam os recursos reais disponíveis: **Em alta** filtra o marcador `featured`, não uma métrica de popularidade inexistente no mock.
- As seções de banners e artigos editoriais são demonstrações de conteúdo, não um CMS; fotos e textos podem diferir dos frames originais.
- Alguns espaçamentos, dimensões, raios, textos e estados secundários foram aproximados, não copiados pixel a pixel.
- Ícones sociais e parte dos ícones da navegação usam versões simplificadas ou Lucide. O botão central da barra inferior abre o menu por comportamento adaptado.
- O modal desktop de autenticação utiliza composição de catálogo ao fundo. A aparência pode variar de acordo com viewport, dados exibidos e o nível de escurecimento do backdrop.
- A fidelidade fina em 390, 768 e 1440 px, zoom, estados de erro/validação e contrastes depende de verificação final completa; não se reivindica conformidade integral com Figma ou WCAG.

## 11. Qualidade, testes e publicação

Comandos previstos no projeto:

```bash
npm run typecheck
npm run lint
npm run build
npm run preview
npm run test:e2e
npm run test:e2e:report
```

### Suíte E2E validada

O Playwright roda com **Chromium desktop (1440 × 900)** e **mobile (390 × 844)**, `workers: 1`, serviço Vite com MSW local e **relatório HTML, screenshots, vídeo e trace em caso de falha**. A última execução completa **reportada pelo desenvolvedor em 25/10/2026** aprovou **12/12 execuções**: seis cenários em cada viewport.

| Origem | Cenário | Evidências verificadas |
| --- | --- | --- |
| `tests/e2e/home.spec.ts` | Smoke da Home | Título e navegação, com diferenças de controles desktop/mobile |
| `tests/e2e/purchase.spec.ts` — 01 | Compra completa | Detalhe → carrinho → autenticação → carteira → cotação → pagamento → recibo persistente após F5 |
| `purchase.spec.ts` — 02 | Carrinho/cupom | Quantidade após refresh, mesclagem visitante→autenticado e desconto `BEMVINDO10` |
| `purchase.spec.ts` — 03 | Recusa/idempotência | `payment-refused`, clique repetido e ausência de duplicação de pedidos |
| `purchase.spec.ts` — 04 | Timeout/recuperação | `order-timeout`, pedido gravado antes da perda da resposta, recuperação após F5, mesma tentativa/chave e somente um pedido |
| `purchase.spec.ts` — 05 | Preço via WebSocket | Emissão de `nft.updated` no MSW, atualização no checkout, bloqueio de cotação desatualizada e nova revisão |

Os testes de compra usam contextos isolados do runner e reinicialização explícita do banco do MSW (`window.mocks.reset(false)`) antes do cenário. A validação combina asserções de UI e, nos casos de idempotência, leitura do **banco fictício local** para contar pedidos. A simulação de eventos passa pelo cliente Socket.IO.

```bash
npx playwright install chromium
npm run test:e2e
npm run test:e2e:report
```

**Escopo e temporalidade da evidência:** 12 execuções bem-sucedidas não significam cobertura de todos os requisitos do desafio. Não foram comprovadas suites amplas de acessibilidade, regressão visual, múltiplos navegadores, todos os estados de erro ou reconexões. O resultado reportado é anterior ao pacote final de polimento do carrinho e do modal; caso esse pacote esteja incluído na entrega, é necessário executar novamente `npm run test:e2e`, `npm run typecheck`, `npm run lint` e `npm run build` para atestar o estado final.

Publicação: https://frontend-challenge-two-ruddy.vercel.app/  
O projeto usa build estático Vite e deploy vinculado ao repositório GitHub. O acesso direto às rotas exige fallback SPA; a demonstração requer MSW habilitado nas variáveis de build.

**Lighthouse:** não há medianas ou pontuações auditadas fornecidas nesta revisão. Não são declaradas metas atingidas sem relatórios mensuráveis.

## 12. Limitações da entrega

Por restrição de tempo, o foco foi assegurar os fluxos principais e a publicação. Permanecem limites conhecidos:

- As rotas `/profile` e `/wallets` são páginas provisórias. Os handlers e contratos REST existem, mas os formulários visuais de edição de perfil, avatar, senha e gestão de carteiras não estão completos.
- O checkout já revalida valores e lida com conflitos. A experiência dedicada de alerta proativo para toda alteração de preço/estoque durante a compra ainda não foi finalizada.
- A suíte Playwright alcançou **12 execuções aprovadas reportadas (seis cenários × dois viewports)**, mas não cobre exaustivamente cenários extremos, reconexões, acessibilidade e regressão visual; uma rodada visual posterior precisa de revalidação.
- Auditoria Lighthouse completa (três execuções por página e viewport, medianas e diagnóstico das métricas) não foi documentada por falta de resultados medidos.
- O polimento visual avançou na Home, Detalhes, carrinho e modais, mas o Figma não foi reproduzido 100%; faltam checagens sistemáticas de fidelidade, conteúdo demonstrativo, acessibilidade e responsividade intermediária (768 px).
- O banco simulado é local ao navegador. Não há servidor multiusuário, transação blockchain nem persistência compartilhada de produção.
- As seções editoriais, integrações sociais e opções fora dos fluxos principais podem ser demonstrativas ou não possuir páginas de destino completas.

Essas limitações não alteram a existência das APIs, da simulação de compras e da conexão em tempo real descritas acima, mas delimitam o escopo efetivamente demonstrado.
