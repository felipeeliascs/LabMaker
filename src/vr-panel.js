// Painel espacial para recursos no mode VR
// Usa canvas renderizado como textura para visual consistente com o painel HTML

var _vrPanelCanvas = null;
var _vrPanelTexture = null;
var _vrPanelEntity = null;
var _vrPanelCloseHitbox = null;
var _vrPanelPrevHitbox = null;
var _vrPanelNextHitbox = null;
var _vrPanelBackground = null;
var _vrPanelIsOpen = false;
var _vrPanelCurrentData = null;
var _vrPanelInitialized = false;
// 'recurso' = conteúdo educacional | 'trilha' = Trilha de Aprendizagem
var _vrPanelMode = 'recurso';

// Tamanho do canvas: 1024x640 para boa resolucao em VR
var VR_PANEL_WIDTH = 1024;
var VR_PANEL_HEIGHT = 640;

// Dimensoes do painel espacial (em metros)
var VR_PANEL_WIDTH_METERS = 1.8;
var VR_PANEL_HEIGHT_METERS = 1.125;
var VR_PANEL_DISTANCE = 2.0;

// Layout dos botoes da Trilha no canvas (mesma logica do painel HTML)
var VR_BTN = {
  anterior: { x: 60, y: 530, w: 200, h: 50 },
  fechar: { x: 412, y: 530, w: 200, h: 50 },
  proxima: { x: 764, y: 530, w: 200, h: 50 }
};

// Converte um retangulo do canvas em posicao/tamanho no plano 3D do painel
function canvasRectToPlane(rect) {
  var cx = rect.x + rect.w / 2;
  var cy = rect.y + rect.h / 2;
  return {
    x: (cx / VR_PANEL_WIDTH - 0.5) * VR_PANEL_WIDTH_METERS,
    y: (0.5 - cy / VR_PANEL_HEIGHT) * VR_PANEL_HEIGHT_METERS,
    w: (rect.w / VR_PANEL_WIDTH) * VR_PANEL_WIDTH_METERS,
    h: (rect.h / VR_PANEL_HEIGHT) * VR_PANEL_HEIGHT_METERS
  };
}

function drawVRButton(ctx, rect, label, disabled) {
  ctx.globalAlpha = disabled ? 0.4 : 1;
  ctx.fillStyle = '#4CAF50';
  ctx.beginPath();
  ctx.roundRect(rect.x, rect.y, rect.w, rect.h, 8);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 22px Arial, Helvetica, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, rect.x + rect.w / 2, rect.y + rect.h / 2);
  ctx.globalAlpha = 1;
}

function updateVRPanelTexture() {
  if (!_vrPanelBackground) return;
  var mesh = _vrPanelBackground.getObject3D('mesh');
  if (mesh && mesh.material && mesh.material.map) {
    mesh.material.map.needsUpdate = true;
  }
}

// Funcao para desenhar o conteudo no canvas
function drawVRPanelCanvas(titulo, descricao) {
  if (!_vrPanelCanvas || !_vrPanelCanvas.getContext) return;
  
  var ctx = _vrPanelCanvas.getContext('2d');
  var w = _vrPanelCanvas.width;
  var h = _vrPanelCanvas.height;
  
  ctx.clearRect(0, 0, w, h);
  
  // Margens e espacamentos baseados no CSS do painel HTML
  var paddingX = 60;
  var paddingY = 50;
  var cornerRadius = 20;
  var innerSpacing = 20;
  
  // Fundo com cantos arredondados (cor: rgba(0, 0, 0, 0.88) ~ #000 com 88% opacidade)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.88)';
  ctx.beginPath();
  ctx.roundRect(0, 0, w, h, cornerRadius);
  ctx.fill();
  
  // Area do titulo
  var titleY = paddingY + 35;
  var titleSize = 44;
  ctx.font = 'bold ' + titleSize + 'px Arial, Helvetica, sans-serif';
  ctx.fillStyle = '#FF9800';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(titulo || '', w / 2, titleY);
  
  var titleHeight = titleSize + innerSpacing;
  
  // Area da descricao
  var descY = titleY + titleHeight;
  var descSize = 32;
  ctx.font = descSize + 'px Arial, Helvetica, sans-serif';
  ctx.fillStyle = '#FFFFFF';
  
  // Posicao do botao Fechar (primeiro para calcular linhas disponíveis)
  var btnWidth = 200;
  var btnHeight = 50;
  var btnY = h - paddingY - btnHeight - 10;
  var btnX = (w - btnWidth) / 2;
  
  // Quebra de texto para a descricao
  var maxWidth = w - paddingX * 2;
  var lines = wrapText(descricao || '', ctx, maxWidth);
  
  // Calcular linhas disponíveis considerando área acima do botão
  var marginBelowTitle = 30;
  var marginAboveButton = 30;
  var availableHeight = btnY - (descY + marginBelowTitle) - marginAboveButton;
  var lineHeight = descSize + 4;
  var availableLines = Math.floor(availableHeight / lineHeight);
  
  if (lines.length > availableLines) {
    lines = lines.slice(0, availableLines);
    lines[availableLines - 1] = lines[availableLines - 1].slice(0, -3) + '...';
  }
  
  for (var i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], w / 2, descY + i * (descSize + 4));
  }
  
  // Altura ocupada pelo texto
  var textHeight = (lines.length > 0) ? (lines.length * (descSize + 4)) : 0;
  
  // Botao Fechar (cor: #FF9800)
  ctx.fillStyle = '#FF9800';
  ctx.beginPath();
  ctx.roundRect(btnX, btnY, btnWidth, btnHeight, 8);
  ctx.fill();
  
  // Texto do botao
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold ' + 20 + 'px Arial, Helvetica, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Fechar', w / 2, btnY + btnHeight / 2);
}

