// Trilha de Aprendizagem — guia pedagógico recomendado dos jogos Blockly.
// A sequência abaixo é apenas uma RECOMENDAÇÃO: todos os hotspots ficam
// disponíveis desde o início. Não há bloqueios, cadeados nem uso de
// localStorage para controlar desbloqueios de atividades.
var trilhaAprendizagem = [
  {
    ordem: 1,
    jogoId: 'blocos',
    titulo: 'Blocos',
    cena: 'eletronica',
    missao: 'Combine as peças para completar a figura e exercitar a lógica de montagem com blocos.',
    url: 'jogos/blockly-games/pt-br/blocos.html?lang=pt-br',
    view: { yaw: -30, pitch: -8 }
  },
  {
    ordem: 2,
    jogoId: 'labirinto',
    titulo: 'Labirinto',
    cena: 'programacao',
    missao: 'Programe os comandos do robô para encontrar a saída do labirinto.',
    url: 'jogos/blockly-games/pt-br/labirinto.html?lang=pt-br',
    view: { yaw: -55, pitch: -6 }
  },
  {
    ordem: 3,
    jogoId: 'drone',
    titulo: 'Drone',
    cena: 'programacao',
    missao: 'Pilote o drone com blocos para atravessar os obstáculos com segurança.',
    url: 'jogos/blockly-games/pt-br/drone.html?lang=pt-br',
    view: { yaw: -35, pitch: 4 }
  },
  {
    ordem: 4,
    jogoId: 'geobot',
    titulo: 'GeoBot',
    cena: 'fabricacao',
    missao: 'Programe a tartaruga para desenhar figuras e ligar a criação digital à fabricação.',
    url: 'jogos/blockly-games/pt-br/geobot.html?lang=pt-br',
    view: { yaw: -30, pitch: -8 }
  },
  {
    ordem: 5,
    jogoId: 'dancebot',
    titulo: 'DanceBot',
    cena: 'programacao',
    missao: 'Anime figuras em sequência, dando movimento a um projeto de animação.',
    url: 'jogos/blockly-games/pt-br/dancebot.html?lang=pt-br',
    view: { yaw: -15, pitch: -14 }
  },
  {
    ordem: 6,
    jogoId: 'djbot',
    titulo: 'DjBot',
    cena: 'programacao',
    missao: 'Componha ritmos com blocos de som para explorar padrões e repetições.',
    url: 'jogos/blockly-games/pt-br/djbot.html?lang=pt-br',
    view: { yaw: 5, pitch: 4 }
  },
  {
    ordem: 7,
    jogoId: 'treinamento',
    titulo: 'Treinamento',
    cena: 'arena',
    missao: 'Treine a mira programando ângulos para acertar os alvos da arena.',
    url: 'jogos/blockly-games/pt-br/treinamento.html?lang=pt-br',
    view: { yaw: -42, pitch: -8 }
  },
  {
    ordem: 8,
    jogoId: 'torneio',
    titulo: 'Torneio',
    cena: 'arena',
    missao: 'Enfrente o torneio combinando estratégia e programação avançada.',
    url: 'jogos/blockly-games/pt-br/torneio.html?lang=pt-br',
    view: { yaw: 0, pitch: -8 }
  }
];

var etapaAtual = 0;

function getTotalEtapas() {
  return trilhaAprendizagem.length;
}

function getEtapaAtual() {
  return trilhaAprendizagem[etapaAtual];
}

function getIndiceAtual() {
  return etapaAtual;
}

function proximaEtapa() {
  if (etapaAtual < trilhaAprendizagem.length - 1) {
    etapaAtual++;
  }
}

function etapaAnterior() {
  if (etapaAtual > 0) {
    etapaAtual--;
  }
}

function irParaEtapa(index) {
  if (index >= 0 && index < trilhaAprendizagem.length) {
    etapaAtual = index;
  }
}

// Retorna as atividades recomendadas para uma cena (usado para criar os hotspots).
function getAtividadesDaCena(cenaId) {
  var lista = [];
  for (var i = 0; i < trilhaAprendizagem.length; i++) {
    if (trilhaAprendizagem[i].cena === cenaId) {
      lista.push(trilhaAprendizagem[i]);
    }
  }
  return lista;
}
