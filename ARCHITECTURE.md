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