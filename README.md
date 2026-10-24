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
