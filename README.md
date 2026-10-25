# Marketplace de NFTs — Frontend Challenge

## API simulada (MSW)

A aplicação roda contra uma API simulada com Mock Service Worker. Nenhuma
resposta fictícia vive em componentes, hooks ou no cliente Axios; tudo passa
pelos handlers em `src/mocks/`.

### Ativar

1. Copie `.env.example` para `.env`.
2. Garanta `VITE_ENABLE_MOCKS=true` e `VITE_API_BASE_URL=/api`.
3. `npm install` e `npm run dev`.

O arquivo `public/mockServiceWorker.js` é versionado e vai para o build.
No deploy, defina `VITE_ENABLE_MOCKS=true` nas variáveis de ambiente
da hospedagem para o build de demonstração usar os mocks.

### Credenciais fictícias

| Usuário | E-mail | Senha |
| --- | --- | --- |
| Ana Souza | ana@example.com | Senha123! |
| Bruno Lima | bruno@example.com | Senha456! |

### Cupons e taxas

| Cupom | Efeito |
| --- | --- |
| BEMVINDO10 | 10% de desconto |
| ARTE25 | 25% de desconto |
| VERAO5 | expirado (erro 400) |

Taxa de rede fixa, em ETH: ethereum 0.002, polygon 0.0005, solana 0.0001.

### Estado e reset

O estado simulado fica no `localStorage` (chave
`frontend-challenge:mock-db`) e sobrevive ao refresh. Para voltar ao cenário
inicial, execute no console do navegador:

    await window.mocks.reset()

### Problemas comuns

- Chamadas a `/api` voltando como HTML: o Service Worker saiu do controle da
  página. Em DevTools > Application > Storage, use "Clear site data" e
  recarregue com F5 (sem Shift). Confira também se "Bypass for network" está
  desmarcado em Service Workers.
- Requer Node.js 22 ou superior (MSW 3).

### Cenários

O cenário ativo vem, nesta ordem, de: escolha em tempo de execução
(`window.mocks.setScenario('nome')`, gravada no `localStorage`), da variável
`VITE_MOCK_SCENARIO` ou do padrão `success`. `window.mocks.reset()` apaga a
escolha em tempo de execução e restaura o estado inicial.

    window.mocks.scenarios          // lista os cenários
    window.mocks.setScenario('empty')
    window.mocks.scenario()         // cenário ativo

| Cenário | Comportamento |
| --- | --- |
| success | Padrão. |
| empty | Catálogo sem resultados. |
| latency | Atraso de 300 a 2300 ms, fixo para a mesma chamada. |
| out-of-order | Listagens de NFTs respondem em 1500, 200 e 800 ms em ciclo. |
| network-error | Recursos de negócio falham sem resposta HTTP. |
| http-4xx | Recursos de negócio devolvem 403. |
| http-5xx | Recursos de negócio devolvem 503. |
| session-expired | Chamadas autenticadas devolvem 401 SESSION_EXPIRED. |
| register-conflict | Cadastro devolve 409. |
| validation-error | Cadastro, perfil, senha, carteiras e pedido devolvem 422. |
| coupon-invalid | Cupom enviado devolve 400 INVALID_COUPON. |
| coupon-expired | Cupom enviado devolve 400 EXPIRED_COUPON. |
| price-changed | Primeiro pedido falha com 409 (preço sobe 10%); nova cotação passa. |
| sold-out | Primeiro pedido falha com 409 OUT_OF_STOCK. |
| order-timeout | Pedido criado; resposta perdida após 3 s (erro de rede). Uma vez. |
| payment-refused | Pedido gravado como rejected, sem baixar estoque. |
| payment-confirmed | Igual a success. |

Cada cenário é determinístico: a mesma configuração produz o mesmo resultado.

### Idempotência de pedidos

`POST /api/orders` exige o cabeçalho `Idempotency-Key` (até 128 caracteres).
A chave é isolada por usuário.

| Situação | Resultado |
| --- | --- |
| Chave nova | 201 e pedido criado |
| Mesma chave e mesmo conteúdo | 200, mesmo pedido (`Idempotent-Replayed: true`) |
| Mesma chave e conteúdo diferente | 409 `IDEMPOTENCY_CONFLICT` |
| Sem a chave | 422 |

Para reproduzir a recuperação após timeout, ative o cenário `order-timeout`,
envie um pedido e, depois do erro de rede, repita a mesma chave.

## Detalhe do NFT

A rota `/nfts/:nftId` consulta `GET /api/nfts/:nftId`
usando Axios e TanStack Query.

A tela apresenta imagem, informações, características,
edições disponíveis, preço e controle de quantidade.

### Funcionalidades

- A quantidade respeita o estoque e `maxPerOrder`.
- Edições esgotadas não permitem compra.
- NFTs inexistentes apresentam estado de não encontrado.
- Falhas de consulta apresentam opção de nova tentativa.
- O carregamento utiliza skeletons com shimmer.

### Favoritos e mutations

