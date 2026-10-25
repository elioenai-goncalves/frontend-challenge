# Arquitetura

## Identidade visual

Valores confirmados por inspeção do Figma.

### Cores

- Color/Ink: #140D0A (fundo da página e texto sobre o botão primário).
- Color/Foreground: #F5F1EB (texto principal).
- Color/Text Secondary: #CFB28C.
- Color/Primary: #D28A4C (fundo do botão primário).
- Text/Accent: #E89B55 (ação de texto no mobile).
- Color/Surface Card: #241612 (painéis, mapeado para `card` do shadcn).

### Tipografia

A variável font/family foi interpretada como Roboto Mono em todos
os textos inspecionados. A fonte é servida localmente pelo pacote
@fontsource-variable/roboto-mono.

| Uso | Tamanho | Peso | Altura de linha |
| --- | --- | --- | --- |
| Título desktop (Display/43 Bold) | 43px | 700 | 70px |
| Título mobile | 18px | 700 | 29px |
| Apoio desktop | 14px | 400 | 24px |
| Apoio mobile | 12px | 400 | 18px |
| Botão primário desktop | 16px | 700 | 20px |
| Ação de texto mobile | 12px | 700 | 14px |

Espaçamento entre letras: 0% em todos.

### Botão primário (Explorar, desktop)

- Fundo #D28A4C, texto #140D0A, raio 6px.
- Referência do Figma: 140 × 40px, padding 10px vertical,
  28px esquerdo e 36px direito, gap 10px.

### Mobile / Início

- Frame de referência: 414 × 896px.
- Padding superior 40px e laterais 24px.
- O texto do banner difere do desktop.
- "Explorar" é uma ação de texto com seta, sem fundo preenchido.

## Assets

- Fonte: Roboto Mono, local via Fontsource.
- Imagens: 4 imagens distintas de NFTs, reaproveitadas em vários
  cards. Ficam em src/assets/images/nfts/, nomeadas pelo conteúdo.
- Os arquivos de exemplo do template do Vite foram removidos.

## Desvios e pendências

- Largura de 140px do botão desktop deixa só 76px para o texto
  com os paddings do Figma. Foi usada largura mínima.
- Raio do painel de filtros não foi identificado.
- A seta da ação mobile é um caractere provisório, a trocar pelo
  ícone do Figma.
- O breakpoint (lg) e os espaçamentos da página de amostra são
  provisórios.
- Dimensões e raio dos frames de referência não são fixados na
  aplicação.

## Contratos REST

A API simulada usa o prefixo /api.
Requisições e respostas usam JSON, exceto respostas 204,
que não possuem corpo.

Os contratos TypeScript ficam em src/contracts/api.ts.

### Endpoints

| Método | Caminho | Entrada | Resposta |
| --- | --- | --- | --- |
| POST | /auth/register | RegisterRequest | SessionResponse |
| POST | /auth/login | LoginRequest | SessionResponse |
| GET | /auth/session | — | SessionResponse |
| POST | /auth/logout | — | 204 |
| GET | /nfts | ListNftsRequest na query string | ListNftsResponse |
| GET | /nfts/:id | — | NftResponse |
| GET | /favorites | — | FavoritesResponse |
| POST | /favorites | AddFavoriteRequest | FavoritesResponse |
| DELETE | /favorites/:nftId | — | FavoritesResponse |
| GET | /cart | — | CartResponse |
| POST | /cart/items | AddCartItemRequest | CartResponse |
| PATCH | /cart/items/:itemId | UpdateCartItemRequest | CartResponse |
| DELETE | /cart/items/:itemId | — | CartResponse |
| POST | /cart/merge | MergeCartRequest | CartResponse |
| POST | /quotes | QuoteRequest | QuoteResponse |
| POST | /orders | CreateOrderRequest | OrderResponse |
| GET | /orders/:id | — | OrderResponse |
| GET | /profile | — | ProfileResponse |
| PATCH | /profile | UpdateProfileRequest | ProfileResponse |
| PUT | /profile/password | ChangePasswordRequest | SuccessResponse |
| GET | /wallets | — | WalletsResponse |
| POST | /wallets | SaveWalletRequest | WalletResponse |
| PATCH | /wallets/:id | SaveWalletRequest | WalletResponse |
| GET | /nfts/facets | — | NftFacetsResponse

### Regras de transporte e validação

- Valores ETH trafegam como strings decimais não negativas.
  Cálculos devem usar aritmética decimal precisa.
- Quantidades são números inteiros positivos.
- Datas são strings ISO 8601.
- Paginação começa em 1; pageSize padrão 12 e máximo 48.
- Ordenação padrão: recent.
- Arrays nos filtros são parâmetros repetidos:
  networks=ethereum&networks=polygon.
- Todos os filtros informados são combinados.
- Preço de referência para filtro e ordenação:
  menor preço entre as edições disponíveis do NFT.
- Sem edição disponível, o NFT não corresponde a filtros
  de preço e aparece ao final da ordenação por preço.
