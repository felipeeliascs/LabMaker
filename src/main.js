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

  fecharRecurso();
  
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

  // No VR, disponibiliza um botão espacial para abrir a Trilha
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

  frame.src = atividade.url;
  painel.style.display = 'flex';
  painel.setAttribute('aria-hidden', 'false');

  // Garante o modo tela (jogos/simuladores exigem mouse)
  var scene = document.getElementById('mainScene');
  if (estavaEmVR && scene && typeof scene.exitVR === 'function') {
    scene.exitVR();
  }

  // Pausa a renderização 3D enquanto a atividade está aberta (baixo consumo)
  if (scene && typeof scene.pause === 'function') {
    scene.pause();
  }
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
    frame.src = 'about:blank';
  }

  var scene = document.getElementById('mainScene');
  if (scene && typeof scene.play === 'function') {
    scene.play();
  }
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

// Botão espacial (VR) para abrir a Trilha de Aprendizagem.
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
  circle.setAttribute('material', { color: '#4CAF50', side: 'double', shader: 'flat', opacity: 0.95, transparent: true });
  circle.setAttribute('class', 'interativo');
  circle.setAttribute('position', { x: 0, y: 0, z: 0.004 });
  el.appendChild(circle);

  var textura = criarTexturaLabel('Trilha de Aprendizagem', { largura: 512, altura: 128 });
  var label = document.createElement('a-image');
  label.setAttribute('src', textura);
  label.setAttribute('width', 1.4);
  label.setAttribute('height', 0.35);
  label.setAttribute('position', { x: 0, y: -0.3, z: 0.005 });
  el.appendChild(label);

  el.addEventListener('click', function () { abrirPainelPercurso(); });

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

  carregarCena('antesala');
});