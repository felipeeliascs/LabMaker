# Mapa de Cenas — LabMaker

## Visão Geral

O tour 360 do LabMaker é composto por 6 cenas interligadas. Cada cena representa um ambiente educacional imersivo com hotspots de navegação (para outras cenas) e hotspots de recurso (conteúdo pedagógico).

Todas as imagens panorâmicas estão em `assets/panoramas/`, no formato PNG 360° equirretangular (7680×3840), geradas via Hunyuan 3D Scene da Tencent.

---

## Cena 01 — Antesala / Recepção

| Campo | Valor |
|---|---|
| **ID** | `antesala-recepcao` |
| **Nome** | Antesala / Recepção |
| **Arquivo** | `assets/panoramas/01-antesala-recepcao.png` |
| **Ordem** | 1 (cena inicial do tour) |

### Descrição do ambiente

Ambiente de recepção do LabMaker. O estudante é recebido com uma vista panorâmica do laboratório maker. É o ponto de partida do tour.

### Hotspots de navegação planejados

| Rótulo | Cena de destino |
|---|---|
| Entrar no Hub Central | Hub Central |

### Hotspots de recurso planejados

| Tipo | Conteúdo |
|---|---|
| Texto | Boas-vindas ao LabMaker — descrição do que é o tour |
| Vídeo | (placeholder) Vídeo de apresentação do laboratório |

### Objetivo pedagógico

Ambientar o estudante no espaço do LabMaker e apresentar a proposta do tour 360.

---

## Cena 02 — Hub Central

| Campo | Valor |
|---|---|
| **ID** | `hub-central` |
| **Nome** | Hub Central |
| **Arquivo** | `assets/panoramas/02-hub-central.png` |
| **Ordem** | 2 |

### Descrição do ambiente

Espaço central que conecta todas as áreas temáticas do LabMaker. Funciona como um ponto de distribuição para as demais cenas.

### Hotspots de navegação planejados

| Rótulo | Cena de destino |
|---|---|
| Programação e Robótica | Programação e Robótica |
| Eletrônica e Prototipagem | Eletrônica e Prototipagem |
| Fabricação Digital | Fabricação Digital |
| Arena de Batalha de Robôs | Arena de Batalha de Robôs |
| Voltar à Recepção | Antesala / Recepção |

### Hotspots de recurso planejados

| Tipo | Conteúdo |
|---|---|
| Texto | Mapa interativo — descrição de cada área temática |

### Objetivo pedagógico

Apresentar ao estudante as diferentes áreas do LabMaker, funcionando como um menu visual e navegável.

---

## Cena 03 — Programação e Robótica

| Campo | Valor |
|---|---|
| **ID** | `programacao-robotica` |
| **Nome** | Programação e Robótica |
| **Arquivo** | `assets/panoramas/03-programacao-robotica.png` |
| **Ordem** | 3 |

### Descrição do ambiente

Estação de trabalho com computadores, robôs educacionais e kits de programação visual (tipo Arduino, Micro:bit, Lego Mindstorms).

### Hotspots de navegação planejados

| Rótulo | Cena de destino |
|---|---|
| Voltar ao Hub Central | Hub Central |

### Hotspots de recurso planejados

| Tipo | Conteúdo |
|---|---|
| Texto | Explicação sobre programação visual e robótica educacional |
| Imagem | Exemplo de código em blocos (placeholder) |

### Objetivo pedagógico

Introduzir conceitos de programação visual e robótica, mostrando ferramentas e possibilidades.

---

## Cena 04 — Eletrônica e Prototipagem

| Campo | Valor |
|---|---|
| **ID** | `eletronica-prototipagem` |
| **Nome** | Eletrônica e Prototipagem |
| **Arquivo** | `assets/panoramas/04-eletronica-prototipagem.png` |
| **Ordem** | 4 |

### Descrição do ambiente

Bancada com componentes eletrônicos, protoboard, sensores, atuadores, multímetros e ferramentas de prototipagem.

### Hotspots de navegação planejados

| Rótulo | Cena de destino |
|---|---|
| Voltar ao Hub Central | Hub Central |

### Hotspots de recurso planejados

| Tipo | Conteúdo |
|---|---|
| Texto | Conceitos básicos de eletrônica (tensão, corrente, resistência) |
| Imagem | Diagrama de circuito simples (placeholder) |

### Objetivo pedagógico

Apresentar os fundamentos da eletrônica e prototipagem, incentivando a experimentação prática.

---

## Cena 05 — Fabricação Digital

| Campo | Valor |
|---|---|
| **ID** | `fabricacao-digital` |
| **Nome** | Fabricação Digital |
| **Arquivo** | `assets/panoramas/05-fabricacao-digital.png` |
| **Ordem** | 5 |

### Descrição do ambiente

Espaço com impressoras 3D, cortadora a laser, fresadora CNC e materiais para fabricação digital.

### Hotspots de navegação planejados

| Rótulo | Cena de destino |
|---|---|
| Voltar ao Hub Central | Hub Central |

### Hotspots de recurso planejados

| Tipo | Conteúdo |
|---|---|
| Texto | Explicação sobre modelagem 3D e fabricação digital |
| Imagem | Exemplo de peça impressa em 3D (placeholder) |

### Objetivo pedagógico

Demonstrar o ciclo de fabricação digital: do modelo virtual ao objeto físico.

---

## Cena 06 — Arena de Batalha de Robôs

| Campo | Valor |
|---|---|
| **ID** | `arena-batalha-robos` |
| **Nome** | Arena de Batalha de Robôs |
| **Arquivo** | `assets/panoramas/06-arena-batalha-robos.png` |
| **Ordem** | 6 |

### Descrição do ambiente

Arena com robôs controlados por programação visual, prontos para competições de sumô e desafios.

### Hotspots de navegação planejados

| Rótulo | Cena de destino |
|---|---|
| Voltar ao Hub Central | Hub Central |

### Hotspots de recurso planejados

| Tipo | Conteúdo |
|---|---|
| Texto | Regras da competição e dicas de estratégia |
| Vídeo | (placeholder) Demonstração de batalha de robôs |

### Objetivo pedagógico

Motivar o estudante através da competição saudável, aplicando conceitos de programação e robótica em um desafio prático.

---

## Observações

- Todas as cenas devem ter um hotspot de navegação de volta ao Hub Central.
- A cena inicial (Antesala/Recepção) é carregada automaticamente ao iniciar o tour.
- Os placeholders de recurso (vídeo, imagem) serão substituídos por conteúdo real em fases posteriores.