- Recursos privados usam Authorization: Bearer <token>.
- O carrinho visitante é identificado por X-Guest-Cart-Id.
  Esse identificador é criado localmente e mantido após refresh.
- O carrinho autenticado é identificado pela sessão.
- A mescla de carrinho exige autenticação e preserva os itens
  do visitante. Disponibilidade e limites devem ser revalidados.
- A cotação usa o carrinho do usuário ou visitante identificado.
- Remover um cupom solicita nova cotação sem couponCode.
- Cadastro, login e troca de senha recebem senhas na requisição,
  mas nunca as retornam nem persistem em texto claro.
- avatarUrl aceita URL de imagem ou data URL validada para
  sustentar a simulação de upload local.
- As regras de autorização pertencem aos handlers, não apenas
  à proteção de rotas da interface.

### Erros

Formato: ApiErrorResponse.

- 400: cupom inválido ou expirado.
- 401: credenciais inválidas, sessão ausente ou expirada.
- 403: falta de permissão.
- 404: recurso inexistente.
- 409: conflito de cadastro, disponibilidade, cotação ou idempotência.
- 422: erros de validação, com fieldErrors.
- 503: falha transitória.

Erros de conexão ou timeout podem não ter resposta HTTP.

### Pedidos e idempotência

- POST /orders exige o cabeçalho Idempotency-Key.
- A primeira criação retorna 201.
- Mesma chave e mesmo conteúdo recuperam o mesmo pedido
  com 200, inclusive após timeout.
- Mesma chave com conteúdo diferente retorna 409.
- A chave é isolada por usuário.
- Cotação expirada ou alterada impede a criação e exige
  nova cotação e revisão.
- O pedido guarda cópias dos itens, valores, dados do
  colecionador e carteira no momento da criação.
- Confirmed e rejected são estados terminais.
- Apenas o dono autenticado pode consultar o pedido.

## Contratos Socket.IO

### nft.updated

Contém eventId, resourceId, version, occurredAt e nft.
resourceId corresponde ao id do NFT, e version à versão do NFT.

### order.updated

Contém eventId, resourceId, version, occurredAt, sessionId,
userId e order.
resourceId corresponde ao id do pedido, e version à sua versão.

### Regras

- eventId identifica a emissão e permite descartar duplicatas.
- version cresce a cada alteração do recurso.
- Eventos antigos não podem regredir o estado.
- Eventos privados só são aplicados à sessão correspondente.
- Após reconexão, recursos ativos são consultados via REST.
- REST e eventos leem o mesmo estado simulado.
- Listeners são removidos quando seu ciclo de vida termina.

## Cliente HTTP e estado remoto

### Transporte HTTP

- As chamadas REST usam a instância Axios de
  `src/lib/api-client.ts`.
- A URL base vem de `VITE_API_BASE_URL`, com fallback para `/api`.
- Os contratos TypeScript ficam em `src/contracts/api.ts`.
- `setApiAccessToken` permite configurar ou remover o token
  utilizado no cabeçalho Authorization: Bearer.
- O token é mantido apenas em memória nessa camada.
- A autenticação completa e a recuperação da sessão serão
  integradas na Issue 12.
- Mensagens da API são lidas de `ApiErrorResponse.error.message`.
- A interface também trata erros comuns sem resposta HTTP.
- Respostas com Content-Type `text/html` são rejeitadas.
- Essa verificação não substitui a validação completa do JSON
  em tempo de execução.

### Cache e consultas

- O QueryClient fica em `src/lib/query-client.ts`.
- O QueryClientProvider disponibiliza o cliente à aplicação.
- Configuração explícita:
  - staleTime: 30000.
  - retry: 1.
  - refetchOnWindowFocus: false.
- As chaves de listagem seguem o formato:
  ['nfts', userId, 'list', params].
- Visitantes usam userId igual a null.
- A integração da sessão deverá fornecer o identificador do
  usuário correspondente ao token.
- O hook usa ListNftsRequest e ListNftsResponse.
- Filtros em arrays são enviados como parâmetros repetidos.
- O AbortSignal recebido pela queryFn é repassado ao Axios.
- Não há persistência de cache configurada nesta etapa.

### Sincronização e limites desta entrega

- Esta etapa configura a infraestrutura de consultas REST.
- A integração de sessão e a limpeza do cache no logout
  pertencem à Issue 12.
- Os handlers REST do MSW pertencem à Issue 07.
- A atualização por eventos e a reconciliação após reconexão
  pertencem às Issues 10 e 11.
- A tela atual é temporária e serve para diagnóstico.

### Verificações manuais da Issue 04

- Resposta HTML rejeitada e exibida como erro na interface.
- Estado de sucesso verificado com JSON estático temporário
  servido pela rede.
- O arquivo temporário foi removido após a verificação.
- A validação integrada com os handlers reais do MSW continua
  prevista para a Issue 07.

## Roteamento

### Organização