// Desenha o menu "Trilha de Aprendizagem" no painel espacial (VR)
function drawVRTrilhaCanvas() {
  if (!_vrPanelCanvas || !_vrPanelCanvas.getContext) return;

  var ctx = _vrPanelCanvas.getContext('2d');
  var w = _vrPanelCanvas.width;
  var h = _vrPanelCanvas.height;

  ctx.clearRect(0, 0, w, h);

  // Fundo
  ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
  ctx.beginPath();
  ctx.roundRect(0, 0, w, h, 20);
  ctx.fill();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  // Cabeçalho
  ctx.fillStyle = '#4CAF50';
  ctx.font = 'bold 40px Arial, Helvetica, sans-serif';
  ctx.fillText('Trilha de Aprendizagem', w / 2, 40);

  var atividade = (typeof getEtapaAtual === 'function') ? getEtapaAtual() : null;
  var indice = (typeof getIndiceAtual === 'function') ? getIndiceAtual() : 0;
  var total = (typeof getTotalEtapas === 'function') ? getTotalEtapas() : 0;

  if (!atividade) {
    return;
  }

  // Título da atividade
  ctx.fillStyle = '#FFEB3B';
  ctx.font = 'bold 54px Arial, Helvetica, sans-serif';
  ctx.fillText(atividade.titulo, w / 2, 110);

  // Missão (com quebra de linha)
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '30px Arial, Helvetica, sans-serif';
  var linhas = wrapText(atividade.missao || '', ctx, w - 120);
  for (var i = 0; i < linhas.length && i < 5; i++) {
    ctx.fillText(linhas[i], w / 2, 190 + i * 40);
  }

  // Progresso
  ctx.fillStyle = '#BBBBBB';
  ctx.font = '26px Arial, Helvetica, sans-serif';
  ctx.fillText('Atividade ' + (indice + 1) + ' de ' + total, w / 2, 440);

  // Botões
  drawVRButton(ctx, VR_BTN.anterior, 'Anterior', indice === 0);
  drawVRButton(ctx, VR_BTN.proxima, 'Próxima', indice === total - 1);
  drawVRButton(ctx, VR_BTN.fechar, 'Fechar', false);
}