- `useFavorites` consulta `GET /favorites` com query key
  isolada pelo identificador do usuário.
- `useToggleFavorite` executa POST ou DELETE pelo Axios.
- `onMutate` cancela consultas pendentes e guarda o estado
  anterior antes de modificar o cache.
- O cache é atualizado imediatamente de maneira otimista.
- `onError` restaura o snapshot anterior se a mutation falhar.
- `onSuccess` atualiza o cache com a resposta da API e
  invalida a consulta para reconciliar o estado.
- A interface impede cliques simultâneos durante a mutation.
- As mensagens de processamento e erro usam feedback acessível.
- Respostas de sessões antigas não alteram o cache
  de favoritos da sessão atual.
- Visitantes são direcionados ao login, preservando a rota
  do NFT no parâmetro `redirect`.

#### Limitações

- O botão de favoritos está disponível no detalhe do NFT.
- A página dedicada de favoritos não faz parte do desafio.
- O armazenamento persistente continua sendo responsabilidade
  dos handlers do MSW.
- O cenário `http-5xx` permite reproduzir e verificar rollback.

### Adicionar ao carrinho

- A adição utiliza `POST /api/cart/items`.
- Visitantes são identificados pelo cabeçalho
  `X-Guest-Cart-Id`, persistido no localStorage.
- Usuários autenticados utilizam seu token de sessão.
- O redirecionamento para `/cart` acontece somente
  após resposta de sucesso da API.
- Os limites de estoque e quantidade são validados
  novamente pelo servidor simulado.

### Atualização otimista

As alterações de favoritos são refletidas imediatamente
na interface, antes da confirmação da API simulada.

- `onMutate` atualiza o cache do TanStack Query.
- `cancelQueries` evita que consultas pendentes sobrescrevam
  a atualização otimista.
- `onError` restaura o estado anterior (rollback).
- `onSuccess` sincroniza o cache com a resposta do MSW.
- Falhas são informadas ao usuário com feedback acessível.
- Favoritos permanecem isolados por usuário autenticado.
- As mutations não devem restaurar dados de sessões antigas.

Para testar o rollback, abra um NFT autenticado, carregue
os favoritos, ative `window.mocks.setScenario('http-5xx')`
e tente favoritar ou desfavoritar.

O botão deve voltar ao estado anterior após a falha.

## Carrinho

A rota `/cart` consulta a API simulada usando Axios
e TanStack Query.

### Funcionalidades

- Listagem dos NFTs adicionados.
- Consulta dos detalhes do NFT por identificador.
- Exibição da edição e do preço unitário em ETH.
- Alteração da quantidade via PATCH /api/cart/items/:itemId.
- Remoção via DELETE /api/cart/items/:itemId.
- Respeito ao estoque e ao limite por edição.
- Persistência após refresh por meio do MSW.
- Estado vazio, skeleton de carregamento e erros da API.

O carrinho do visitante usa `X-Guest-Cart-Id`, mantido
no localStorage. Usuários autenticados utilizam o token
de sessão.

### Mesclagem após autenticação

O carrinho visitante utiliza o identificador persistido
em `frontend-challenge:guest-cart-id`.

Após login ou cadastro, a consulta autenticada do carrinho
verifica se existe um identificador visitante pendente.

Se existir, envia `POST /api/cart/merge` antes de consultar
o carrinho do usuário.

- A mesclagem é realizada no handler do MSW.
- O identificador visitante só é removido após sucesso.
- Falhas preservam o identificador para nova tentativa.
- Repetir a consulta não deve duplicar os itens mesclados.
- O cache é isolado entre visitantes e usuários autenticados.
- O contador exibe a soma das quantidades dos itens.
- Desktop e mobile compartilham o cache do TanStack Query.

### Limitações

- A sincronização do carrinho por eventos Socket.IO
  depende da Issue 11.
- Cupom, subtotal, descontos, taxas e total pertencem
  à Issue 17.
- Pagamento e confirmação pertencem às Issues 18 e 19.

## Cupom e resumo financeiro

O carrinho utiliza `POST /api/quotes` para obter
subtotal, desconto, taxa de rede e total.

### Funcionalidades

- Cotação para Ethereum, Polygon e Solana.
- Aplicação de cupons válidos.
- Remoção de cupom.
- Tratamento de cupom inválido ou expirado.
- Nova cotação após alteração do carrinho ou da rede.
- Skeletons com shimmer durante carregamento.
- Erro com possibilidade de nova tentativa.

### Cupons de demonstração

- BEMVINDO10: desconto de 10%.
- ARTE25: desconto de 25%.
- VERAO5: cupom expirado.
- Qualquer outro código: cupom inválido.

### Precisão

Os valores ETH são transportados como strings decimais.
O MSW utiliza BigInt com escala fixa de 18 casas
decimais para calcular valores sem ponto flutuante.

O frontend exibe os resultados da API sem realizar
cálculos financeiros com Number.

### Limitações

