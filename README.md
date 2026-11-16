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
| Backend | Nenhum (projeto 100% estático) — previsto para o futuro |

## Cenas do Tour

| # | Cena | Arquivo |
|---|---|---|
| 1 | Recepção e Orientação | `01-antesala-recepcao.jpg` |
| 2 | Hub Central do LabMaker | `02-hub-central.jpg` |
| 3 | Programação e Computação Criativa | `03-programacao-robotica.jpg` |
| 4 | Eletrônica e Prototipagem | `04-eletronica-prototipagem.jpg` |
| 5 | Modelagem e Fabricação Digital | `05-fabricacao-digital.jpg` |
| 6 | Arena de Robótica e Desafios | `06-arena-batalha-robos.jpg` |
| 7 | Ciências e Simulações | panorama provisório de Eletrônica |
| 8 | Inteligência Artificial | panorama provisório de Programação |

## Ecossistema de Ferramentas

O LabMaker reúne atividades próprias e portas para exploração livre:

```text
LabMaker
├── Ferramentas próprias
│   ├── Blockly
│   ├── Impressão 3D
│   ├── CNC Laser
│   └── GearsBot (integração local futura)
└── Ferramentas externas
    ├── Programação e robótica
    ├── Eletrônica e lógica digital
    ├── Modelagem e bibliotecas 3D
    ├── Ciências
    └── Inteligência artificial
```

Em **Modelagem e Fabricação**, o hotspot **GearsBot** abre a versão online do simulador dentro do LabMaker. A recepção também inclui o painel **Google Cardboard**, com tutorial ilustrado, vídeo e molde para impressão.

As atividades integradas usam o selo **ATIVIDADE**. Os grupos de ferramentas externas usam **EXPLORAR**. As ferramentas externas do menu Explorar abrem em nova aba, sem coleta de navegação ou projetos. O acesso online ao GearsBot utiliza um iframe. Consulte [a documentação do ecossistema](docs/ecossistema-ferramentas.md) para cadastrar ferramentas.

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
│   ├── tool-registry.js     # Cadastro único das ferramentas
│   ├── tool-panel.js        # Painel reutilizável de exploração
│   ├── ui.js               # Painel pedagógico
│   ├── steps.js            # Fluxo pedagógico
│   └── main.js             # Inicialização
├── assets/
│   ├── panoramas/          # Imagens 360° locais
│   ├── icons/              # Ícones da interface
│   └── tools/              # Ícones locais das ferramentas
├── docs/                   # Documentação
│   ├── arquitetura.md      # Arquitetura do sistema
│   ├── mapa-cenas.md       # Especificação das cenas
│   ├── ecossistema-ferramentas.md # Cadastro e integração de ferramentas
│   ├── roadmap-labmaker.md # Roadmap de desenvolvimento
│   └── checklist-testes.md # Checklist de testes manuais
└── tests/                  # (reservado)
```

## Público-alvo

Estudantes do Ensino Fundamental II e Ensino Médio, especialmente em contextos escolares com limitação de infraestrutura laboratorial.

## Licença

Distribuído sob a licença **MIT**. Consulte o arquivo [LICENSE](LICENSE) para mais detalhes.

## Publicação no GitHub Pages

Site: https://felipeeliascs.github.io/LabMaker/

A branch `desenvolvimento-vr` guarda o código. A branch `gh-pages` contém somente os arquivos públicos e usa publicação pela raiz, com `.nojekyll` para preservar os arquivos `_next` do CNC.

Para preparar uma atualização, execute na raiz do projeto, apontando para uma pasta vazia:

```powershell
node scripts/prepare-static.mjs C:\Temp\labmaker-pages /LabMaker
```

O script inclui os simuladores já compilados, o protótipo CNC Laser, os jogos e os recursos do tour. Ele adapta os caminhos absolutos do CNC somente na cópia de publicação. Depois, publique o conteúdo dessa pasta na branch `gh-pages`. Não envie fontes dos simuladores, dependências ou backups para essa branch.