// Funcao de quebra de texto baseada na largura
function wrapText(text, ctx, maxWidth) {
  if (!text) return [];
  
  var words = text.split(' ');
  var lines = [];
  var currentLine = words[0];
  
  for (var i = 1; i < words.length; i++) {
    var word = words[i];
    var width = ctx.measureText(currentLine + ' ' + word).width;
    if (width < maxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  
  return lines;
}

// Configura a geometria/posicao de uma hitbox a partir de um retangulo do canvas
function _configurarHitbox(el, rect) {
  var p = canvasRectToPlane(rect);
  el.setAttribute('geometry', 'primitive: plane; width: ' + p.w + '; height: ' + p.h);
  el.setAttribute('material', 'color: #4CAF50; opacity: 0.001; shader: flat; depthWrite: false');
  el.setAttribute('position', p.x + ' ' + p.y + ' 0.01');
}

// Ativa/desativa as hitboxes de Anterior/Proxima (somente na Trilha)
function _setTrilhaHitboxesAtivo(ativo) {
  if (!_vrPanelPrevHitbox || !_vrPanelNextHitbox) return;
  var prev = canvasRectToPlane(VR_BTN.anterior);
  var next = canvasRectToPlane(VR_BTN.proxima);
  _vrPanelPrevHitbox.setAttribute('position', ativo ? (prev.x + ' ' + prev.y + ' 0.01') : '0 -100 0');
  _vrPanelNextHitbox.setAttribute('position', ativo ? (next.x + ' ' + next.y + ' 0.01') : '0 -100 0');
}

// Inicializar estrutura do painel VR uma unica vez
function initVRPanel() {
  if (_vrPanelInitialized) return true;
  
  // Verificar elementos obrigatórios no HTML
  var canvas = document.getElementById('vrPanelCanvas');
  var root = document.getElementById('vrPanelRoot');
  
  if (!canvas || !root) {
    console.error('Painel VR: estrutura obrigatória não encontrada (canvas=%o, root=%o)', canvas, root);
    return false;
  }
  
  _vrPanelCanvas = canvas;
  _vrPanelEntity = root;
  
  // Criar textura (vinculada ao material A-Frame)
  _vrPanelTexture = new THREE.CanvasTexture(_vrPanelCanvas);
  _vrPanelTexture.colorSpace = THREE.SRGBColorSpace;
  
  // Configurar o root como invisível inicialmente
  _vrPanelEntity.setAttribute('visible', false);
  if (_vrPanelEntity.object3D) {
    _vrPanelEntity.object3D.visible = false;
  }
  
  // Criar fundo do painel (com textura)
  _vrPanelBackground = document.createElement('a-entity');
  _vrPanelBackground.setAttribute('geometry', 'primitive: plane; width: ' + VR_PANEL_WIDTH_METERS + '; height: ' + VR_PANEL_HEIGHT_METERS);
  _vrPanelBackground.setAttribute('material', 'shader: flat; src: #vrPanelCanvas; side: double; transparent: true; opacity: 0.99; depthWrite: false');
  _vrPanelBackground.setAttribute('position', '0 0 0');
  _vrPanelBackground.setAttribute('class', 'interativo');
  _vrPanelBackground.object3D.userData.isVRPanel = true;
  _vrPanelEntity.appendChild(_vrPanelBackground);
  
  // Hitboxes dos botoes (Fechar sempre ativo; Anterior/Proxima na Trilha)
  _vrPanelCloseHitbox = document.createElement('a-entity');
  _vrPanelCloseHitbox.setAttribute('id', 'vrPanelCloseHitbox');
  _vrPanelCloseHitbox.setAttribute('class', 'interativo');
  _vrPanelCloseHitbox.object3D.userData.isVRPanelCloseBtn = true;
  _vrPanelEntity.appendChild(_vrPanelCloseHitbox);

  _vrPanelPrevHitbox = document.createElement('a-entity');
  _vrPanelPrevHitbox.setAttribute('id', 'vrPanelPrevHitbox');
  _vrPanelPrevHitbox.setAttribute('class', 'interativo');
  _vrPanelPrevHitbox.object3D.userData.isVRPanelPrevBtn = true;
  _vrPanelEntity.appendChild(_vrPanelPrevHitbox);

  _vrPanelNextHitbox = document.createElement('a-entity');
  _vrPanelNextHitbox.setAttribute('id', 'vrPanelNextHitbox');
  _vrPanelNextHitbox.setAttribute('class', 'interativo');
  _vrPanelNextHitbox.object3D.userData.isVRPanelNextBtn = true;
  _vrPanelEntity.appendChild(_vrPanelNextHitbox);

  _configurarHitbox(_vrPanelCloseHitbox, VR_BTN.fechar);
  _configurarHitbox(_vrPanelPrevHitbox, VR_BTN.anterior);
  _configurarHitbox(_vrPanelNextHitbox, VR_BTN.proxima);

  // Anterior/Proxima ficam inativos no modo recurso
  _setTrilhaHitboxesAtivo(false);
  
  // Atualizar textura com conteúdo inicial
  drawVRPanelCanvas('', '');
  updateVRPanelTexture();
  
  // Adicionar listeners diretamente nas geometrias (uma vez)
  _vrPanelBackground.addEventListener('click', function(event) {
    event.stopPropagation();
  });
  
  _vrPanelCloseHitbox.addEventListener('click', function(event) {
    event.stopPropagation();
    window.labmakerVRPanel.fechar();
  });

  _vrPanelPrevHitbox.addEventListener('click', function(event) {
    event.stopPropagation();
    if (_vrPanelMode === 'trilha' && window.labmakerTrilha) {
      window.labmakerTrilha.anterior();
    }
  });

  _vrPanelNextHitbox.addEventListener('click', function(event) {
    event.stopPropagation();
    if (_vrPanelMode === 'trilha' && window.labmakerTrilha) {
      window.labmakerTrilha.proxima();
    }
  });
  
  _vrPanelInitialized = true;
  return true;
}

// Fechar o painel
window.labmakerVRPanel = {
  abrir: function(titulo, descricao) {
    if (!window.labmakerMode || !window.labmakerMode.isVR()) {
      return;
    }
    
    if (!initVRPanel()) {
      console.error('Painel VR: inicialização falhou');
      return;
    }
    
    // Fechar painel anterior se estiver aberto
    if (_vrPanelIsOpen) {
      this.fechar();
    }
    
    var scene = document.getElementById('mainScene');
    if (!scene) return;
    
    // Garantir que o painel esteja na cena
    if (!_vrPanelEntity.parentNode) {
      scene.appendChild(_vrPanelEntity);
    }
    
    // Salvar dados atuais
    _vrPanelCurrentData = { titulo: titulo, descricao: descricao };
    _vrPanelMode = 'recurso';
    _setTrilhaHitboxesAtivo(false);

    // Desenhar no canvas
    drawVRPanelCanvas(titulo, descricao);
    updateVRPanelTexture();
    
    // Mostrar o painel
    _vrPanelEntity.setAttribute('visible', true);
    if (_vrPanelEntity.object3D) {
      _vrPanelEntity.object3D.visible = true;
    }
    
    // Posicionar a frente da camera
    this._positionPanel();
    
    _vrPanelIsOpen = true;
    
    // Atualizar raycaster
    if (window.labmakerMode) {
      window.labmakerMode.refreshInterativos();
    }
  },

  // Apresenta a Trilha de Aprendizagem no painel espacial (VR)
  abrirTrilha: function() {
    if (!window.labmakerMode || !window.labmakerMode.isVR()) {
      return;
    }

    if (!initVRPanel()) {
      console.error('Painel VR: inicialização falhou');
      return;
    }

    var scene = document.getElementById('mainScene');
    if (!scene) return;

    if (!_vrPanelEntity.parentNode) {
      scene.appendChild(_vrPanelEntity);
    }

    _vrPanelMode = 'trilha';
    _vrPanelCurrentData = null;
    _setTrilhaHitboxesAtivo(true);

    drawVRTrilhaCanvas();
    updateVRPanelTexture();

    _vrPanelEntity.setAttribute('visible', true);
    if (_vrPanelEntity.object3D) {
      _vrPanelEntity.object3D.visible = true;
    }

    this._positionPanel();

    _vrPanelIsOpen = true;

    if (window.labmakerMode) {
      window.labmakerMode.refreshInterativos();
    }
  },

  // Redesenha a Trilha mantendo o painel aberto
  atualizarTrilha: function() {
    if (_vrPanelMode !== 'trilha' || !_vrPanelIsOpen) return;
    drawVRTrilhaCanvas();
    updateVRPanelTexture();
  },
  
  fechar: function() {
    if (!_vrPanelEntity) return;
    
    // Apenas esconder, não remover da cena
    _vrPanelEntity.setAttribute('visible', false);
    if (_vrPanelEntity.object3D) {
      _vrPanelEntity.object3D.visible = false;
    }
    
    // Limpar estado
    _vrPanelIsOpen = false;
    _vrPanelCurrentData = null;
    _vrPanelMode = 'recurso';
    _setTrilhaHitboxesAtivo(false);
    
    // Atualizar raycaster
    if (window.labmakerMode) {
      window.labmakerMode.refreshInterativos();
    }
  },
  
  estaAberto: function() {
    return _vrPanelIsOpen;
  },
  
  _positionPanel: function() {
    if (!_vrPanelEntity) return;
    
    var camera = document.querySelector('a-camera');
    if (!camera) return;
    
    var cameraPosition = new THREE.Vector3();
    var cameraQuaternion = new THREE.Quaternion();
    var forward = new THREE.Vector3(0, 0, -1);
    
    camera.object3D.getWorldPosition(cameraPosition);
    camera.object3D.getWorldQuaternion(cameraQuaternion);
    forward.applyQuaternion(cameraQuaternion);
    
    _vrPanelEntity.object3D.position.copy(
      cameraPosition.clone().add(forward.multiplyScalar(VR_PANEL_DISTANCE))
    );
    _vrPanelEntity.object3D.quaternion.copy(cameraQuaternion);
  }
};


