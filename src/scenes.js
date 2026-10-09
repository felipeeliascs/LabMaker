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
      { label: 'Como usar o LabMaker', titulo: 'Como usar o LabMaker', descricao: 'Olhe ao redor arrastando a cena com o mouse ou o dedo. Selecione os círculos para descobrir conteúdos, atividades e ambientes.', view: { yaw: -55, pitch: 8 } },
      { label: 'Navegação', titulo: 'Navegação', descricao: 'Use os portais na cena ou o menu principal para visitar os ambientes. Em cada sala, o portal Voltar ao Hub leva você ao centro do laboratório.', view: { yaw: 12, pitch: 14 } },
      { label: 'Modo Tela / VR', titulo: 'Modo Tela / VR', descricao: 'No modo Tela, use mouse ou toque. No VR, olhe para um hotspot e aguarde o cursor completar a seleção. Atividades e ferramentas que precisam de controles abrem no modo Tela.', view: { yaw: 35, pitch: 8 } },
      { label: 'Segurança Maker', titulo: 'Segurança no laboratório Maker', descricao: 'Siga as orientações do professor, use equipamentos de proteção quando necessário e não opere máquinas reais sem supervisão.', view: { yaw: -62, pitch: -12 } },
      { label: 'Conheça os ambientes', titulo: 'Conheça os ambientes', descricao: 'O Hub Central conecta programação, eletrônica, fabricação digital, robótica, ciências e inteligência artificial. Explore livremente e descubra projetos Maker.', view: { yaw: 17, pitch: -12 } }
    ]
  },
  {
    id: 'hub',
    name: 'Hub Central do LabMaker',
    panorama: 'assets/panoramas/02-hub-central.jpg',
    description: 'Espaço central que conecta todas as áreas temáticas do LabMaker.',
    initialRotation: '0 -90 0',
    navigationHotspots: [
      { label: 'Programação\ne Computação', target: 'programacao', view: { yaw: -30, pitch: -5 }, proporcao: 0.9 },
      { label: 'Eletrônica\ne Prototipagem', target: 'eletronica', view: { yaw: -11, pitch: 0 }, proporcao: 0.7 },
      { label: 'Modelagem e\nFabricação', target: 'fabricacao', view: { yaw: 2, pitch: 5 }, proporcao: 0.7 },
      { label: 'Arena de Robótica\ne Desafios', target: 'arena', view: { yaw: 10, pitch: 3 }, proporcao: 0.7 },
      { label: 'Ciências e\nSimulações', target: 'ciencias', view: { yaw: 22, pitch: -8 }, proporcao: 0.7 },
      { label: 'Inteligência\nArtificial', target: 'ia', view: { yaw: 42, pitch: -8 }, proporcao: 0.7 },
      { label: 'Voltar à\nRecepção', target: 'antesala', view: { yaw: 30, pitch: 12 } }
    ],
    resourceHotspots: [
      { label: 'Projetos Maker', titulo: 'Projetos Maker', descricao: 'Os Projetos Maker integram programação, eletrônica, robótica, fabricação digital, ciência e inteligência artificial para resolver problemas e criar protótipos.', view: { yaw: -50, pitch: 10 } }
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