- TanStack Router configurado por código em `src/router.ts`.
- RouterProvider renderizado por `src/App.tsx`.
- QueryClientProvider mantido em `src/main.tsx`.
- Layout provisório em `src/components/route-layout.tsx`.
- Páginas provisórias em `src/pages/route-pages.tsx`.
- O layout definitivo seguindo o Figma pertence à Issue 06.

### Mapa de rotas

| Caminho | Tela | Acesso |
| --- | --- | --- |
| / | Início | Público |
| /nfts/$nftId | Detalhes do NFT | Público |
| /cart | Carrinho | Público |
| /checkout | Pagamento | Privado |
| /orders/$orderId/confirmation | Confirmação | Privado |
| /login | Login | Público |
| /register | Cadastro | Público |
| /profile | Perfil | Privado |
| /wallets | Carteiras | Privado |

- Endereços não reconhecidos exibem a página 404.
- A página 404 possui link para o início.
- Os caminhos foram definidos como organização interna do projeto.

### Parâmetros do catálogo

- Validados em `src/lib/catalog-search.ts`.
- O objeto validado segue ListNftsRequest.
- Campos: search, collectionIds, categories, networks,
  minPriceEth, maxPriceEth, sort, page e pageSize.
- Página padrão: 1.
- Tamanho padrão: 12; máximo: 48.
- Ordenação padrão: recent.
- Redes aceitas: ethereum, polygon e solana.
- Preços são devolvidos como strings decimais não negativas.
- Valores inválidos são descartados ou recebem fallback.
- A validação não reescreve automaticamente a URL.
- A navegação de demonstração preserva os parâmetros anteriores
  e reinicia a paginação ao alterar a busca.
- A interface definitiva dos filtros pertence à Issue 13.

## Sessão e autenticação

- O token e a validade ficam no `localStorage` (`frontend-challenge:session`).
  O usuário não é guardado: é obtido de `GET /auth/session` na abertura do app,
  antes da primeira renderização (`initSession` em `src/main.tsx`).
- O token também é mantido em memória no cliente Axios (`setApiAccessToken`).
- Se a recuperação receber 401, a sessão é descartada. Falhas de rede ou 5xx não
  apagam o token.
- Rotas privadas usam `beforeLoad`, que aguarda a recuperação da sessão e
  redireciona para `/login?redirect=<destino>`. Login e cadastro redirecionam
  usuários autenticados para o início.
- O destino de retorno é validado para permanecer na mesma origem.
- Um 401 `SESSION_EXPIRED` ou `UNAUTHORIZED` com token ativo encerra a sessão.
  Em rota privada, leva ao login preservando o destino; em rota pública, apenas
  encerra a sessão.
- Login, cadastro, logout e expiração limpam o cache do TanStack Query
  (`queryClient.clear()`) e executam os callbacks registrados em `onSessionEnd`
  (usado pela conexão Socket.IO na Issue 11).
- Armazenar o token em `localStorage` expõe o dado a ataques de script (XSS).
  É uma simplificação da simulação; uma API real usaria cookie `httpOnly`.
- Guards de navegação não substituem autorização na API.
- Os formulários de login e cadastro seguem os tokens do projeto e têm
  aparência provisória até a conferência com os frames do Figma.

### Login e cadastro (layout)

- Desktop: modal nativo (`<dialog>`) de 500 px (login: 600 px de altura mínima;
  cadastro: 656 px), fundo Surface Card, faixa laranja na borda inferior.
  Mobile: tela cheia no fundo da página, com padding 80/28/24/28 e espaço de 40.
- Abas "Entrar" e "Criar conta" são links entre `/login` e `/register` e
  preservam o parâmetro `redirect`.
- Os campos mostram apenas o placeholder do Figma; o rótulo existe para
  tecnologias assistivas (`sr-only`).
- "Esqueceu a senha?" e os botões Google e Facebook aparecem desabilitados,
  por estarem fora do escopo.
- Aproximações: recuo lateral, alturas de campo e botão do desktop foram
  estimados a partir de captura; os ícones de Google e Facebook são letras
  provisórias; o fundo do modal no desktop ainda não exibe o catálogo
  (Issue 13).

### Verificações manuais

- Navegação pelas nove rotas e página 404.
- Redirecionamento de visitante em rotas privadas.
- Retorno ao destino após simular sessão em desenvolvimento.
- Encerramento da sessão provisória.
- Parâmetros válidos e inválidos do catálogo.
- Histórico e refresh dos parâmetros da URL.
- Acesso direto e refresh das rotas no preview.
- Typecheck, lint e build executados com sucesso.

## Layout compartilhado e componentes de estado

### Organização

- DesktopHeader: cabeçalho desktop e variante com divisória.
- SiteFooter: rodapé institucional desktop.
- MobileNavigation: busca, navegação inferior e menu mobile.
- RouteLayout: composição dos elementos conforme a rota.
- LoadingSkeleton, EmptyState e ErrorState: componentes reutilizáveis.

### Composição por rota

- Cabeçalho desktop nas telas previstas, exceto confirmação.
- Divisória no início, login, cadastro, perfil e carteiras.
- Rodapé desktop no início, detalhe do NFT, carrinho e pagamento.
- Mobile: busca e navegação inferior no início.
- Demais páginas atendidas pela navegação mobile usam controles
  superiores simplificados.
