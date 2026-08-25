// Gerencia a criação e remoção de hotspots de navegação e recurso
var hotspotEntities = [];

// Constantes para labels dos hotspots (facilita ajustes futuros)
var LABEL_LARGURA_CANVAS = 512;
var LABEL_ALTURA_CANVAS = 192;
var LABEL_TAMANHO_FONTE = 60;
var LABEL_ALTURA_LINHA = 60;
var LABEL_WIDTH_AFRAME = 1.6;
var LABEL_HEIGHT_AFRAME = 0.4;

// Converte coordenadas angulares (yaw/pitch) para posição e rotação 3D
// yaw: rotação horizontal em graus (0 = frente)
// pitch: rotação vertical em graus (0 = altura da câmera)
// radius: distância da câmera em unidades do mundo
// Nota: yaw e pitch são tratados como ângulos do mundo A-Frame
// Nota: compensação por initialRotation da cena será avaliada em etapa futura
function converterYawPitchParaTransform(view) {
  var radius = 4.5;
  var yawRad = view.yaw * Math.PI / 180;
  var pitchRad = view.pitch * Math.PI / 180;
  
  // Posição radial
  var x = radius * Math.cos(pitchRad) * Math.sin(yawRad);
  var y = 1.6 + radius * Math.sin(pitchRad);
  var z = -radius * Math.cos(pitchRad) * Math.cos(yawRad);
  
  // Rotação para orientar o hotspot para o centro
  var rotX = view.pitch;
  var rotY = -view.yaw;
  var rotZ = 0;
  
  return {
    position: { x: x, y: y, z: z },
    rotation: { x: rotX, y: rotY, z: rotZ }
  };
}

function obterProporcaoHotspot(hotspot) {
  if (hotspot.proporcao !== undefined && 
      typeof hotspot.proporcao === 'number' && 
      hotspot.proporcao > 0) {
    return hotspot.proporcao;
  }
  return 1;
}

function criarTexturaLabel(texto, opcoes) {
  var largura = opcoes.largura || LABEL_LARGURA_CANVAS;
  var altura = opcoes.altura || LABEL_ALTURA_CANVAS;
  var canvas = document.createElement('canvas');
  canvas.width = largura;
  canvas.height = altura;
  var ctx = canvas.getContext('2d');
  
  // Fonte do sistema com suporte a acentos em português
  ctx.font = 'bold ' + LABEL_TAMANHO_FONTE + 'px Arial, sans-serif';
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Processar quebra de linha
  var linhas = texto.split('\n');
  var linhaAltura = LABEL_ALTURA_LINHA;
  var yInicial = (altura - (linhas.length - 1) * linhaAltura) / 2;
  
  linhas.forEach(function(linha, index) {
    ctx.fillText(linha, largura / 2, yInicial + index * linhaAltura);
  });
  
  return canvas.toDataURL('image/png');
}

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
    if (h.view) {
      var transform = converterYawPitchParaTransform(h.view);
      el.setAttribute('position', transform.position);
      el.setAttribute('rotation', transform.rotation);
    } else {
      el.setAttribute('position', h.position);
    }
    el.setAttribute('class', 'clickable');

    // Círculo 2D translúcido azul
    var circle = document.createElement('a-entity');
    circle.setAttribute('geometry', { primitive: 'circle', radius: 0.2 });
    circle.setAttribute('material', { color: '#2196F3', side: 'double', shader: 'flat', opacity: 1, transparent: true });
    el.appendChild(circle);

    // Anel externo azul
    var ring = document.createElement('a-entity');
    ring.setAttribute('geometry', { primitive: 'ring', radiusInner: 0.22, radiusOuter: 0.26 });
    ring.setAttribute('material', { color: '#2196F3', side: 'double', shader: 'flat', opacity: 0.5, transparent: true });
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

    // Texto do label abaixo (renderizado via canvas para suporte a acentos)
    var texturaLabel = criarTexturaLabel(h.label, { largura: LABEL_LARGURA_CANVAS, altura: LABEL_ALTURA_CANVAS });
    var label = document.createElement('a-image');
    label.setAttribute('src', texturaLabel);
    label.setAttribute('width', LABEL_WIDTH_AFRAME);
    label.setAttribute('height', LABEL_HEIGHT_AFRAME);
    label.setAttribute('position', { x: 0, y: -0.35, z: 0.004 });
    el.appendChild(label);

    var proporcao = obterProporcaoHotspot(h);
    el.setAttribute('scale', { x: proporcao, y: proporcao, z: proporcao });

    el.addEventListener('click', function () { aoClicar(h.target); });

    document.querySelector('#hotspotRoot').appendChild(el);
    hotspotEntities.push(el);
  });
}

function criarHotspotsRecurso(cena, aoAbrir) {
  if (!cena.resourceHotspots || cena.resourceHotspots.length === 0) return;

  cena.resourceHotspots.forEach(function (r) {
    var el = document.createElement('a-entity');
    if (r.view) {
      var transform = converterYawPitchParaTransform(r.view);
      el.setAttribute('position', transform.position);
      el.setAttribute('rotation', transform.rotation);
    } else {
      el.setAttribute('position', r.position);
    }
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

    // Texto do recurso abaixo do círculo (renderizado via canvas para suporte a acentos)
    var texturaLabel = criarTexturaLabel(r.label, { largura: LABEL_LARGURA_CANVAS, altura: LABEL_ALTURA_CANVAS });
    var label = document.createElement('a-image');
    label.setAttribute('src', texturaLabel);
    label.setAttribute('width', LABEL_WIDTH_AFRAME);
    label.setAttribute('height', LABEL_HEIGHT_AFRAME);
    label.setAttribute('position', { x: 0, y: -0.35, z: 0.004 });
    el.appendChild(label);

    var proporcao = obterProporcaoHotspot(r);
    el.setAttribute('scale', { x: proporcao, y: proporcao, z: proporcao });

    el.addEventListener('click', function () { aoAbrir(r.titulo, r.descricao); });

    document.querySelector('#hotspotRoot').appendChild(el);
    hotspotEntities.push(el);
  });
}
