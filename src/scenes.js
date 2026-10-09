// Dados declarativos das cenas do tour LabMaker
const labmakerScenes = [
  {
    id: 'antesala',
    name: 'Recepção e Orientação',
    panorama: 'assets/panoramas/01-antesala-recepcao.jpg',
    description: 'Ambiente de recepção do LabMaker. Ponto de partida do tour pelo laboratório maker.',
    initialRotation: '0 -90 0',
    navigationHotspots: [
      { label: 'Entrar no\nLabMaker', target: 'hub', view: { yaw: -23, pitch: -0 } }
    ],
    resourceHotspots: [
      { label: 'Como usar o LabMaker', icone: '#hotspotIconManual', titulo: 'Como usar o LabMaker', descricao: 'Olhe ao redor arrastando a cena com o mouse ou o dedo. Selecione os círculos para descobrir conteúdos, atividades e ambientes.', view: { yaw: -55, pitch: 8 } },
      { label: 'Navegação', icone: '#hotspotIconBussola', cor: '#59C059', titulo: 'Navegação', descricao: 'Use os portais na cena ou o menu principal para visitar os ambientes. Em cada sala, o portal Voltar ao Hub leva você ao centro do laboratório.', view: { yaw: 12, pitch: 14 } },
      { label: 'Modo Tela / VR', titulo: 'Modo Tela / VR', descricao: 'No modo Tela, use mouse ou toque. No VR, olhe para um hotspot e aguarde o cursor completar a seleção. Atividades e ferramentas que precisam de controles abrem no modo Tela.', view: { yaw: 35, pitch: 8 } },
      { label: 'GOOGLE CARDBOARD', titulo: 'GOOGLE CARDBOARD', descricao: 'Conheça um visor de realidade virtual feito com papelão, lentes e um celular.', painel: 'cardboard', tipo: 'misto', icone: '#hotspotIconCardboard', cor: '#9966FF', view: { yaw: -5, pitch: -9 } }
    ]
  },
  {
    id: 'hub',
    name: 'Hub Central do LabMaker',
    panorama: 'assets/panoramas/02-hub-central.jpg',
    description: 'Espaço central que conecta todas as áreas temáticas do LabMaker.',
    initialRotation: '0 -90 0',
    navigationHotspots: [
      { label: 'Programação\ne Computação', target: 'programacao', cor: '#4C97FF', view: { yaw: -30, pitch: -5 }, proporcao: 0.9 },
      { label: 'Eletrônica\ne Prototipagem', target: 'eletronica', cor: '#9966FF', view: { yaw: -11, pitch: 0 }, proporcao: 0.7 },
      { label: 'Modelagem e\nFabricação', target: 'fabricacao', cor: '#CF63CF', view: { yaw: 2, pitch: 5 }, proporcao: 0.7 },
      { label: 'Arena de Robótica\ne Desafios', target: 'arena', cor: '#FFBF00', view: { yaw: 10, pitch: 3 }, proporcao: 0.7 },
      { label: 'Ciências e\nSimulações', target: 'ciencias', cor: '#FFAB19', view: { yaw: 22, pitch: -8 }, proporcao: 0.7 },
      { label: 'Inteligência\nArtificial', target: 'ia', cor: '#5CB1D6', view: { yaw: 42, pitch: -8 }, proporcao: 0.7 },
      { label: 'Voltar à\nRecepção', target: 'antesala', cor: '#59C059', view: { yaw: 30, pitch: 12 } }
    ],
    resourceHotspots: [
      { label: 'Projetos Maker', cor: '#FF8C1A', titulo: 'Projetos Maker', descricao: 'Os Projetos Maker integram programação, eletrônica, robótica, fabricação digital, ciência e inteligência artificial para resolver problemas e criar protótipos.', view: { yaw: -50, pitch: 10 } }
    ]
  },
  {
    id: 'programacao',
    name: 'Programação e Computação Criativa',
    panorama: 'assets/panoramas/03-programacao-robotica.jpg',
    description: 'Estação de programação, criação digital e atividades Blockly LabMaker.',
    initialRotation: '0 -90 0',
    navigationHotspots: [
      { label: 'Voltar ao\nHub Central', target: 'hub', view: { yaw: 0, pitch: -17.66 } }
    ],
    toolHotspots: [
      { id: 'ferramentas-programacao', label: 'Outras ferramentas de programação', title: 'Outras ferramentas de programação', toolIds: ['scratch', 'makecode'], view: { yaw: 16.70, pitch: -12.33 } }
    ]
  },
  {
    id: 'eletronica',
    name: 'Eletrônica e Prototipagem',
    panorama: 'assets/panoramas/04-eletronica-prototipagem.jpg',
    description: 'Bancada com componentes eletrônicos, protoboard, sensores e ferramentas de prototipagem.',
    initialRotation: '0 -90 0',
    navigationHotspots: [
      { label: 'Voltar ao\nHub Central', target: 'hub', view: { yaw: 0, pitch: -17.66 } }
    ],
    resourceHotspots: [
      {
        label: 'Sensores e Atuadores',
        titulo: 'Sensores e Atuadores',
        descricao: 'Componentes usados para perceber o ambiente e executar ações em projetos de robótica e automação.',
        view: { yaw: 16.70, pitch: -12.33 }
      }
    ],
    toolHotspots: [
      { id: 'simuladores-eletronica', label: 'Simuladores de Eletrônica', title: 'Simuladores de Eletrônica', toolIds: ['tinkercadCircuits', 'wokwi'], view: { yaw: 30, pitch: -5 } },
      { id: 'logica-digital', label: 'Lógica Digital', title: 'Lógica Digital', toolIds: ['circuitverse'], view: { yaw: -18, pitch: 8 } }
    ]
  },
  {
    id: 'fabricacao',
    name: 'Modelagem e Fabricação Digital',
    panorama: 'assets/panoramas/05-fabricacao-digital.jpg',
    description: 'Espaço com impressoras 3D, cortadora a laser e materiais para fabricação digital.',
    initialRotation: '0 -90 0',
    navigationHotspots: [
      { label: 'Voltar ao\nHub Central', target: 'hub', view: { yaw: 0, pitch: -17.66 } }
    ],
    resourceHotspots: [
      {
        label: 'Impressão 3D',
        titulo: 'Impressão 3D',
        descricao: 'Processo de fabricação por adição usado para transformar modelos digitais em objetos físicos.',
        view: { yaw: 16.70, pitch: -12.33 }
      }
    ],
    toolHotspots: [
      { id: 'modelagem-3d', label: 'Modelagem 3D', title: 'Modelagem 3D', toolIds: ['tinkercad3d', 'tinkercadCodeblocks'], view: { yaw: 28, pitch: 6 } },
      { id: 'biblioteca-3d', label: 'Biblioteca de Modelos 3D', title: 'Biblioteca de Modelos 3D', toolIds: ['thingiverse', 'makerworld'], view: { yaw: -28, pitch: 5 } }
    ],
    simulatorHotspots: [
      {
        id: 'simulador-gearsbot-online',
        titulo: 'GearsBot',
        label: 'Robótica virtual',
        tipo: 'iframe',
        missao: 'Crie e programe robôs virtuais com blocos ou Python e teste seus projetos no simulador GearsBot.',
        url: 'https://gears.aposteriori.com.sg/',
        view: { yaw: -5, pitch: 12 }
      },
      {
        id: 'simulador-impressao-3d',
        titulo: 'Simulador de Impressão 3D',
        label: 'Simulador 3D',
        descricao: 'Simulador de impressora FDM: carregue um modelo STL, analise a peça e acompanhe a impressão camada por camada.',
        url: 'simulaores/3d/dist/index.html',
        view: { yaw: 8, pitch: -6 }
      },
      {
        // Recurso opcional, fora das oito etapas da Trilha de Aprendizagem
        id: 'simulador-gravacao-laser',
        titulo: 'Simulador CNC Laser LabMaker',
        label: 'CNC Laser',
        missao: 'Planeje o percurso, ajuste a potência e a velocidade e observe como um desenho digital pode ser gravado em uma placa de MDF virtual.',
        url: 'simulaores/cnc/dist/index.html',
        view: { yaw: -16, pitch: -8 }
      }
    ]
  },
  {
    id: 'arena',
    name: 'Arena de Robótica e Desafios',
    panorama: 'assets/panoramas/06-arena-batalha-robos.jpg',
    description: 'Arena para movimentação, sensores, labirintos, obstáculos e desafios de robótica.',
    initialRotation: '0 -90 0',
    navigationHotspots: [
      { label: 'Voltar ao\nHub Central', target: 'hub', view: { yaw: 0, pitch: -17.66 } }
    ],
    resourceHotspots: [
      {
        label: 'Desafio Robótico',
        titulo: 'Desafio Robótico',
        descricao: 'Espaço de teste, estratégia e ajuste de soluções robóticas em situação de desafio.',
        view: { yaw: 16.70, pitch: -12.33 }
      }
    ],
    toolHotspots: [
      { id: 'gearsbot', label: 'GearsBot', title: 'GearsBot', toolIds: ['gearsbot'], view: { yaw: 30, pitch: 7 } },
      { id: 'ferramentas-robotica', label: 'Ferramentas de Robótica', title: 'Ferramentas de Robótica', toolIds: ['makecode', 'pictoblox'], view: { yaw: -24, pitch: 7 } }
    ]
  },
  {
    id: 'ciencias',
    name: 'Ciências e Simulações',
    panorama: 'assets/panoramas/04-eletronica-prototipagem.jpg', // Provisório: reutiliza panorama existente.
    description: 'Explore fenômenos científicos por meio de simulações interativas.',
    initialRotation: '0 -90 0',
    navigationHotspots: [{ label: 'Voltar ao\nHub Central', target: 'hub', view: { yaw: 0, pitch: -17.66 } }],
    toolHotspots: [
      { id: 'simulacoes-cientificas', label: 'Simulações Científicas', title: 'Simulações Científicas', toolIds: ['phet'], view: { yaw: 18, pitch: -7 } }
    ]
  },
  {
    id: 'ia',
    name: 'Inteligência Artificial',
    panorama: 'assets/panoramas/03-programacao-robotica.jpg', // Provisório: reutiliza panorama existente.
    description: 'Investigue como modelos simples aprendem com exemplos.',
    initialRotation: '0 -90 0',
    navigationHotspots: [{ label: 'Voltar ao\nHub Central', target: 'hub', view: { yaw: 0, pitch: -17.66 } }],
    toolHotspots: [
      { id: 'aprendizado-maquina', label: 'Aprendizado de Máquina', title: 'Aprendizado de Máquina', toolIds: ['teachableMachine', 'pictobloxML'], view: { yaw: 18, pitch: -7 } }
    ]
  }
];