- Login, cadastro e confirmação não recebem a navegação mobile
  compartilhada.
- O breakpoint utilizado para a variante desktop é lg.

### Assets e adaptações

- Fundo da barra inferior e símbolo central exportados do Figma
  como SVGs locais em src/assets/navigation.
- Barra inferior com largura máxima de 414px, centralizada
  em larguras intermediárias.
- Botão superior mobile: 45 × 45px e raio de 14px.
- Botão central dimensionado proporcionalmente à referência
  de 65px em uma barra de 414px.
- O círculo central ainda usa preenchimento sólido no lugar
  do gradiente original.
- Ícones laterais e do cabeçalho usam aproximações com Lucide.
- Redes sociais do rodapé são apresentadas por nome,
  não pelos ícones originais.
- Alguns espaçamentos e a cor da faixa da marca são aproximações.

### Navegação e limites funcionais

- Mercado e busca desktop levam ao catálogo na rota inicial.
- Mercado recebe destaque no detalhe, carrinho e pagamento.
- O menu mobile aberto é uma adaptação de UX:
  não existe frame desse estado na referência enviada.
- O símbolo central abre o menu por decisão de implementação;
  sua função original no protótipo não foi confirmada.
- O painel utiliza dialog nativo aberto com showModal.
- O fechamento devolve o foco ao botão de abertura quando
  ele continua disponível no documento.
- O painel é fechado ao mudar para a largura desktop.
- Favoritos permanece desabilitado nesta etapa.
- Newsletter e páginas auxiliares não simulam sucesso funcional.
- Contatos do rodapé são ilustrativos do mockup.
- Quantidade do carrinho e menu de usuário com dados reais
  permanecem para as Issues 16 e 12.

### Interpretação do escopo

- O texto original da Issue 06 previa cabeçalho e rodapé
  em todas as rotas.
- A implementação segue as variantes identificadas nos frames,
  incluindo ausência de rodapé institucional nas telas mobile
  fornecidas e outras exceções de composição.
- Essa interpretação foi acordada durante a implementação.

### Estados reutilizáveis

- LoadingSkeleton recebe dimensões pela propriedade className.
- O shimmer é desativado com prefers-reduced-motion: reduce.
- EmptyState recebe título e descrição opcional.
- ErrorState recebe mensagem, callback de nova tentativa
  e indicação opcional de tentativa em andamento.
- A integração com consultas reais ocorrerá nas issues das telas.

## API simulada (MSW)

### Organização

- `src/mocks/browser.ts`: worker do MSW. `src/mocks/start.ts`: inicializa o
  banco e o worker, e expõe `window.mocks.reset()`.
- `src/mocks/db.ts`: estado em memória persistido no `localStorage`.
  `SCHEMA_VERSION` descarta estado antigo quando o formato muda.
- `src/mocks/seed.ts` e `catalog.ts`: 2 usuários e 16 NFTs determinísticos.
- `src/mocks/handlers/`: um arquivo por recurso.
- Os mocks são carregados por `import()` dinâmico somente quando
  `VITE_ENABLE_MOCKS` é `true`.

### Decisões

- Os handlers rodam na página, por isso acessam o `localStorage`.
- Senhas: apenas hash PBKDF2 (SHA-256, 100 mil iterações) com salt por usuário.
  É um mock; não substitui um backend real.
- Imagens: o estado guarda chaves; a URL final é resolvida na resposta,
  porque o Vite altera os nomes dos arquivos a cada build.
- ETH: aritmética em `bigint` com 18 casas (`src/mocks/decimal.ts`).
- Carrinho de visitante: id criado no cliente e enviado em
  `X-Guest-Cart-Id`. A mescla remove o carrinho do visitante e limita
  quantidades a estoque e máximo por pedido.
- Cotação: calculada do carrinho com preços atuais; validade de 5 minutos.
  Visitantes podem cotar, mas só o dono do carrinho cria pedido.
- Pedido confirmado: guarda cópia da cotação (recibo), baixa o estoque das
  edições, incrementa a versão do NFT e remove do carrinho os itens comprados.
- Cotação expirada ou carrinho alterado: erro 409 `QUOTE_CHANGED`.
- Carteiras: no máximo uma principal e uma secundária por usuário;
  endereço validado por rede.
- Pedido de outro usuário responde 404, sem revelar a existência.

### Limites desta entrega
- Socket.IO: Issues 10 e 11.

### Verificações manuais da Issue 07

Autenticação e sessão
- Login válido retorna sessão; senha incorreta retorna 401.
- Cadastro novo retorna 201; e-mail repetido retorna 409.
- Logout retorna 204 sem corpo.
- Senhas guardadas apenas como salt e hash no `localStorage`.

Catálogo
- Listagem com 16 NFTs e paginação (12 por página; página 2 com 4 itens).
- Busca textual, ordenação por preço e filtros de rede e de faixa de preço.
- Detalhe de NFT existente (200) e inexistente (404).

