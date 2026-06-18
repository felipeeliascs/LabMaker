# LabMaker — Tour 360° Educacional

**LabMaker** é um protótipo de ambiente educacional imersivo em 360 graus para práticas de robótica maker, programação visual, robótica virtual e educação STEAM na educação básica.

Este projeto é um protótipo educacional de mestrado, com foco em viabilidade, usabilidade, engajamento, percepção pedagógica e refinamento.

## Stack

| Componente | Tecnologia |
|---|---|
| Renderização 360° | [A-Frame](https://aframe.io/) (WebGL + three.js) |
| Estrutura | HTML5 |
| Estilização | CSS3 |
| Lógica | JavaScript (ES6+) |
| Backend | Nenhum (projeto 100% estático) |

## Cenas do Tour

| # | Cena | Arquivo |
|---|---|---|
| 1 | Antesala / Recepção | `01-antesala-recepcao.png` |
| 2 | Hub Central | `02-hub-central.png` |
| 3 | Programação e Robótica | `03-programacao-robotica.png` |
| 4 | Eletrônica e Prototipagem | `04-eletronica-prototipagem.png` |
| 5 | Fabricação Digital | `05-fabricacao-digital.png` |
| 6 | Arena de Batalha de Robôs | `06-arena-batalha-robos.png` |

## Como Executar Localmente

Como o projeto é 100% estático, qualquer servidor HTTP simples funciona:

```bash
# Opção 1: Python
python -m http.server 8000

# Opção 2: Node.js (com npx)
npx serve .

# Opção 3: VS Code — extensão Live Server
# Clique com botão direito no index.html > Open with Live Server
```

Depois de iniciar o servidor, abra o navegador em `http://localhost:8000`.

> **Atenção:** O A-Frame requer um servidor HTTP para carregar as imagens corretamente. Abrir o `index.html` diretamente pelo sistema de arquivos (`file://`) pode não funcionar.

## Estrutura de Diretórios

```
labmaker/
├── index.html              # Ponto de entrada do tour
├── styles/
│   └── main.css            # Estilos da interface
├── src/
│   ├── scenes.js           # Dados das cenas
│   ├── hotspots.js         # Hotspots de navegação e recurso
│   ├── ui.js               # Painel pedagógico
│   ├── steps.js            # Fluxo pedagógico
│   └── main.js             # Inicialização
├── assets/
│   ├── panoramas/          # Imagens 360° (6 cenas)
│   └── icons/              # Ícones da interface
├── docs/                   # Documentação
│   ├── arquitetura.md      # Arquitetura do sistema
│   ├── mapa-cenas.md       # Especificação das cenas
│   ├── roadmap-labmaker.md # Roadmap de desenvolvimento
│   └── checklist-testes.md # Checklist de testes manuais
└── tests/                  # (reservado)
```

## Público-alvo

Estudantes do Ensino Fundamental II e Ensino Médio, especialmente em contextos escolares com limitação de infraestrutura laboratorial.

## Licença

Projeto educacional sem fins comerciais.