- As cotações expiram após cinco minutos.
- O checkout deverá revalidar a cotação antes do pedido.
- Atualizações de valores por Socket.IO pertencem
  às Issues 11 e 20.

## Checkout e pagamento

A rota `/checkout` é protegida por autenticação.

### Implementado

- Navegação pelo carrinho preservando rede e cupom na URL.
- Redirecionamento do visitante para login.
- Recuperação do carrinho após autenticação.
- Formulário com nome e e-mail do colecionador.
- Validação dos campos antes da revisão.
- Listagem das carteiras cadastradas via GET /api/wallets.
- Seleção de rede e carteira compatível.
- Simulação local de conexão e desconexão da carteira.
- Revisão dos itens e valores da cotação.
- Revalidação por POST /api/quotes.
- Aviso quando os valores da cotação mudarem.
- Estados de carregamento, vazio e erro.

### Limitações desta etapa

A conexão de carteira é simulada na interface.
Não existe integração com carteira blockchain real.

A Etapa 3 implementará recuperação após timeout,
refresh ou reconexão.

A tela de recibo pertence à Issue 19.

### Envio de pedidos

O checkout envia POST /api/orders somente após
validação dos campos, seleção de uma carteira compatível
e revalidação da cotação.

Cada nova tentativa recebe uma Idempotency-Key única.

- Cliques repetidos são bloqueados no cliente.
- O pedido é confirmado somente com status confirmed.
- Status rejected apresenta o motivo da recusa.
- Pagamento recusado não esvazia o carrinho.
- Mudanças de preço, estoque ou cotação exigem revisão.
- Falhas de rede não são tratadas como recusa.
- Uma tentativa de resultado desconhecido mantém
  a mesma chave e o mesmo corpo para recuperação.
- O resultado pode ser verificado sem criar outra compra.

### Cenários

- payment-confirmed: pagamento aprovado.
- payment-refused: pedido rejeitado, sem baixar estoque.
- price-changed: preço alterado, exige nova cotação.
- sold-out: estoque insuficiente, compra impedida.
- order-timeout: resposta perdida após o pedido ser gravado.

### Recuperação de pagamentos

O checkout mantém uma tentativa pendente por usuário em
localStorage.

Cada registro contém:

- Idempotency-Key original.
- Corpo exato da requisição de criação do pedido.
- Data de criação da tentativa.

Após refresh, o checkout verifica se existe uma tentativa
pendente antes de apresentar o estado de carrinho vazio.

Quando encontra uma tentativa:

- Exibe o estado de verificação do pagamento.
- Reenvia a requisição original automaticamente.
- Não gera outra chave de idempotência.
- Não cria uma nova cotação para recuperar o pedido.
- Oferece verificação manual em caso de falha.
- Repete a verificação quando a conexão do navegador volta.

Resultados:

- Confirmed: exibe sucesso e remove a tentativa pendente.
- Rejected: exibe recusa e permite revisar outra compra.
- Pending: mantém a tentativa sem iniciar outra compra.
- Falha de rede ou 5xx: mantém a tentativa para recuperação.
- Falha conclusiva de negócio: encerra a tentativa inválida.

O carrinho pode já estar vazio após um timeout caso o MSW
tenha confirmado o pedido antes de perder a resposta.

O mecanismo de idempotência impede a criação de pedidos
duplicados quando a mesma chave e o mesmo corpo são reenviados.

## Confirmação e recibo

A rota `/orders/:orderId/confirmation` apresenta o
resultado de um pedido persistido na API simulada.

### Funcionalidades

- Consulta autenticada via GET /api/orders/:orderId.
- Navegação após pagamento confirmado.
- Navegação após recuperação de pagamento com timeout.
- Recibo disponível novamente após refresh.
- Estado de carregamento com skeleton.
- Erro de consulta com nova tentativa.
- Estado específico para pedido inexistente.
- Pedidos recusados ou pendentes não exibem sucesso.
- Isolamento de pedidos por usuário autenticado.
- Layout responsivo para desktop e mobile.

### Recibo

O recibo apresenta:

- Identificador do pedido.
- Data e status.
- Referência da transação.
- Rede e carteira utilizada.
- Dados do colecionador.
- NFTs, edições e quantidades compradas.
- Preços unitários e totais dos itens.
- Subtotal, desconto, taxa de rede e total.
- Cupom aplicado, quando existir.

### Snapshot financeiro

Todos os valores financeiros são exibidos diretamente
de `order.receipt`, gravado no momento da compra.

A página não reconstrói o recibo consultando os preços
atuais do catálogo.

Os valores ETH permanecem representados como strings
decimais, sem cálculos com Number no frontend.

### Carrinho

Após uma confirmação, o MSW desconta somente as
quantidades presentes na cotação comprada.

Pagamentos recusados não removem itens.

A versão do carrinho é validada antes do pedido,
evitando executar cotações antigas sobre um carrinho
modificado.

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

You can also install [eslint-plugin-react-x](https://npmx.dev/package/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://npmx.dev/package/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```