Favoritos
- Sem token retorna 401.
- Favoritar retorna 201; repetir não duplica e retorna 200.
- NFT inexistente retorna 404; remoção atualiza a lista.
- Favoritos isolados por usuário.

Carrinho
- Carrinho de visitante exige `X-Guest-Cart-Id` e usa o id enviado.
- Adição de item, soma de quantidade do mesmo item, limite por pedido,
  edição sem estoque e edição inexistente.
- Alteração e remoção de item.
- Mescla do visitante ao autenticar, sem somar de novo ao repetir.

Cotação
- Sem token e sem identificação do visitante é recusada.
- Carrinho vazio e rede inválida retornam erro de validação.
- Subtotal, taxa de rede e total em aritmética decimal.
- Cupom válido (sem diferenciar maiúsculas), inválido e expirado (400).
- Cotação de visitante é aceita, mas não pode gerar pedido.

Pedidos
- Validação do colecionador, da carteira e da rede.
- Criação retorna 201 com status confirmado e recibo da cotação.
- Segunda tentativa com a mesma cotação retorna 409.
- Carrinho esvaziado e estoque do catálogo atualizado após a compra.
- Pedido consultável apenas pelo dono (outro usuário recebe 404).

Perfil
- Leitura e edição de nome, e-mail e avatar.
- E-mail de outra conta retorna 409; avatar inválido retorna 422.
- Troca de senha: senha atual incorreta, senha nova curta ou igual à atual
  são recusadas; após trocar, a senha antiga deixa de funcionar.

Carteiras
- Listagem, cadastro e edição da carteira principal e da secundária.
- Papel já ocupado e endereço repetido retornam 409.
- Endereço inválido para a rede retorna 422.
- Carteira de outro usuário retorna 404.
- Cadastro de carteira Solana.

Persistência e reset
- Estado mantido após refresh (favoritos, carrinho e perfil).
- `window.mocks.reset()` restaura o cenário inicial.

Qualidade
- `npm run typecheck`, `npm run lint` e `npm run build` executados
  com sucesso.
- Build de produção servido por npm run preview com mocks ativos.

Limites da validação
- Verificações manuais, feitas por chamadas no Console do navegador.
  Não representam testes automatizados.
- Cenários de falha e latência (Issue 08) e idempotência de pedidos
  (Issue 09) não foram verificados.

  ### Idempotência

- Registros (usuário, chave, conteúdo, pedido) ficam em `idempotency`, no
  estado persistido do mock; `SCHEMA_VERSION` foi elevado para 3.
- O conteúdo comparado é cotação, carteira, rede e dados do colecionador.
- A repetição é resolvida antes das validações de cotação e estoque, porque o
  carrinho e o estoque já mudaram após o primeiro envio.
- Pedidos confirmados e recusados são registrados; ambos são terminais.
- A chave é gerada pelo cliente (Issue 18) e reutilizada em reenvios.

### Verificações manuais da Issue 09

Idempotência
- Pedido sem `Idempotency-Key` retorna 422.
- Chave nova cria o pedido e retorna 201.
- Repetição com a mesma chave e o mesmo conteúdo retorna 200 com o mesmo
  identificador de pedido.
- (*) A repetição indica `Idempotent-Replayed: true` e não baixa o estoque
  de novo.
- (*) Duas chamadas com a mesma chave resultam em um único pedido gravado.
- A mesma chave com conteúdo diferente retorna 409
  `IDEMPOTENCY_CONFLICT`.

Recuperação
- Com o cenário `order-timeout`, a primeira tentativa termina em erro de
  rede e a repetição com a mesma chave recupera o pedido original (200).
- O pedido recuperado pode ser consultado em `GET /api/orders/:id`.
- Com `payment-refused`, a repetição devolve o mesmo pedido recusado.

Qualidade
- `npm run typecheck`, `npm run lint` e `npm run build` executados com
  sucesso.

Limites da validação
- Verificações manuais, feitas por chamadas no Console do navegador.
- O isolamento da chave por usuário está no desenho do handler e não foi
  exercitado com um segundo usuário.
- O bloqueio de clique duplo e a geração da chave no cliente pertencem à
  Issue 18.

  ## Cenários dos mocks

- `src/mocks/scenario.ts` define a lista de cenários, a escolha ativa e o
  estado de execução (contadores e perturbações aplicadas uma única vez).
- `src/mocks/handlers/scenario.ts` é um handler de `/api/*` colocado antes dos
  demais. Ele aplica atraso, falhas e erros, ou não devolve nada, e então o MSW
  segue para o handler do recurso.
- Atrasos são derivados do método e do endereço, sem aleatoriedade.
- `price-changed`, `sold-out` e `order-timeout` atuam uma única vez por
  ativação do cenário, para o fluxo de recuperação ser exercitável.
- O pedido valida também o preço da cotação contra o catálogo atual.
- `order-timeout` usa erro de rede no lugar de um timeout do cliente; o cliente
  Axios ainda não tem timeout configurado (Issue 18).
