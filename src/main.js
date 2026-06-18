// Dados das duas cenas do protótipo
const cenas = {
  'antesala': {
    nome: 'Antesala / Recepção',
    imagem: 'assets/panoramas/01-antesala-recepcao.png',
    hotspots: [
      { rotulo: 'Entrar no Hub Central', destino: 'hub', posicao: { x: 0, y: 0, z: -5 } }
    ]
  },
  'hub': {
    nome: 'Hub Central',
    imagem: 'assets/panoramas/02-hub-central.png',
    hotspots: [
      { rotulo: 'Voltar à Recepção', destino: 'antesala', posicao: { x: 0, y: 0, z: -5 } }
    ]
  }
};

let cenaAtual = null;
const sky = document.getElementById('mainSky');
const nomeCena = document.getElementById('nomeCena');
let hotspotEntities = [];

function carregarCena(id) {
  const cena = cenas[id];
  if (!cena) return;

  cenaAtual = id;
  sky.setAttribute('src', cena.imagem);
  nomeCena.textContent = cena.nome;

  // Remove hotspots anteriores
  hotspotEntities.forEach(function (el) {
    el.parentNode.removeChild(el);
  });
  hotspotEntities = [];

  // Cria novos hotspots
  cena.hotspots.forEach(function (h) {
    var el = document.createElement('a-entity');
    el.setAttribute('geometry', {
      primitive: 'ring',
      radiusInner: 0.1,
      radiusOuter: 0.15
    });
    el.setAttribute('material', {
      color: '#4CAF50',
      side: 'double'
    });
    el.setAttribute('position', h.posicao);
    el.setAttribute('class', 'hotspot');

    // Tooltip com o rótulo do hotspot
    var text = document.createElement('a-entity');
    text.setAttribute('text', {
      value: h.rotulo,
      align: 'center',
      color: 'white',
      width: 2
    });
    text.setAttribute('position', { x: 0, y: 0.3, z: 0 });
    el.appendChild(text);

    // Clique navega para a cena de destino
    el.addEventListener('click', function () {
      carregarCena(h.destino);
    });

    document.querySelector('a-scene').appendChild(el);
    hotspotEntities.push(el);
  });
}

// Inicia o tour na Antesala
document.addEventListener('DOMContentLoaded', function () {
  carregarCena('antesala');
});