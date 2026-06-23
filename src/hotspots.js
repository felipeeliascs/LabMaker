// Gerencia a criação e remoção de hotspots de navegação e recurso
var hotspotEntities = [];

function limparHotspots() {
  hotspotEntities.forEach(function (el) {
    if (el.parentNode) {
      el.parentNode.removeChild(el);
    }
  });
  hotspotEntities = [];
}

function criarHotspotsNavegacao(cena, aoClicar) {
  cena.navigationHotspots.forEach(function (h) {
    var el = document.createElement('a-entity');
    el.setAttribute('position', h.position);
    el.setAttribute('class', 'clickable');

    // Círculo 2D translúcido azul
    var circle = document.createElement('a-entity');
    circle.setAttribute('geometry', { primitive: 'circle', radius: 0.2 });
    circle.setAttribute('material', { color: '#2196F3', side: 'double', shader: 'flat', opacity: 0.3, transparent: true });
    el.appendChild(circle);

    // Anel externo azul
    var ring = document.createElement('a-entity');
    ring.setAttribute('geometry', { primitive: 'ring', radiusInner: 0.22, radiusOuter: 0.26 });
    ring.setAttribute('material', { color: '#2196F3', side: 'double', shader: 'flat', opacity: 0.8, transparent: true });
    ring.setAttribute('position', { x: 0, y: 0, z: 0.002 });
    el.appendChild(ring);

    // Ícone seta 2D (haste + ponta), direita ou esquerda
    var direcao = (h.target === 'hub' || h.target === 'antesala') ? -1 : 1;
    var iconGroup = document.createElement('a-entity');
    iconGroup.setAttribute('position', { x: 0, y: 0, z: 0.05 });

    // Haste (retângulo) — plane 2D
    var haste = document.createElement('a-entity');
    haste.setAttribute('geometry', { primitive: 'plane', width: 0.08, height: 0.03 });
    haste.setAttribute('material', { color: 'white', shader: 'flat', side: 'double' });
    haste.setAttribute('position', { x: direcao * 0.02, y: 0, z: 0 });
    iconGroup.appendChild(haste);

    // Ponta (triângulo) — cone com shader flat
    var ponta = document.createElement('a-entity');
    ponta.setAttribute('geometry', { primitive: 'cone', radiusBottom: 0.04, radiusTop: 0, height: 0.06 });
    ponta.setAttribute('material', { color: 'white', shader: 'flat', side: 'double' });
    ponta.setAttribute('position', { x: direcao * 0.07, y: 0, z: 0 });
    if (direcao === 1) {
      ponta.setAttribute('rotation', '0 0 -90');
    } else {
      ponta.setAttribute('rotation', '0 0 90');
    }
    iconGroup.appendChild(ponta);
    el.appendChild(iconGroup);

    // Texto do label abaixo (com negrito simulado)
    var text = document.createElement('a-entity');
    text.setAttribute('text', { value: h.label, align: 'center', color: 'white', width: 4 });
    text.setAttribute('position', { x: 0, y: -0.35, z: 0 });
    el.appendChild(text);

    // Cópia com offset para negrito
    var textBold = document.createElement('a-entity');
    textBold.setAttribute('text', { value: h.label, align: 'center', color: 'white', width: 4 });
    textBold.setAttribute('position', { x: 0, y: -0.35, z: 0.003 });
    el.appendChild(textBold);

    el.addEventListener('click', function () { aoClicar(h.target); });

    document.querySelector('#hotspotRoot').appendChild(el);
    hotspotEntities.push(el);
  });
}

function criarHotspotsRecurso(cena, aoAbrir) {
  if (!cena.resourceHotspots || cena.resourceHotspots.length === 0) return;

  cena.resourceHotspots.forEach(function (r) {
    var el = document.createElement('a-entity');
    el.setAttribute('position', r.position);
    el.setAttribute('class', 'clickable');

    // Círculo 2D translúcido laranja
    var circle = document.createElement('a-entity');
    circle.setAttribute('geometry', { primitive: 'circle', radius: 0.20 });
    circle.setAttribute('material', { color: '#FF9800', side: 'double', shader: 'flat', opacity: 0.3, transparent: true });
    el.appendChild(circle);

    // Anel externo laranja
    var ring = document.createElement('a-entity');
    ring.setAttribute('geometry', { primitive: 'ring', radiusInner: 0.22, radiusOuter: 0.26 });
    ring.setAttribute('material', { color: '#FF9800', side: 'double', shader: 'flat', opacity: 0.8, transparent: true });
    ring.setAttribute('position', { x: 0, y: 0, z: 0.002 });
    el.appendChild(ring);

    // Ícone de informação 2D (ponto + haste) — geometrias planas
    var iconGroup = document.createElement('a-entity');
    iconGroup.setAttribute('position', { x: 0, y: 0, z: 0.05 });

    // Ponto (círculo branco pequeno no topo)
    var ponto = document.createElement('a-entity');
    ponto.setAttribute('geometry', { primitive: 'circle', radius: 0.035 });
    ponto.setAttribute('material', { color: 'white', shader: 'flat', side: 'double' });
    ponto.setAttribute('position', { x: 0, y: 0.04, z: 0 });
    iconGroup.appendChild(ponto);

    // Haste (retângulo vertical branco)
    var haste = document.createElement('a-entity');
    haste.setAttribute('geometry', { primitive: 'plane', width: 0.03, height: 0.06 });
    haste.setAttribute('material', { color: 'white', shader: 'flat', side: 'double' });
    haste.setAttribute('position', { x: 0, y: -0.025, z: 0 });
    iconGroup.appendChild(haste);

    el.appendChild(iconGroup);

    // Placa/fundo escuro atrás do texto para melhor legibilidade
    var fundo = document.createElement('a-entity');
    fundo.setAttribute('geometry', { primitive: 'plane', width: 1.2, height: 0.2 });
    fundo.setAttribute('material', { color: '#222222', shader: 'flat', side: 'double', opacity: 0.6, transparent: true });
    fundo.setAttribute('position', { x: 0, y: -0.35, z: -0.001 });
    el.appendChild(fundo);

    // Texto do recurso abaixo do círculo (maior, com negrito simulado)
    var text = document.createElement('a-entity');
    text.setAttribute('text', { value: r.label, align: 'center', color: 'white', width: 4 });
    text.setAttribute('position', { x: 0, y: -0.35, z: 0 });
    el.appendChild(text);

    // Cópia com offset para negrito
    var textBold = document.createElement('a-entity');
    textBold.setAttribute('text', { value: r.label, align: 'center', color: 'white', width: 4 });
    textBold.setAttribute('position', { x: 0, y: -0.35, z: 0.003 });
    el.appendChild(textBold);

    el.addEventListener('click', function () { aoAbrir(r.titulo, r.descricao); });

    document.querySelector('#hotspotRoot').appendChild(el);
    hotspotEntities.push(el);
  });
}