- Idempotência de pedidos continua na Issue 09.

### Verificações manuais da Issue 08

Mecanismo de cenários
- Lista de cenários disponível em `window.mocks.scenarios`.
- Troca de cenário em tempo de execução com `window.mocks.setScenario`.
- Cenário padrão `success`.
- `window.mocks.reset()` restaura o banco e o cenário padrão.
- Cada cenário repetido produz o mesmo resultado.

Catálogo e rede
- `empty`: listagem vazia, com detalhe de NFT ainda disponível.
- `latency`: atraso entre 300 e 2300 ms, igual para a mesma chamada.
- `out-of-order`: consultas de listagem terminam fora da ordem em que
  foram enviadas.
- `network-error`: falha sem resposta HTTP nos recursos de negócio.
- `http-4xx`: resposta 403 nos recursos de negócio.
- `http-5xx`: resposta 503 nos recursos de negócio.

Conta e formulários
- `session-expired`: chamadas autenticadas respondem 401 `SESSION_EXPIRED`.
- `register-conflict`: cadastro responde 409.
- `validation-error`: cadastro, perfil, senha e carteiras respondem 422 com
  `fieldErrors`.

Cotação e pedido
- `coupon-invalid`: cupom enviado responde 400 `INVALID_COUPON`;
  cotação sem cupom segue normal.
- `coupon-expired`: cupom enviado responde 400 `EXPIRED_COUPON`.
- `price-changed`: primeiro pedido responde 409; nova cotação com o novo
  preço é aceita.
- `sold-out`: primeiro pedido responde 409 `OUT_OF_STOCK`.
- `payment-refused`: pedido gravado como `rejected`, sem baixa de estoque
  e com o carrinho preservado.
- `payment-confirmed`: pedido confirmado.
- `order-timeout`: pedido criado, resposta perdida com erro de rede, carrinho
  esvaziado e estoque baixado.

Qualidade
- `npm run typecheck`, `npm run lint` e `npm run build` executados com
  sucesso.

Limites da validação
- Verificações manuais, feitas por chamadas no Console do navegador.
- O navegador desativa o Service Worker do MSW quando fica ocioso; nesse
  caso é preciso recarregar a página.
- Não há cenário genérico de lentidão constante nem de timeout de
  requisição; o timeout do cliente Axios será tratado com a Issue 18.
- Recuperação do pedido por idempotência depende da Issue 09.

## Tela Início

- A tela lê os parâmetros com `useSearch` e atualiza a URL com `navigate`;
  mudar qualquer filtro, busca ou ordenação reinicia a página.
- Respostas fora de ordem: cada consulta é identificada por sua chave, e
  `placeholderData: keepPreviousData` mantém a lista anterior durante a troca.
- `GET /nfts/facets` fornece contagens por categoria, coleção e rede e a faixa
  de preço (extensão do contrato); `featured=true` filtra os destaques.
- Desvios do Figma: a lista "Coleções" usa o filtro de categorias; a faixa de
  preço usa dois campos numéricos no lugar do seletor de duas alças; o campo
  de busca fica acima da grade; no mobile, os filtros abrem em painel de tela
  cheia; o texto de apoio do hero é aproximado.
- Estados: esqueleto com as dimensões do card, vazio, erro com nova tentativa
  e página fora do intervalo.

## Detalhe do NFT

### Consulta e cache

- `useNftDetail` consulta `GET /nfts/:nftId`.
- As query keys incluem usuário e identificador do NFT.
- O Axios recebe o AbortSignal do TanStack Query.
- Respostas 404 não são repetidas automaticamente.

### Seleção e disponibilidade

- A edição inicial é a primeira disponível.
- O limite de quantidade é o menor entre
  `availableQuantity` e `maxPerOrder`.
- Edições esgotadas não permitem quantidade.
- A mudança de edição reinicia a quantidade para 1.

### Estados da interface

- Skeleton durante carregamento.
- Estado específico para NFT inexistente.
- Erro com opção de nova tentativa para falhas da API.
- Seleção de imagens preparada para múltiplos assets.

### Pendências

- Integrar favoritos com autenticação e mutations.
- Integrar adição ao carrinho para visitante e usuário.
- Conferir composição visual com os frames do Figma.

### Favoritos e mutations

- `useFavorites` consulta `GET /favorites`.
- A query key inclui o identificador do usuário.
- `useToggleFavorite` executa POST ou DELETE.
- O cache é atualizado com a resposta da mutation.
- Visitantes não consultam favoritos; são direcionados
  ao login com a rota original no parâmetro `redirect`.
- A atualização otimista com rollback será tratada
  na Issue 15.

### Carrinho

- `useAddCartItem` envia `POST /cart/items`.
- O payload contém `nftId`, `editionId` e `quantity`.
- A API valida disponibilidade e limite por pedido.
- O visitante recebe um UUID persistido no localStorage,
  enviado em `X-Guest-Cart-Id`.
