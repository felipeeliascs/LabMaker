// Inicialização do tour LabMaker
var cenaAtual = null;
var sky = document.getElementById('mainSky');
var nomeCena = document.getElementById('nomeCena');
var descricaoCena = document.getElementById('descricaoCena');

// O look-controls do A-Frame 1.6.0 limita o arrasto de toque ao eixo Y (yaw),
// impossibilitando olhar para cima/para baixo no celular. Este patch estende o
// onTouchMove para também rotacionar o pitch (eixo X), mantendo o clique de
// mouse no desktop e o raycasting intactos.
if (AFRAME && AFRAME.components && AFRAME.components['look-controls']) {
  var _lookProto = AFRAME.components['look-controls'].Component.prototype;
  _lookProto.onTouchMove = function (evt) {
    if (!this.touchStarted || !this.data.touchEnabled) return;
    var canvas = this.el.sceneEl.canvas;
    var dx = evt.touches[0].pageX - this.touchStart.x;
    var dy = evt.touches[0].pageY - this.touchStart.y;
    var dir = this.data.reverseTouchDrag ? 1 : -1;
    this.yawObject.rotation.y -= 2 * Math.PI * dx / canvas.clientWidth * 0.5 * dir;
    this.pitchObject.rotation.x += 2 * Math.PI * dy / canvas.clientHeight * 0.5 * dir;
    this.pitchObject.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitchObject.rotation.x));
    this.touchStart = { x: evt.touches[0].pageX, y: evt.touches[0].pageY };
  };
}

function buscarCena(id) {
  for (var i = 0; i < labmakerScenes.length; i++) {
    if (labmakerScenes[i].id === id) {
      return labmakerScenes[i];
    }
  }
  return null;
}

function carregarCena(id) {
  var cena = buscarCena(id);
  if (!cena) return;

  if (window.labmakerMenuVR) window.labmakerMenuVR.close();
  fecharRecurso();
  if (window.labmakerToolPanel) window.labmakerToolPanel.close();
  
  // Fechar painel espacial se estiver aberto
  if (window.labmakerVRPanel) {
    window.labmakerVRPanel.fechar();
  }

  cenaAtual = id;
  nomeCena.textContent = cena.name;
  descricaoCena.textContent = cena.description;

  limparHotspots();

  criarHotspotsNavegacao(cena, function (destino) {
    carregarCena(destino);
  });

  criarHotspotsRecurso(cena, function (titulo, descricao) {
    abrirRecurso(titulo, descricao);
  });

  criarHotspotsFerramentas(cena, function (group) {
    if (window.labmakerToolPanel) window.labmakerToolPanel.open(group);
  });

  // Hotspots das atividades da Trilha de Aprendizagem (jogos Blockly)
  criarHotspotsJogo(cena, function (atividade) {
    abrirAtividadeJogo(atividade);
  });

  // Hotspots de simuladores (recursos extras, fora da trilha)
  criarHotspotsSimulador(cena, function (simulador) {
    abrirAtividadeJogo(simulador);
  });

  window.labmakerTags.criarTags(cena, {
    navigate: function (destino) { carregarCena(destino); },
    abrirRecurso: function (titulo, descricao) { abrirRecurso(titulo, descricao); }
  });

  // No VR, disponibiliza o acesso espacial ao menu principal.
  if (window.labmakerMode && window.labmakerMode.isVR()) {
    criarBotaoTrilhaVR();
  }

  if (window.labmakerMode) {
    window.labmakerMode.refreshInterativos();
  }

  preCarregarDestinos(cena);
  aplicarPanorama(cena);
}

// Pré-carrega os panoramas das cenas alcançáveis pela navegação para que a
// troca de cena seja imediata (o download já começa durante a exploração).
function preCarregarDestinos(cena) {
  var destinos = (cena.navigationHotspots || []).map(function (h) {
    return buscarCena(h.target);
  });
  for (var i = 0; i < destinos.length; i++) {
    if (!destinos[i]) { continue; }
    var img = new Image();
    img.src = destinos[i].panorama;
  }
}

// Aplica o panorama da cena após o carregamento da imagem e exibe a tela de
// carregamento enquanto ela não estiver pronta.
function aplicarPanorama(cena) {
  var tela = document.getElementById('telaCarregamento');
  var img = new Image();

  function concluir() {
    if (cenaAtual !== cena.id) { return; }
    sky.setAttribute('src', cena.panorama);
    sky.setAttribute('rotation', cena.initialRotation || '0 -90 0');
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        ocultarTelaDeCarregamento(tela);
      });
    });
  }

  mostrarTelaDeCarregamento(tela);
  img.onload = concluir;
  img.onerror = concluir;
  img.src = cena.panorama;
}

