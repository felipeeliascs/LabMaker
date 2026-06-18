# Arquitetura do LabMaker

## Visão Geral

O LabMaker é uma aplicação web estática de tour 360°, construída com A-Frame. Não há backend, banco de dados ou autenticação. Todo o conteúdo é servido como arquivos estáticos no navegador.

## Stack

| Componente | Tecnologia |
|---|---|
| Renderização 3D / 360° | A-Frame (WebGL + three.js) |
| Estrutura da página | HTML5 |
| Estilização | CSS3 |
| Lógica da aplicação | JavaScript (ES6+) |
| Servidor de desenvolvimento | Servidor HTTP estático (ex: Python http.server, Live Server) |

## Estrutura de Arquivos

```
labmaker/
├── index.html              # Ponto de entrada — estrutura A-Frame e UI
├── styles/
│   └── main.css            # Estilos da interface (painel, hotspots, overlay)
├── src/
│   ├── scenes.js           # Dados das cenas (configuração declarativa)
│   ├── hotspots.js         # Criação e controle dos hotspots 3D
│   ├── ui.js               # Atualização dos painéis de interface
│   ├── steps.js            # Fluxo pedagógico sequencial
│   └── main.js             # Inicialização e orquestração dos módulos
├── assets/
│   ├── panoramas/          # Imagens 360° equirretangulares (7680×3840)
│   └── icons/              # Ícones para hotspots e interface
├── docs/                   # Documentação do projeto
└── tests/                  # (reservado para testes futuros)
```

## Diagrama de Módulos e Fluxo de Dados

```
main.js (inicialização)
    │
    ├── scenes.js ──────► dados das cenas (JSON-like)
    │
    ├── hotspots.js ────► cria elementos <a-entity> no A-Frame
    │                        │
    │                        └── gerencia clique/navegação
    │
    ├── ui.js ──────────► atualiza painel HTML overlay
    │                        │
    │                        └── nome da cena, descrição, recursos
    │
    └── steps.js ───────► controla progressão pedagógica
                             │
                             └── sequência recomendada de cenas
```

### Fluxo de execução

1. **`index.html`** carrega o A-Frame via CDN, define o `<a-scene>` e inclui os scripts.
2. **`main.js`** é executado no evento `DOMContentLoaded` ou no final do `<body>`.
3. **`main.js`** importa os dados de `scenes.js` e chama `hotspots.js` para criar os hotspots da cena inicial.
4. **`hotspots.js`** cria elementos `<a-entity>` com geometria (ex: esferas, anéis) posicionados no espaço 3D, com eventos de clique.
5. Ao clicar em um hotspot de navegação, **`hotspots.js`** altera o `<a-sky>` para a nova imagem e recria os hotspots da nova cena.
6. **`ui.js`** escuta as mudanças de cena e atualiza o overlay HTML (nome da cena, descrição, recursos disponíveis).
7. **`steps.js`** mantém o estado do fluxo pedagógico (qual cena visitar em seguida, progresso do estudante).

## Responsabilidades de Cada Módulo

### `index.html`
- Declaração HTML5
- Inclusão do A-Frame via `<script>` CDN
- Definição do `<a-scene>` com câmera padrão (`<a-camera>`)
- Elemento `<a-sky>` para renderizar o panorama (começa vazio, preenchido via JS)
- Overlay HTML para o painel pedagógico (info da cena, botões de recurso)
- Inclusão dos scripts JS na ordem correta

### `src/scenes.js`
- Array de objetos com configuração de cada cena
- Estrutura esperada de cada cena:
  ```javascript
  {
    id: 'hub-central',
    nome: 'Hub Central',
    arquivo: 'assets/panoramas/02-hub-central.png',
    descricao: 'Espaço central que conecta todas as áreas...',
    hotspots: [
      { tipo: 'navegacao', rotulo: 'Programação e Robótica', destino: 'programacao-robotica', posicao: { x, y, z } },
      { tipo: 'recurso', rotulo: 'Mapa Interativo', conteudo: 'Texto explicativo...', posicao: { x, y, z } }
    ]
  }
  ```

### `src/hotspots.js`
- Função `criarHotspots(cena)` — cria entidades 3D no A-Frame para cada hotspot
- Função `limparHotspots()` — remove hotspots ao mudar de cena
- Função `navegarPara(destinoId)` — troca a imagem do `<a-sky>` e recria hotspots
- Hotspots de navegação: esferas ou anéis visíveis, com tooltip flutuante
- Hotspots de recurso: ícones diferentes, abrem conteúdo no painel

### `src/ui.js`
- Função `atualizarPainel(cena)` — atualiza nome, descrição e recursos no overlay
- Função `mostrarRecurso(conteudo)` — exibe conteúdo (texto, imagem, placeholder de vídeo)
- Função `fecharRecurso()` — fecha o conteúdo aberto
- Atualiza indicador de progresso (qual cena está sendo visitada)

### `src/steps.js`
- Array com a sequência pedagógica recomendada (ordem das cenas)
- Função `proximaCena()` — retorna o ID da próxima cena na sequência
- Função `cenaAtual()` — retorna o índice atual na sequência
- Função `resetarProgresso()` — reinicia o fluxo
- (Opcional) Exibe dica/sugestão de próximo passo no painel

### `src/main.js`
- Função `iniciarTour()` — ponto de entrada principal
- Carrega cena inicial a partir de `scenes.js`
- Chama `hotspots.criarHotspots()`, `ui.atualizarPainel()`, `steps.iniciar()`
- Expõe funções globais mínimas para interação com o A-Frame (se necessário)

### `styles/main.css`
- Estilos do overlay HTML (painel de informações, botões)
- Posicionamento (geralmente fixed/absolute sobre o A-Frame)
- Responsividade para desktop e celular
- Tema visual (cores, fontes) consistente com a identidade do LabMaker

## Considerações Técnicas

- Compatibilidade com desktop e celular via A-Frame (já gerencia magia e touch)
- Hotspots devem ser clicáveis tanto em desktop (clique) quanto em celular (toque)
- A-Frame gerencia o gyroscope em dispositivos móveis automaticamente
- O tour deve funcionar localmente com qualquer servidor HTTP estático (ex: `npx serve`, `python -m http.server`, Live Server do VS Code)
- Sem dependências além do A-Frame (carregado via CDN)