- A sessão autenticada utiliza o token do cliente Axios.
- O cache do carrinho é isolado por usuário ou visitante.
- A navegação para o carrinho só ocorre após sucesso.
- A mesclagem visitante/autenticado fica para a Issue 16.

### Limitações e continuidade

- A galeria depende das imagens disponíveis no catálogo.
- O Figma ainda requer conferência visual fina da página.
- A interface do carrinho será concluída na Issue 16.
- O suporte a eventos de tempo real pertence às Issues 10 e 11.

## Carrinho

### Camada de dados

- `useCart` consulta GET /cart.
- `useAddCartItem` adiciona NFTs ao carrinho.
- `useUpdateCartItem` altera a quantidade.
- `useRemoveCartItem` exclui itens.
- As mutations atualizam o cache do TanStack Query
  com a resposta devolvida pelo servidor.
- As query keys são separadas por usuário ou
  identificador do visitante.

### Apresentação

- `CartPage` lê os itens da API de carrinho.
- Os dados dos NFTs são consultados separadamente
  em GET /nfts/:nftId, compartilhando o cache do detalhe.
- A tela exibe edições, preços unitários, quantidades,
  indisponibilidade, carregamento e erros.
- As quantidades respeitam availableQuantity e
  maxPerOrder.
- O MSW revalida todas as alterações enviadas.

### Precisão financeira

- ETH permanece representado como string decimal.
- A UI não calcula totais com Number.
- O resumo financeiro foi implementado,
  utilizando a resposta de POST /api/quotes.

### Mesclagem visitante e usuário

- A consulta `useCart` identifica carrinho visitante pendente.
- Antes do GET autenticado, executa POST /cart/merge.
- A API concentra as regras de soma, disponibilidade e limites.
- A chave do visitante só é removida após resposta bem-sucedida.
- Falha de rede mantém a chave para nova tentativa.
- Respostas de mesclagem não são aplicadas se a sessão mudou.
- As query keys identificam o proprietário do carrinho.
- A troca de sessão limpa o cache privado existente.

### Contador

- `useCartCount` reutiliza `useCart`.
- O número representa a soma de `quantity`.
- O cache é compartilhado entre página, cabeçalho
  desktop e navegação mobile.
- As mutations atualizam o cache com a resposta da API.
- O contador fica acessível por texto nos links de navegação.

### Dependência pendente

- A reconciliação de preço e estoque por Socket.IO
  depende da Issue 11.
- A Issue 16 permanece aberta até essa integração.

## Cotação e cupons

### Contrato

POST /api/quotes

Entrada:
- network: ethereum | polygon | solana
- couponCode: opcional

Resposta:
- id
- cartId
- cartVersion
- network
- items
- couponCode
- subtotalEth
- discountEth
- networkFeeEth
- totalEth
- expiresAt

### Cache e estado assíncrono

- `useQuote` utiliza TanStack Query.
- A query key contém proprietário, carrinho,
  versão, rede e cupom.
- Alterações de quantidade mudam cartVersion
  e provocam nova cotação.
- Alterações de rede também geram nova consulta.
- `useQuoteAction` aplica/remove cupons por mutation.
- Cupons recusados não substituem a cotação válida.
- Falhas apresentam feedback e nova tentativa.
- Respostas ficam isoladas pelo proprietário do carrinho.
- O AbortSignal do Query é repassado ao Axios.

### Precisão monetária

- O contrato ETH utiliza strings decimais.
- O MSW converte valores para BigInt com escala
  fixa de 18 casas decimais.
- Descontos, taxas e total são calculados no mock.
- A interface não utiliza Number para somar ETH.
- Os valores exibidos correspondem à resposta REST.

### Limitações

- A cotação tem TTL de cinco minutos.
- O checkout deverá revalidar preço, cupom,
  estoque, taxa e versão antes da confirmação.
- Socket.IO e atualização de valores em tempo real
  pertencem às Issues 11 e 20.

## Checkout

### Roteamento

- `/checkout` exige sessão autenticada.
- `validateCheckoutSearch` valida rede e cupom na URL.
- A URL preserva as escolhas ao passar pelo login.

### Dados

- `useCart` recupera o carrinho autenticado.
- `useWallets` consulta GET /wallets.
- `useQuote` consulta POST /quotes com rede e cupom.
- Todas as informações financeiras são exibidas
  diretamente das strings decimais retornadas pela API.

### Validação

- Nome e e-mail são validados no formulário.
- Uma carteira deve ser selecionada.
- A carteira selecionada precisa pertencer à rede.
- A conexão da carteira é simulada localmente.

### Revalidação

- A revisão solicita uma nova cotação via API.
- Preço, itens, quantidade, desconto, taxa, total
  e versão são comparados com a cotação anterior.
- Alterações exigem nova revisão do usuário.
- Uma falha de cotação não cria pedido.
- POST /orders permanece desabilitado nesta etapa.

### Próximas etapas

- Tratamento de recusa e falhas.
- Recuperação após timeout ou refresh.
- Integração da confirmação com a Issue 19.

### Envio idempotente

