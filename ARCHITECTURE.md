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