function mostrarTelaDeCarregamento(tela) {
  if (!tela) return;
  tela.classList.add('visivel');
  tela.setAttribute('aria-hidden', 'false');
}

function ocultarTelaDeCarregamento(tela) {
  if (!tela) return;
  tela.classList.remove('visivel');
  tela.setAttribute('aria-hidden', 'true');
}

// A-Frame 1.6: pause() suspende comportamentos, mas mantém renderer.render().
// Suspender também o loop evita duas cenas WebGL ativas durante uma atividade.
var cenaSuspensaParaAtividade = null;
function suspenderCenaParaAtividade(scene) {
  if (!scene || cenaSuspensaParaAtividade) return;
  var suspensao = { scene: scene, estavaTocando: scene.isPlaying, loopPausado: false };
  suspensao.pararLoop = function () {
    if (cenaSuspensaParaAtividade !== suspensao) return;
    if (scene.pause) scene.pause();
    if (scene.renderer && scene.renderStarted) {
      scene.renderer.setAnimationLoop(null);
      suspensao.loopPausado = true;
    }
  };
  cenaSuspensaParaAtividade = suspensao;
  scene.addEventListener('renderstart', suspensao.pararLoop);
  scene.addEventListener('exit-vr', suspensao.pararLoop);
  suspensao.pararLoop();
}
function retomarCenaAposAtividade() {
  var suspensao = cenaSuspensaParaAtividade;
  if (!suspensao) return;
  cenaSuspensaParaAtividade = null;
  var scene = suspensao.scene;
  scene.removeEventListener('renderstart', suspensao.pararLoop);
  scene.removeEventListener('exit-vr', suspensao.pararLoop);
  if (scene.clock) scene.clock.getDelta();
  if (suspensao.estavaTocando && scene.play) scene.play();
  if (suspensao.loopPausado && scene.renderer) scene.renderer.setAnimationLoop(scene.render);
}

// Abre a atividade (jogo Blockly ou simulador) embutida num painel (iframe),
// mantendo o aluno dentro do ambiente LabMaker. Essas atividades abrem em
// modo tela (exigem arrastar blocos, controles deslizantes e botões), então
// o VR é encerrado.
function abrirAtividadeJogo(atividade) {
  if (!atividade) return;

  fecharPainelPercurso();
  fecharRecurso();

  var estavaEmVR = !!(window.labmakerMode && window.labmakerMode.isVR());

  // Em VR, informar que a atividade abre em modo tela
  if (estavaEmVR && window.labmakerVRPanel) {
    var avisoVR = 'Esta atividade abre em modo tela, pois exige controles deslizantes e botões.';
    var descVR = atividade.missao ? atividade.missao + '\n\n' + avisoVR : avisoVR;
    window.labmakerVRPanel.abrir(atividade.titulo || 'Atividade', descVR);
  } else if (window.labmakerVRPanel && window.labmakerVRPanel.estaAberto()) {
    window.labmakerVRPanel.fechar();
  }

  var painel = document.getElementById('painelJogo');
  var frame = document.getElementById('gameFrame');
  if (!painel || !frame) {
    window.open(atividade.url, '_blank');
    return;
  }

  var tituloEl = document.getElementById('jogoTitulo');
  if (tituloEl) tituloEl.textContent = atividade.titulo || 'Atividade';

  var missaoEl = document.getElementById('jogoMissao');
  if (missaoEl) missaoEl.textContent = atividade.missao || '';

  var modoEl = document.getElementById('jogoModo');
  if (modoEl) {
    modoEl.textContent = estavaEmVR
      ? 'Abre em modo tela — use os controles deslizantes e botões.'
      : '';
  }

  var blocosGuia = document.getElementById('blocosGuia');
  if (blocosGuia) {
    var mostrarGuia = atividade.jogoId === 'blocos';
    blocosGuia.hidden = !mostrarGuia;
    blocosGuia.open = mostrarGuia;
  }

  frame.src = atividade.url;
  painel.style.display = 'flex';
  painel.setAttribute('aria-hidden', 'false');

  // Garante o modo tela (jogos/simuladores exigem mouse)
  var scene = document.getElementById('mainScene');
  if (estavaEmVR && scene && typeof scene.exitVR === 'function') {
    scene.exitVR();
  }

  suspenderCenaParaAtividade(scene);
}