- O frontend exige revalidação da cotação antes do envio.
- Alterações em campos, rede ou carteira invalidam
  a aprovação anterior.
- A confirmação gera uma chave UUID de idempotência.
- A chave e o corpo do pedido são persistidos antes
  do envio da requisição.
- POST /orders envia o cabeçalho Idempotency-Key.
- Pedidos confirmados atualizam o cache do carrinho.
- Pedidos rejeitados mantêm o carrinho.
- Erros de negócio encerram a tentativa inválida.
- Erros de rede e 5xx mantêm a tentativa pendente.
- A recuperação reutiliza a mesma chave e o mesmo corpo.
- Uma resposta pending não autoriza outra compra.
- A tentativa persistida é isolada por usuário.
- Não é apresentada confirmação antes da resposta
  efetivamente confirmada pela API.

### Recuperação após refresh

- `pending-order.ts` persiste tentativas por usuário.
- `PendingOrderRecovery` recupera tentativas após remontagem.
- A tentativa pendente tem precedência sobre carregamento,
  erro e estado vazio do carrinho.
- O primeiro acesso à recuperação inicia uma verificação.
- O evento `online` também dispara uma nova verificação.
- `inFlight` impede chamadas simultâneas.
- A recuperação reutiliza a Idempotency-Key original.
- O payload original também é reutilizado integralmente.
- O frontend não cria uma nova cotação durante o replay.
- Confirmações vêm da resposta efetiva da API.
- Pedidos rejeitados não são tratados como confirmados.
- Erros inconclusivos mantêm a tentativa persistida.
- Trocas de sessão não autorizam recuperar pedidos de
  outro usuário.
- O MSW garante idempotência, inclusive após a
  confirmação do pedido e remoção dos itens comprados.

## Pedidos e confirmação

### Consulta de pedidos

- `useOrder` consulta GET /orders/:orderId.
- A query key contém o ID do usuário e do pedido.
- O acesso à rota exige autenticação.
- O MSW consulta apenas pedidos pertencentes ao usuário.
- Pedidos inexistentes apresentam estado específico.
- Erros de rede permitem nova tentativa.

### Fluxo após o pagamento

- O checkout somente navega para confirmação quando
  POST /orders retorna um pedido com status confirmed.
- A recuperação da Issue 18 usa o mesmo redirecionamento.
- A URL de confirmação contém o ID persistido do pedido.
- A página obtém o pedido pela API após navegação ou F5.
- Pedidos rejeitados ou pendentes não apresentam recibo
  de compra confirmada.

### Snapshot do pedido

- O MSW grava `order.receipt` como cópia da cotação.
- A confirmação exibe os itens e valores de `order.receipt`.
- Mudanças posteriores no catálogo não modificam o recibo.
- O frontend não recalcula os valores financeiros.

### Atualização do carrinho

- O MSW valida cotação, estoque e versão do carrinho.
- Após confirmação, subtrai as quantidades compradas.
- Itens com quantidade resultante igual a zero são removidos.
- Itens não comprados são preservados.
- Em pagamento recusado, o carrinho não é alterado.
- A mutation invalida o cache do carrinho após confirmação.

### Limitações

- As transações blockchain são simuladas.
- A atualização em tempo real de pedidos pertence
  às Issues 11 e 20.

## Tempo real

### Transporte

- `src/lib/realtime-client.ts`: cliente Socket.IO real.
- `src/mocks/socket-io.ts`: transporte e handshake simulado.
- `src/mocks/start.ts`: operações de diagnóstico.
- `src/mocks/handlers/index.ts`: registro do WebSocket no MSW.

A conexão utiliza o transporte WebSocket e o
namespace padrão do Socket.IO.

### Eventos

nft.updated contém:
- eventId
- resourceId
- version
- occurredAt
- nft

O evento é emitido depois da mutação persistida
no banco simulado.

A consulta REST e o evento reutilizam os mesmos
dados de negócio.

### Responsabilidades

- O mock é responsável pela emissão.
- O socket.io-client é responsável pelo consumo.
- O frontend não utiliza setters de estado para simular
  o recebimento de eventos.
- A reconciliação com TanStack Query será feita na #11.

### Publicação e isolamento dos eventos

A emissão ocorre na camada de mocks, após a persistência
dos dados.

`nft.updated` é público e transporta o NFT atualizado,
identificador do evento, identificador do recurso, versão
e instante da alteração.

`order.updated` é privado. O mock valida a sessão
Socket.IO e verifica a titularidade do pedido antes
de enviar o evento.

O transporte utiliza Socket.IO sobre WebSocket,
com handshake Engine.IO simulado pelo MSW 3.

A implementação local suporta eventos textuais no
namespace padrão. Não implementa polling, mensagens
binárias ou funcionalidades completas de um servidor
Socket.IO de produção.

Na Issue 11, o cliente implementará:
- atualização do cache a partir dos eventos;
- descarte de eventos duplicados e antigos;
- reconciliação REST após reconexão;
- gerenciamento do ciclo de vida das conexões.