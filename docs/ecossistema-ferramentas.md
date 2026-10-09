# Ecossistema de Ferramentas

O tour organiza oito cenas em `src/scenes.js`. O Hub Central liga os ambientes; Ciências e Inteligência Artificial usam temporariamente panoramas já presentes no projeto. Os hotspots das ferramentas são grupos (`toolHotspots`), enquanto atividades Blockly e simuladores próprios mantêm seus componentes e caminhos atuais.

```text
LabMaker
├── Ferramentas próprias (ATIVIDADE)
│   ├── Blockly LabMaker
│   ├── Simulador de Impressão 3D
│   ├── Simulador CNC Laser
│   └── GearsBot, futuramente hospedado e instrumentado
└── Ferramentas externas (EXPLORAR)
    ├── Programação e robótica
    ├── Eletrônica e lógica digital
    ├── Modelagem e bibliotecas 3D
    ├── Ciências
    └── Inteligência artificial
```

## Adicionar uma ferramenta

1. Registre um objeto com ID único em `src/tool-registry.js`: `name`, `category`, `description`, `logo`, `url`, `integration` e `iframeAllowed`.
2. Inclua o ID em um `toolHotspots[].toolIds` da cena desejada em `src/scenes.js`. A mesma definição pode aparecer em vários grupos, como MakeCode.
3. Use um ícone local em `assets/tools/` se houver direito de uso. O placeholder e as iniciais já funcionam sem baixar logos oficiais.

Exemplo:

```javascript
minhaFerramenta: {
  id: 'minhaFerramenta',
  name: 'Minha Ferramenta',
  category: 'programacao',
  description: 'Descrição breve para o aluno.',
  logo: 'assets/tools/tool-placeholder.svg',
  url: 'https://exemplo.org/',
  integration: 'external',
  iframeAllowed: false
}
```

Categorias usadas: `programacao`, `robotica`, `eletronica`, `logica-digital`, `modelagem-3d`, `biblioteca-3d`, `ciencias` e `ia`. `fabricacao` está reservada para futuros recursos.

`integration` aceita `external`, `iframe` ou `local`; `instrumented` fica reservado para recursos próprios futuros. Ferramentas externas atuais usam `external`, pois sites podem impedir incorporação. O painel só atribui `src` ao iframe de uma ferramenta `iframe` ou `local` após o clique. O botão **Abrir em nova aba** permanece disponível, inclusive quando o navegador não informa o bloqueio de iframe por CSP ou X-Frame-Options. Nenhum iframe externo carrega na entrada do tour.

Em **Modelagem e Fabricação**, o hotspot **GearsBot** abre `https://gears.aposteriori.com.sg/` diretamente no painel de atividades com iframe. A cena 360° fica suspensa enquanto o simulador está aberto; fechar o painel descarrega o iframe e retoma o tour. Este acesso depende de conexão à internet e das permissões de incorporação do site externo.

O GearsBot já tem registro local com destino `/gearsbot/`, marcado `available: false` até o pacote existir. Futuramente ele poderá registrar localmente início de atividade, execução do programa, tentativas, blocos, sensores, colisões, tempo e conclusão da missão. Esta etapa não armazena nem envia esses dados.

O painel emite eventos locais `labmaker:tool-open` ao abrir uma ferramenta e `labmaker:tool-close` ao fechar um iframe próprio. A nova aba externa é independente: o navegador não fornece acesso ao seu conteúdo nem um fechamento confiável. Não há backend, login, captura de teclas, leitura de iframes externos ou análise da navegação do aluno.