// Fecha o painel do jogo e libera os recursos
function fecharJogo() {
  var painel = document.getElementById('painelJogo');
  var frame = document.getElementById('gameFrame');

  if (painel) {
    painel.style.display = 'none';
    painel.setAttribute('aria-hidden', 'true');
  }
  if (frame) {
    frame.contentWindow?.postMessage({ type: 'labmaker:visibility', visible: false }, window.location.origin);
    frame.src = 'about:blank';
  }

  retomarCenaAposAtividade();
  if (window.labmakerMode) {
    window.labmakerMode.refreshInterativos();
  }
}

// Leva o aluno ao cenário da atividade e destaca o hotspot correspondente.
// Não altera o progresso nem bloqueia nada: serve apenas como recomendação.
function navegarParaAtividade(index, reabrirVR) {
  irParaEtapa(index);

  var atividade = getEtapaAtual();
  if (!atividade) return;

  if (cenaAtual !== atividade.cena) {
    carregarCena(atividade.cena);
  }

  destacarHotspotJogo(atividade.jogoId);

  if (reabrirVR && window.labmakerMode && window.labmakerMode.isVR() &&
      window.labmakerVRPanel) {
    window.labmakerVRPanel.abrirTrilha();
  }
}

// Botão espacial (VR) para abrir o menu principal.
// Só é criado no modo VR; em tela, o botão HTML é usado.
function criarBotaoTrilhaVR() {
  if (!(window.labmakerMode && window.labmakerMode.isVR())) return;
  if (document.getElementById('trilhaMenuBtn')) return;

  var root = document.querySelector('#hotspotRoot');
  if (!root) return;

  var el = document.createElement('a-entity');
  el.setAttribute('id', 'trilhaMenuBtn');
  var transform = converterYawPitchParaTransform({ yaw: 0, pitch: -22 });
  el.setAttribute('position', transform.position);
  el.setAttribute('rotation', transform.rotation);
  el.setAttribute('class', 'clickable');

  var circle = document.createElement('a-entity');
  circle.setAttribute('geometry', { primitive: 'circle', radius: 0.18 });
  circle.setAttribute('material', { color: '#505050', side: 'double', shader: 'flat', opacity: 0.95, transparent: true });
  circle.setAttribute('class', 'interativo');
  circle.setAttribute('position', { x: 0, y: 0, z: 0.004 });
  el.appendChild(circle);

  var textura = criarTexturaLabel('Menu principal', { largura: 512, altura: 128 });
  var label = document.createElement('a-image');
  label.setAttribute('src', textura);
  label.setAttribute('width', 1.4);
  label.setAttribute('height', 0.35);
  label.setAttribute('position', { x: 0, y: -0.3, z: 0.005 });
  el.appendChild(label);

  el.addEventListener('click', function () {
    if (window.labmakerMenuVR) window.labmakerMenuVR.toggle();
  });

  root.appendChild(el);
  hotspotEntities.push(el);
}

function removerBotaoTrilhaVR() {
  var el = document.getElementById('trilhaMenuBtn');
  if (!el) return;
  if (el.parentNode) el.parentNode.removeChild(el);
  var idx = hotspotEntities.indexOf(el);
  if (idx >= 0) hotspotEntities.splice(idx, 1);
}

// Conecta eventos dos botões
document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('btnFecharRecurso').addEventListener('click', function () {
    fecharRecurso();
  });

  document.getElementById('btnPercurso').addEventListener('click', function () {
    abrirPainelPercurso();
  });

  document.getElementById('btnFecharPercurso').addEventListener('click', function () {
    fecharPainelPercurso();
  });

  document.getElementById('btnAnterior').addEventListener('click', function () {
    window.labmakerTrilha.anterior();
  });

  document.getElementById('btnProxima').addEventListener('click', function () {
    window.labmakerTrilha.proxima();
  });

  document.getElementById('btnFecharJogo').addEventListener('click', function () {
    fecharJogo();
  });

  // Esc fecha o painel do jogo
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      var painel = document.getElementById('painelJogo');
      if (painel && painel.style.display === 'flex') {
        fecharJogo();
      }
    }
  });

  var cenaInicial = new URLSearchParams(window.location.search).get('scene');
  carregarCena(buscarCena(cenaInicial) ? cenaInicial : 'antesala');
});
