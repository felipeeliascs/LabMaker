// Menu espacial acessível pelo cursor de olhar do VR Box.
(function () {
  var scene = document.getElementById('mainScene');
  var camera = document.querySelector('a-camera');
  var canvas = document.getElementById('vrMainMenuCanvas');
  if (!scene || !camera || !canvas) return;

  var root = document.createElement('a-entity');
  root.id = 'vrMainMenuRoot';
  root.setAttribute('visible', false);
  root.object3D.visible = false;
  scene.appendChild(root);
  var aberto = false;

  var ctx = canvas.getContext('2d');

  function caixa(x, y, width, height, raio, cor) {
    ctx.fillStyle = cor;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, raio);
    ctx.fill();
  }

  function texto(conteudo, x, y, tamanho, cor, alinhamento) {
    ctx.font = 'bold ' + tamanho + 'px Arial, sans-serif';
    ctx.fillStyle = cor || '#FFFFFF';
    ctx.textAlign = alinhamento || 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(conteudo, x, y);
  }

  function desenhar() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    caixa(8, 8, 1008, 752, 36, 'rgba(35, 35, 35, 0.96)');
    texto('Menu principal', 54, 62, 42);
    caixa(900, 28, 78, 72, 18, '#626262');
    texto('×', 939, 65, 52, '#FFFFFF', 'center');

    texto('Cenas', 54, 132, 32);
    var cenas = [
      ['antesala', 'Antesala'], ['hub', 'Hub'], ['programacao', 'Programação'],
      ['eletronica', 'Eletrônica'], ['fabricacao', 'Fabricação'], ['arena', 'Arena']
    ];
    cenas.forEach(function (cena, indice) {
      var coluna = indice % 3;
      var linha = Math.floor(indice / 3);
      var x = 54 + coluna * 306;
      var y = 158 + linha * 62;
      var selecionada = cena[0] === window.cenaAtual;
      caixa(x, y, 286, 50, 16, selecionada ? '#D1D1D1' : '#646464');
      texto(cena[1], x + 143, y + 25, 25, selecionada ? '#202020' : '#FFFFFF', 'center');
    });

    texto('Ferramentas', 54, 322, 32);
    var ferramentas = ['Zoom +', 'Zoom −', 'Giro ativo', 'Acessibilidade'];
    ferramentas.forEach(function (ferramenta, indice) {
      var x = 54 + indice * 230;
      caixa(x, 349, 214, 64, 16, indice === 2 ? '#2563A6' : '#626262');
      texto(ferramenta, x + 107, 381, 24, '#FFFFFF', 'center');
    });

    texto('Atividades', 54, 465, 32);
    var atividades = ['1. Blocos', '2. Labirinto', '3. Drone', '4. GeoBot',
      '5. DanceBot', '6. DjBot', '7. Treinamento', '8. Torneio'];
    atividades.forEach(function (atividade, indice) {
      var coluna = indice % 4;
      var linha = Math.floor(indice / 4);
      var x = 54 + coluna * 230;
      var y = 490 + linha * 58;
      caixa(x, y, 214, 46, 12, '#676767');
      texto(atividade, x + 107, y + 23, 22, '#FFFFFF', 'center');
    });

    caixa(54, 650, 304, 78, 16, '#505050');
    texto('Mapa 360 (em breve)', 206, 689, 25, '#FFFFFF', 'center');
    caixa(600, 650, 370, 78, 16, '#4CAF50');
    texto('Abrir Trilha', 785, 689, 29, '#FFFFFF', 'center');
  }

  function hitbox(id, x, y, width, height, aoClicar) {
    var plane = document.createElement('a-plane');
    plane.id = id;
    plane.setAttribute('class', 'interativo');
    plane.setAttribute('width', width);
    plane.setAttribute('height', height);
    plane.setAttribute('position', { x: x, y: y, z: 0.014 });
    plane.setAttribute('material', { color: '#FFFFFF', opacity: 0.01, transparent: true, side: 'double' });
    plane.addEventListener('click', function (event) {
      event.stopPropagation();
      aoClicar();
    });
    root.appendChild(plane);
  }

  function hitboxCanvas(id, x, y, width, height, aoClicar) {
    hitbox(id,
      ((x + width / 2) / canvas.width - 0.5) * 2.4,
      (0.5 - (y + height / 2) / canvas.height) * 1.8,
      width / canvas.width * 2.4,
      height / canvas.height * 1.8,
      aoClicar);
  }

  var blocker = document.createElement('a-plane');
  blocker.setAttribute('class', 'interativo');
  blocker.setAttribute('width', 2.4);
  blocker.setAttribute('height', 1.8);
  blocker.setAttribute('position', { x: 0, y: 0, z: -0.012 });
  blocker.setAttribute('material', { color: '#FFFFFF', opacity: 0.01, transparent: true, side: 'double' });
  blocker.addEventListener('click', function (event) { event.stopPropagation(); });
  root.appendChild(blocker);

  var image = document.createElement('a-image');
  image.setAttribute('src', '#vrMainMenuCanvas');
  image.setAttribute('width', 2.4);
  image.setAttribute('height', 1.8);
  image.setAttribute('material', { shader: 'flat', transparent: true, side: 'double' });
  root.appendChild(image);

  function atualizarRaycast() {
    if (window.labmakerMode) window.labmakerMode.refreshInterativos();
  }

  function fechar() {
    if (!aberto) return;
    aberto = false;
    root.setAttribute('visible', false);
    root.object3D.visible = false;
    atualizarRaycast();
  }

  hitbox('vrMainMenuClose', 1.00, 0.75, 0.19, 0.18, fechar);
  hitbox('vrMainMenuTrail', 0.64, -0.72, 0.86, 0.20, function () {
    fechar();
    abrirPainelPercurso();
  });

  ['antesala', 'hub', 'programacao', 'eletronica', 'fabricacao', 'arena'].forEach(function (id, indice) {
    hitboxCanvas('vrMenuCena' + indice, 54 + indice % 3 * 306,
      158 + Math.floor(indice / 3) * 62, 286, 50, function () {
        window.labmakerMainMenu.goToScene(id);
      });
  });

  for (var indice = 0; indice < 8; indice++) {
    (function (atividade) {
      hitboxCanvas('vrMenuAtividade' + atividade, 54 + atividade % 4 * 230,
        490 + Math.floor(atividade / 4) * 58, 214, 46, function () {
          window.labmakerMainMenu.openActivity(atividade);
        });
    })(indice);
  }

  hitboxCanvas('vrMenuAcessibilidade', 744, 349, 214, 64, function () {
    window.labmakerMainMenu.openAccessibility();
  });

  desenhar();

  function abrir() {
    if (!(window.labmakerMode && window.labmakerMode.isVR())) return;
    if (window.labmakerVRPanel && window.labmakerVRPanel.estaAberto()) window.labmakerVRPanel.fechar();
    desenhar();
    if (image.getObject3D('mesh') && image.getObject3D('mesh').material.map) {
      image.getObject3D('mesh').material.map.needsUpdate = true;
    }
    var posicao = new THREE.Vector3();
    var rotacao = new THREE.Quaternion();
    camera.object3D.getWorldPosition(posicao);
    camera.object3D.getWorldQuaternion(rotacao);
    var frente = new THREE.Vector3(0, 0, -1).applyQuaternion(rotacao);
    root.object3D.position.copy(posicao.add(frente.multiplyScalar(2.2)));
    root.object3D.quaternion.copy(rotacao);
    root.setAttribute('visible', true);
    root.object3D.visible = true;
    aberto = true;
    atualizarRaycast();
  }

  scene.addEventListener('exit-vr', fechar);
  window.labmakerMenuVR = {
    toggle: function () { if (aberto) fechar(); else abrir(); },
    close: fechar,
    isOpen: function () { return aberto; }
  };
})();
