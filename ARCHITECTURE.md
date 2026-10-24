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

### Proteção provisória

- Rotas privadas usam beforeLoad.
- Visitantes são direcionados ao login com o destino original
  no parâmetro redirect.
- O destino de retorno é validado para permanecer na mesma origem.
- A sessão de teste usa sessionStorage e só é aceita em desenvolvimento.
- O controle de simulação não está disponível no build de produção.
- A simulação não configura token nem autentica chamadas HTTP.
- A autenticação real substituirá a simulação na Issue 12.
- Guards de navegação não substituem autorização na API.
- A confirmação ainda não valida existência, propriedade ou estado
  do pedido; essa integração pertence ao fluxo de pedidos.

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

- Cenários de falha e latência: Issue 08.
- Idempotência de pedidos (`Idempotency-Key`): Issue 09. Hoje o cabeçalho
  é ignorado e o pedido sempre sai confirmado.
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