// Gerencia a criação e remoção de hotspots de navegação
var hotspotEntities = [];

function criarHotspotsNavegacao(cena, aoClicar) {
  limparHotspots();

  cena.navigationHotspots.forEach(function (h) {
    // Entidade pai que agrupa círculo + ícone + texto
    var el = document.createElement('a-entity');
    el.setAttribute('position', h.position);
    el.setAttribute('class', 'clickable');

    // Círculo 2D plano azul (totalmente clicável, sem buraco)
    var circle = document.createElement('a-entity');
    circle.setAttribute('geometry', {
      primitive: 'circle',
      radius: 0.2
    });
    circle.setAttribute('material', {
      color: '#2196F3',
      side: 'double',
      shader: 'flat'
    });
    el.appendChild(circle);

    // Ícone seta construído com geometria 2D (haste + ponta)
    // Direita para navegação a salas, esquerda para retorno
    var direcao = (h.target === 'hub' || h.target === 'antesala') ? -1 : 1;

    // Grupo do ícone, levemente à frente do círculo
    var iconGroup = document.createElement('a-entity');
    iconGroup.setAttribute('position', { x: 0, y: 0, z: 0.05 });

    // Haste da seta (retângulo branco)
    var haste = document.createElement('a-entity');
    haste.setAttribute('geometry', {
      primitive: 'box',
      width: 0.10,
      height: 0.04,
      depth: 0.01
    });
    haste.setAttribute('material', {
      color: 'white',
      shader: 'flat'
    });
    haste.setAttribute('position', { x: direcao * 0.02, y: 0, z: 0 });
    iconGroup.appendChild(haste);

    // Ponta da seta (cone apontando na direção)
    var ponta = document.createElement('a-entity');
    ponta.setAttribute('geometry', {
      primitive: 'cone',
      radiusBottom: 0.05,
      radiusTop: 0,
      height: 0.08
    });
    ponta.setAttribute('material', {
      color: 'white',
      shader: 'flat',
      side: 'double'
    });
    ponta.setAttribute('position', { x: direcao * 0.07, y: 0, z: 0 });
    if (direcao === 1) {
      ponta.setAttribute('rotation', { x: 0, z: -90, y: 0 });
    } else {
      ponta.setAttribute('rotation', { x: 0, z: 90, y: 0 });
    }
    iconGroup.appendChild(ponta);

    el.appendChild(iconGroup);

    // Texto do label abaixo do círculo (maior, com quebra de linha)
    var text = document.createElement('a-entity');
    text.setAttribute('text', {
      value: h.label,
      align: 'center',
      color: 'white',
      width: 4
    });
    text.setAttribute('position', { x: 0, y: -0.35, z: 0 });
    el.appendChild(text);

    // Cópia do texto com offset mínimo para simular negrito
    var textBold = document.createElement('a-entity');
    textBold.setAttribute('text', {
      value: h.label,
      align: 'center',
      color: 'white',
      width: 4
    });
    textBold.setAttribute('position', { x: 0, y: -0.35, z: 0.003 });
    el.appendChild(textBold);

    // Clique dispara callback com o ID de destino
    el.addEventListener('click', function () {
      aoClicar(h.target);
    });

    document.querySelector('a-scene').appendChild(el);
    hotspotEntities.push(el);
  });
}

function limparHotspots() {
  hotspotEntities.forEach(function (el) {
    if (el.parentNode) {
      el.parentNode.removeChild(el);
    }
  });
  hotspotEntities = [];
}