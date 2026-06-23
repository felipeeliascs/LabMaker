// Dados das 6 cenas do tour LabMaker
const labmakerScenes = [
  {
    id: 'antesala',
    name: 'Antesala / Recepção',
    panorama: 'assets/panoramas/01-antesala-recepcao.png',
    description: 'Ambiente de recepção do LabMaker. Ponto de partida do tour pelo laboratório maker.',
    initialRotation: '0 -90 0',
    navigationHotspots: [
      { label: 'Entrar no\nLabMaker', target: 'hub', view: { yaw: -90, pitch: -30 } }
    ]
  },
  {
    id: 'hub',
    name: 'Hub Central',
    panorama: 'assets/panoramas/02-hub-central.png',
    description: 'Espaço central que conecta todas as áreas temáticas do LabMaker.',
    initialRotation: '0 -90 0',
    navigationHotspots: [
      { label: 'Programação\ne Robótica', target: 'programacao', position: { x: -1.5, y: 0.5, z: -5 } },
      { label: 'Eletrônica\ne Prototipagem', target: 'eletronica', position: { x: -1.5, y: -0.5, z: -5 } },
      { label: 'Fabricação\nDigital', target: 'fabricacao', position: { x: 1.5, y: 0.5, z: -5 } },
      { label: 'Arena de Batalha\nde Robôs', target: 'arena', position: { x: 1.5, y: -0.5, z: -5 } },
      { label: 'Voltar à\nRecepção', target: 'antesala', position: { x: 0, y: 0, z: -5 } }
    ]
  },
  {
    id: 'programacao',
    name: 'Programação e Robótica',
    panorama: 'assets/panoramas/03-programacao-robotica.png',
    description: 'Estação com computadores, robôs educacionais e kits de programação visual.',
    initialRotation: '0 -90 0',
    navigationHotspots: [
      { label: 'Voltar ao\nHub Central', target: 'hub', position: { x: 0, y: 0, z: -5 } }
    ],
    resourceHotspots: [
      {
        label: 'Scratch',
        titulo: 'Scratch',
        descricao: 'Ambiente de programação visual por blocos para desenvolver lógica, sequência, eventos e resolução de problemas.',
        position: { x: 1.5, y: 0.5, z: -5 }
      }
    ]
  },
  {
    id: 'eletronica',
    name: 'Eletrônica e Prototipagem',
    panorama: 'assets/panoramas/04-eletronica-prototipagem.png',
    description: 'Bancada com componentes eletrônicos, protoboard, sensores e ferramentas de prototipagem.',
    initialRotation: '0 -90 0',
    navigationHotspots: [
      { label: 'Voltar ao\nHub Central', target: 'hub', position: { x: 0, y: 0, z: -5 } }
    ],
    resourceHotspots: [
      {
        label: 'Sensores e Atuadores',
        titulo: 'Sensores e Atuadores',
        descricao: 'Componentes usados para perceber o ambiente e executar ações em projetos de robótica e automação.',
        position: { x: 1.5, y: 0.5, z: -5 }
      }
    ]
  },
  {
    id: 'fabricacao',
    name: 'Fabricação Digital',
    panorama: 'assets/panoramas/05-fabricacao-digital.png',
    description: 'Espaço com impressoras 3D, cortadora a laser e materiais para fabricação digital.',
    initialRotation: '0 -90 0',
    navigationHotspots: [
      { label: 'Voltar ao\nHub Central', target: 'hub', position: { x: 0, y: 0, z: -5 } }
    ],
    resourceHotspots: [
      {
        label: 'Impressão 3D',
        titulo: 'Impressão 3D',
        descricao: 'Processo de fabricação por adição usado para transformar modelos digitais em objetos físicos.',
        position: { x: 1.5, y: 0.5, z: -5 }
      }
    ]
  },
  {
    id: 'arena',
    name: 'Arena de Batalha de Robôs',
    panorama: 'assets/panoramas/06-arena-batalha-robos.png',
    description: 'Arena com robôs controlados por programação para competições e desafios.',
    initialRotation: '0 -90 0',
    navigationHotspots: [
      { label: 'Voltar ao\nHub Central', target: 'hub', position: { x: 0, y: 0, z: -5 } }
    ],
    resourceHotspots: [
      {
        label: 'Desafio Robótico',
        titulo: 'Desafio Robótico',
        descricao: 'Espaço de teste, estratégia e ajuste de soluções robóticas em situação de desafio.',
        position: { x: 1.5, y: 0.5, z: -5 }
      }
    ]
  }
];