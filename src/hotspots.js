// Gerencia a criação e remoção de hotspots de navegação e recurso
var hotspotEntities = [];

// Hotspots das atividades da Trilha de Aprendizagem (jogoId -> entidade)
var gameHotspotEntities = {};

// Entidade atualmente destacada pela Trilha de Aprendizagem
var hotspotDestacado = null;

// Registry de layout persistente
const HOTSPOT_STORAGE_KEY = 'labmaker.hotspot-layout.v1';

function getSavedLayout() {
  try {
    const data = localStorage.getItem(HOTSPOT_STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch (e) { console.warn('Erro ao carregar layout', e); }
  return null;
}

function getHotspotPosition(sceneId, hotspotId, defaultView) {
  const layout = getSavedLayout();
  if (layout && layout.scenes && layout.scenes[sceneId] && layout.scenes[sceneId][hotspotId]) {
    return layout.scenes[sceneId][hotspotId];
  }
  return { yaw: defaultView.yaw || 0, pitch: defaultView.pitch || 0, radius: defaultView.radius || 4.5 };
}

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
  var radius = view.radius || 4.5;
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

// Configura uma entidade A-Frame como hotspot e associa metadados
function configurarEntidadeHotspot(el, sceneId, hotspotId, view) {
  el.dataset.hotspotId = hotspotId;
  el.dataset.sceneId = sceneId;
  el.dataset.yaw = view.yaw;
  el.dataset.pitch = view.pitch;
  el.dataset.radius = view.radius || 4.5;

  const transform = converterYawPitchParaTransform(view);
  el.setAttribute('position', transform.position);
  el.setAttribute('rotation', transform.rotation);
}

function obterProporcaoHotspot(hotspot) {
  if (hotspot.proporcao !== undefined && 
      typeof hotspot.proporcao === 'number' && 
      hotspot.proporcao > 0) {
    return hotspot.proporcao;
  }
  return 1;
}

// Tipos visuais inspirados na organização de tags do ThingLink. Os tipos são
// opcionais: recursos legados sem `tipo` continuam sendo classificados como
// conteúdo de texto.
var TIPOS_HOTSPOT = {
  navegacao: { chave: 'navegacao', rotulo: 'NAVEGAÇÃO', cor: '#2563EB', fundo: '#102A54', icone: 'porta' },
  texto: { chave: 'texto', rotulo: 'TEXTO', cor: '#B45309', fundo: '#3B260C', icone: 'livro' },
  imagem: { chave: 'imagem', rotulo: 'IMAGEM', cor: '#7E22CE', fundo: '#2E0D52', icone: 'galeria' },
  video: { chave: 'video', rotulo: 'VÍDEO', cor: '#BE123C', fundo: '#4C061D', icone: 'claquete' },
  iframe: { chave: 'iframe', rotulo: 'FERRAMENTA INTERATIVA', cor: '#0F766E', fundo: '#073B36', icone: 'painel' },
  misto: { chave: 'misto', rotulo: 'TEXTO E MÍDIA', cor: '#A21CAF', fundo: '#40074C', icone: 'camadas' },
  etiqueta: { chave: 'etiqueta', rotulo: 'ETIQUETA', cor: '#475569', fundo: '#1E293B', icone: 'etiqueta' },
  pergunta: { chave: 'pergunta', rotulo: 'PERGUNTA', cor: '#6D28D9', fundo: '#2E1065', icone: 'ajuda' },
  enquete: { chave: 'enquete', rotulo: 'ENQUETE', cor: '#BE185D', fundo: '#500724', icone: 'grafico' },
  atividade: { chave: 'atividade', rotulo: 'ATIVIDADE', cor: '#15803D', fundo: '#10321A', icone: 'controle' },
  explorar: { chave: 'explorar', rotulo: 'EXPLORAR', cor: '#0E7490', fundo: '#083344', icone: 'painel' },
  simulador: { chave: 'simulador', rotulo: 'ATIVIDADE', cor: '#155E75', fundo: '#083344', icone: 'cubo' }
};

var ALIASES_TIPO_HOTSPOT = {
  'texto-e-midia': 'misto',
  'texto_midia': 'misto',
  media: 'misto',
  embed: 'iframe',
  incorporado: 'iframe',
  transicao: 'navegacao',
  label: 'etiqueta',
  rotulo: 'etiqueta',
  jogo: 'atividade',
  game: 'atividade',
  '3d': 'simulador'
};

function obterTipoHotspot(dados, tipoPadrao) {
  var tipo = dados && (dados.tipo || dados.type) || tipoPadrao;
  tipo = String(tipo || 'texto').toLowerCase()
    .replace(/[áàâã]/g, 'a')
    .replace(/[éê]/g, 'e')
    .replace(/[í]/g, 'i')
    .replace(/[óôõ]/g, 'o')
    .replace(/[ú]/g, 'u')
    .replace(/\s+/g, '-');
  tipo = ALIASES_TIPO_HOTSPOT[tipo] || tipo;
  var estilo = TIPOS_HOTSPOT[tipo] || TIPOS_HOTSPOT[tipoPadrao] || TIPOS_HOTSPOT.texto;
  // A cor individual também identifica o anel e a borda do popup, sem alterar o tipo global.
  return dados && dados.cor ? Object.assign({}, estilo, { cor: dados.cor }) : estilo;
}

// Os desenhos mudam; o círculo, o anel, as cores e os eventos são preservados.
var ICONES_ATIVIDADE = {
  blocos: '#hotspotIconBlocos',
  labirinto: '#hotspotIconLabirinto',
  drone: '#hotspotIconDrone',
  geobot: '#hotspotIconGeobot',
  dancebot: '#hotspotIconDancebot',
  djbot: '#hotspotIconDjbot',
  treinamento: '#hotspotIconTreinamento',
  torneio: '#hotspotIconTorneio'
};

// Alguns WebGL móveis perdem a textura SVG ao entrar no VR.
// O canvas mantém uma fonte de pixels estável para a troca de modo.
var TEXTURAS_ICONES_HOTSPOT = {};
function obterTexturaIconeHotspot(iconeSvg) {
  if (TEXTURAS_ICONES_HOTSPOT[iconeSvg]) return TEXTURAS_ICONES_HOTSPOT[iconeSvg];

  var imagemSvg = document.querySelector(iconeSvg);
  var assets = document.querySelector('a-assets');
  if (!imagemSvg || !assets) return iconeSvg;

  var canvas = document.createElement('canvas');
  canvas.id = imagemSvg.id.replace('hotspotIcon', 'hotspotTexture');
  canvas.width = 256;
  canvas.height = 256;
  assets.appendChild(canvas);

  function desenharIcone() {
    if (!imagemSvg.naturalWidth) return;
    var contexto = canvas.getContext('2d');
    if (!contexto) return;
    contexto.clearRect(0, 0, canvas.width, canvas.height);
    contexto.drawImage(imagemSvg, 0, 0, canvas.width, canvas.height);
    document.querySelectorAll('a-image[src="#' + canvas.id + '"]').forEach(function (icone) {
      var mesh = icone.getObject3D('mesh');
      if (mesh && mesh.material.map) mesh.material.map.needsUpdate = true;
    });
  }

  if (imagemSvg.complete && imagemSvg.naturalWidth) desenharIcone();
  else imagemSvg.addEventListener('load', desenharIcone, { once: true });

  TEXTURAS_ICONES_HOTSPOT[iconeSvg] = '#' + canvas.id;
  return TEXTURAS_ICONES_HOTSPOT[iconeSvg];
}

function criarIconeHotspot(tipo, iconeId) {
  var grupo = document.createElement('a-entity');
  grupo.setAttribute('position', { x: 0, y: 0, z: 0.05 });

  var imagem = document.createElement('a-image');
  var iconePadrao = tipo.icone === 'porta' ? '#hotspotIconPortal' :
    tipo.icone === 'cubo' ? '#hotspotIconSimulador' : '#hotspotIconInfo';
  imagem.setAttribute('src', obterTexturaIconeHotspot(iconeId || iconePadrao));
  imagem.setAttribute('width', 0.198);
  imagem.setAttribute('height', 0.198);
  imagem.setAttribute('material', { shader: 'flat', transparent: true, side: 'double' });
  grupo.appendChild(imagem);
  return grupo;
}

function criarBaseHotspot(el, tipo, opacidade, iconeId) {
  el.dataset.hotspotTipo = tipo.chave;
  el.setAttribute('aria-label', tipo.rotulo);

  var circle = document.createElement('a-entity');
  circle.setAttribute('geometry', { primitive: 'circle', radius: 0.20 });
  circle.setAttribute('material', { color: tipo.cor, side: 'double', shader: 'flat', opacity: opacidade || 0.9, transparent: true });
  circle.setAttribute('class', 'interativo');
  el.appendChild(circle);

  var ring = document.createElement('a-entity');
  ring.setAttribute('geometry', { primitive: 'ring', radiusInner: 0.22, radiusOuter: 0.26 });
  ring.setAttribute('material', { color: tipo.cor, side: 'double', shader: 'flat', opacity: 0.9, transparent: true });
  ring.setAttribute('position', { x: 0, y: 0, z: 0.002 });
  el.appendChild(ring);

  el.appendChild(criarIconeHotspot(tipo, iconeId));
  return circle;
}

function criarTextoPopupTipo(tipo, titulo, detalhe) {
  var linhas = [tipo.rotulo, titulo || ''];
  if (detalhe) linhas.push(detalhe);
  return linhas.join('\n');
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
    ctx.fillText(linha, largura / 2, yInicial + index * linhaAltura, largura - 24);
  });
  
  return canvas.toDataURL('image/png');
}

// Em tela, há somente um card HTML ativo. No VR, o título continua sendo
// desenhado como textura para aparecer dentro do headset.
var popupHtml = null;
var hotspotComPopupHtml = null;
var frameAtualizacaoPopupHtml = null;
var popupVREmExibicao = null;
var listenerModoPopupInicializado = false;

function estaNoModoVR() {
  return typeof window !== 'undefined' &&
    window.labmakerMode &&
    typeof window.labmakerMode.isVR === 'function' &&
    window.labmakerMode.isVR();
}

function obterPopupHtml() {
  if (popupHtml || !document.body) return popupHtml;

  popupHtml = document.createElement('div');
  popupHtml.id = 'hotspotTooltip';
  popupHtml.setAttribute('role', 'tooltip');
  popupHtml.setAttribute('aria-hidden', 'true');
  popupHtml.style.cssText = [
    'position:fixed',
    'display:none',
    'z-index:12',
    'max-width:min(320px, calc(100vw - 24px))',
    'padding:12px 16px',
    'box-sizing:border-box',
    'border-left:4px solid #2196F3',
    'border-radius:10px',
    'background:rgba(18, 20, 28, 0.94)',
    'box-shadow:0 10px 24px rgba(0, 0, 0, 0.28)',
    'color:#FFFFFF',
    'font:600 15px/1.35 Arial, Helvetica, sans-serif',
    'white-space:pre-line',
    'pointer-events:none',
    'user-select:none',
    'transform:translateY(-50%)'
  ].join(';');
  document.body.appendChild(popupHtml);
  return popupHtml;
}

function ocultarPopupHtml(hotspot) {
  if (hotspot && hotspotComPopupHtml !== hotspot) return;

  hotspotComPopupHtml = null;
  if (frameAtualizacaoPopupHtml && typeof cancelAnimationFrame === 'function') {
    cancelAnimationFrame(frameAtualizacaoPopupHtml);
  }
  frameAtualizacaoPopupHtml = null;

  if (popupHtml) {
    popupHtml.style.display = 'none';
    popupHtml.setAttribute('aria-hidden', 'true');
  }
}

function ocultarPopupVR() {
  if (popupVREmExibicao) {
    popupVREmExibicao.setAttribute('visible', false);
  }
  popupVREmExibicao = null;
}

function posicionarPopupHtml() {
  if (!popupHtml || !hotspotComPopupHtml || typeof THREE === 'undefined') return;

  var hotspot = hotspotComPopupHtml;
  var cena = hotspot.sceneEl || document.getElementById('mainScene');
  if (!cena || !cena.camera || !cena.canvas || !hotspot.object3D ||
      typeof hotspot.object3D.getWorldPosition !== 'function') return;

  var posicaoMundo = new THREE.Vector3();
  hotspot.object3D.getWorldPosition(posicaoMundo);

  var direcaoCamera = new THREE.Vector3();
  cena.camera.getWorldDirection(direcaoCamera);
  var direcaoHotspot = posicaoMundo.clone().sub(cena.camera.position);
  if (direcaoCamera.dot(direcaoHotspot) <= 0) {
    popupHtml.style.display = 'none';
    return;
  }

  posicaoMundo.project(cena.camera);
  if (posicaoMundo.x < -1 || posicaoMundo.x > 1 ||
      posicaoMundo.y < -1 || posicaoMundo.y > 1 ||
      posicaoMundo.z < -1 || posicaoMundo.z > 1) {
    popupHtml.style.display = 'none';
    return;
  }

  var retanguloCanvas = cena.canvas.getBoundingClientRect();
  var x = retanguloCanvas.left + (posicaoMundo.x + 1) * retanguloCanvas.width / 2;
  var y = retanguloCanvas.top + (-posicaoMundo.y + 1) * retanguloCanvas.height / 2;
  var largura = popupHtml.offsetWidth || 260;
  var altura = popupHtml.offsetHeight || 54;
  var esquerda = x + 18;
  var topo = y;

  if (esquerda + largura > window.innerWidth - 12) {
    esquerda = x - largura - 18;
  }
  esquerda = Math.max(12, Math.min(esquerda, window.innerWidth - largura - 12));
  topo = Math.max(12 + altura / 2, Math.min(topo, window.innerHeight - 12 - altura / 2));

  popupHtml.style.left = esquerda + 'px';
  popupHtml.style.top = topo + 'px';
  popupHtml.style.display = 'block';
}

function atualizarPopupHtml() {
  frameAtualizacaoPopupHtml = null;
  if (!hotspotComPopupHtml || estaNoModoVR()) {
    ocultarPopupHtml();
    return;
  }

  posicionarPopupHtml();
  if (typeof requestAnimationFrame === 'function') {
    frameAtualizacaoPopupHtml = requestAnimationFrame(atualizarPopupHtml);
  }
}

function exibirPopupHtml(hotspot, texto, opcoes) {
  var popup = obterPopupHtml();
  if (!popup) return;

  popup.textContent = texto;
  popup.style.borderLeftColor = opcoes.corBorda || '#2196F3';
  popup.style.display = 'block';
  popup.setAttribute('aria-hidden', 'false');
  hotspotComPopupHtml = hotspot;

  if (frameAtualizacaoPopupHtml && typeof cancelAnimationFrame === 'function') {
    cancelAnimationFrame(frameAtualizacaoPopupHtml);
  }
  atualizarPopupHtml();
}

function prepararPopupVR(popup, texto, opcoes) {
  if (popup.dataset.conteudoPronto === 'true') return;
  popup.dataset.conteudoPronto = 'true';

  var fundo = document.createElement('a-entity');
  fundo.setAttribute('geometry', {
    primitive: 'plane',
    width: opcoes.fundoLargura || 1.7,
    height: opcoes.fundoAltura || 0.46
  });
  fundo.setAttribute('material', {
    color: opcoes.corFundo || '#111111',
    shader: 'flat',
    side: 'double',
    opacity: opcoes.opacidadeFundo || 0.78,
    transparent: true
  });
  fundo.setAttribute('position', { x: 0, y: 0, z: -0.001 });
  popup.appendChild(fundo);

  var texturaLabel = criarTexturaLabel(texto, {
    largura: opcoes.larguraCanvas || LABEL_LARGURA_CANVAS,
    altura: opcoes.alturaCanvas || LABEL_ALTURA_CANVAS
  });
  var label = document.createElement('a-image');
  label.setAttribute('src', texturaLabel);
  label.setAttribute('width', opcoes.largura || LABEL_WIDTH_AFRAME);
  label.setAttribute('height', opcoes.altura || LABEL_HEIGHT_AFRAME);
  label.setAttribute('position', { x: 0, y: 0, z: 0.002 });
  popup.appendChild(label);
}

function inicializarListenerModoPopup() {
  if (listenerModoPopupInicializado) return;

  var cena = document.getElementById('mainScene');
  if (!cena) return;

  listenerModoPopupInicializado = true;
  function ocultarPopupsAoMudarModo() {
    ocultarPopupHtml();
    ocultarPopupVR();
  }
  cena.addEventListener('enter-vr', ocultarPopupsAoMudarModo);
  cena.addEventListener('exit-vr', ocultarPopupsAoMudarModo);
}

// Cria os dois formatos de título: card HTML na tela e textura espacial no VR.
// O alvo do raycaster é o círculo, por isso os eventos ficam nele.
function criarPopupHotspot(el, alvoInterativo, texto, opcoes) {
  opcoes = opcoes || {};
  inicializarListenerModoPopup();

  var popupVR = document.createElement('a-entity');
  popupVR.setAttribute('class', 'hotspot-popup-vr');
  popupVR.setAttribute('visible', false);
  popupVR.setAttribute('position', opcoes.position || { x: 0, y: -0.35, z: 0.004 });
  el.appendChild(popupVR);

  alvoInterativo.addEventListener('mouseenter', function () {
    if (estaNoModoVR()) {
      ocultarPopupHtml();
      ocultarPopupVR();
      prepararPopupVR(popupVR, texto, opcoes);
      popupVR.setAttribute('visible', true);
      popupVREmExibicao = popupVR;
      return;
    }

    ocultarPopupVR();
    exibirPopupHtml(el, texto, opcoes);
  });
  alvoInterativo.addEventListener('mouseleave', function () {
    popupVR.setAttribute('visible', false);
    if (popupVREmExibicao === popupVR) popupVREmExibicao = null;
    ocultarPopupHtml(el);
  });

  return popupVR;
}

function limparHotspots() {
  ocultarPopupHtml();
  ocultarPopupVR();
  hotspotEntities.forEach(function (el) {
    if (el.parentNode) {
      el.parentNode.removeChild(el);
    }
  });
  hotspotEntities = [];
  gameHotspotEntities = {};
  hotspotDestacado = null;
}

function criarHotspotsNavegacao(cena, aoClicar) {
  cena.navigationHotspots.forEach(function (h, index) {
    var el = document.createElement('a-entity');
    var tipo = obterTipoHotspot(h, 'navegacao');
    var id = 'nav-' + h.target;
    // Evita IDs duplicados se houver mais de um hotspot para o mesmo destino
    if (cena.navigationHotspots.filter(x => x.target === h.target).length > 1) {
      id += '-' + index;
    }

    var view = getHotspotPosition(cena.id, id, h.view || {});
    configurarEntidadeHotspot(el, cena.id, id, view);
    el.setAttribute('class', 'clickable');

    var circle = criarBaseHotspot(el, tipo, 0.92, h.icone);

    criarPopupHotspot(el, circle, criarTextoPopupTipo(tipo, h.label), {
      corFundo: tipo.fundo,
      corBorda: tipo.cor
    });

    var proporcao = obterProporcaoHotspot(h);
    el.setAttribute('scale', { x: proporcao, y: proporcao, z: proporcao });

    el.addEventListener('click', function (e) {
      if (el._wasDragged) {
        el._wasDragged = false;
        return;
      }
      aoClicar(h.target);
    });

    document.querySelector('#hotspotRoot').appendChild(el);
    hotspotEntities.push(el);
  });
}

function criarHotspotsRecurso(cena, aoAbrir) {
  if (!cena.resourceHotspots || cena.resourceHotspots.length === 0) return;

  cena.resourceHotspots.forEach(function (r) {
    // Tipos aceitos: texto, imagem, video, iframe, misto, etiqueta,
    // pergunta e enquete. Sem `tipo`, preserva o hotspot de texto legado.
    var el = document.createElement('a-entity');
    var tipo = obterTipoHotspot(r, 'texto');
    var id = 'res-' + r.label.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    var view = getHotspotPosition(cena.id, id, r.view || {});
    configurarEntidadeHotspot(el, cena.id, id, view);
    el.setAttribute('class', 'clickable');

    var circle = criarBaseHotspot(el, tipo, 0.9, r.icone);

    criarPopupHotspot(el, circle, criarTextoPopupTipo(tipo, r.label), {
      corFundo: tipo.fundo,
      corBorda: tipo.cor
    });

    var proporcao = obterProporcaoHotspot(r);
    el.setAttribute('scale', { x: proporcao, y: proporcao, z: proporcao });

    // Etiquetas servem apenas para identificar elementos da cena no hover.
    if (tipo.chave !== 'etiqueta') {
      el.addEventListener('click', function (e) {
        if (el._wasDragged) {
          el._wasDragged = false;
          return;
        }
        aoAbrir(r.titulo, r.descricao, r);
      });
    }

    document.querySelector('#hotspotRoot').appendChild(el);
    hotspotEntities.push(el);
  });
}

// Um hotspot por grupo; as ferramentas e URLs vivem no ToolRegistry.
function criarHotspotsFerramentas(cena, aoAbrir) {
  (cena.toolHotspots || []).forEach(function (group) {
    var el = document.createElement('a-entity');
    var tipo = TIPOS_HOTSPOT.explorar;
    var id = 'tool-' + group.id;
    var view = getHotspotPosition(cena.id, id, group.view || {});
    configurarEntidadeHotspot(el, cena.id, id, view);
    el.setAttribute('class', 'clickable');
    var circle = criarBaseHotspot(el, tipo, 0.9);
    criarPopupHotspot(el, circle, criarTextoPopupTipo(tipo, group.label), {
      corFundo: tipo.fundo, corBorda: tipo.cor
    });
    el.addEventListener('click', function () {
      if (el._wasDragged) { el._wasDragged = false; return; }
      aoAbrir(group);
    });
    document.querySelector('#hotspotRoot').appendChild(el);
    hotspotEntities.push(el);
  });
}

// Tamanho de canvas para rótulos de duas linhas (nome do jogo + sinalização)
var LABEL_JOGO_LARGURA = 512;
var LABEL_JOGO_ALTURA = 256;

// Cria um hotspot de atividade (jogo ou simulador) com o mesmo visual.
// item: { id, titulo, view } | sinalizacao: texto da 2a linha do rótulo |
// comDestaque: adiciona o anel amarelo usado pela Trilha.
function criarHotspotAtividade(cenaId, item, sinalizacao, aoAbrir, comDestaque) {
  var el = document.createElement('a-entity');
  var tipo = obterTipoHotspot(item, comDestaque ? 'atividade' : 'simulador');
  var id = (item.id.indexOf('simulador') === 0 ? 'sim-' : 'game-') + item.id;
  var view = getHotspotPosition(cenaId, id, item.view || {});
  configurarEntidadeHotspot(el, cenaId, id, view);
  el.setAttribute('class', 'clickable');
  el.setAttribute('data-atividade-id', item.id);

  var iconeId = comDestaque ? ICONES_ATIVIDADE[item.id] : '#hotspotIconSimulador';
  var circle = criarBaseHotspot(el, tipo, 0.9, iconeId);

  // Anel de destaque (oculto até a atividade ser destacada pela trilha)
  if (comDestaque) {
    var destaque = document.createElement('a-entity');
    destaque.setAttribute('geometry', { primitive: 'ring', radiusInner: 0.28, radiusOuter: 0.34 });
    destaque.setAttribute('material', { color: '#FFEB3B', side: 'double', shader: 'flat', opacity: 0.95, transparent: true });
    destaque.setAttribute('position', { x: 0, y: 0, z: 0.003 });
    destaque.setAttribute('visible', false);
    destaque.setAttribute('class', 'destaque-atividade');
    el.appendChild(destaque);
  }

  criarPopupHotspot(el, circle, criarTextoPopupTipo(tipo, item.titulo, sinalizacao), {
    position: { x: 0, y: -0.45, z: 0.004 },
    larguraCanvas: LABEL_JOGO_LARGURA,
    alturaCanvas: LABEL_JOGO_ALTURA,
    largura: 1.6,
    altura: 0.8,
    fundoLargura: 1.7,
    fundoAltura: 0.86,
    corFundo: tipo.fundo,
    corBorda: tipo.cor
  });

  el.addEventListener('click', function (e) {
    if (el._wasDragged) {
      el._wasDragged = false;
      return;
    }
    aoAbrir();
  });

  document.querySelector('#hotspotRoot').appendChild(el);
  hotspotEntities.push(el);
  return el;
}

// Cria os hotspots das atividades da Trilha presentes na cena.
// Todos ficam disponíveis desde o início (sem bloqueios).
function criarHotspotsJogo(cena, aoAbrirAtividade) {
  if (typeof getAtividadesDaCena !== 'function') return;

  var atividades = getAtividadesDaCena(cena.id);
  if (!atividades || atividades.length === 0) return;

  atividades.forEach(function (atividade) {
    var el = criarHotspotAtividade(
      cena.id,
      { id: atividade.jogoId, titulo: atividade.titulo, tipo: atividade.tipo, view: atividade.view },
      'Trilha ' + atividade.ordem + '/' + getTotalEtapas(),
      function () { aoAbrirAtividade(atividade); },
      true
    );
    gameHotspotEntities[atividade.jogoId] = el;
  });
}

// Cria os hotspots de simuladores da cena (recursos extras, fora da trilha).
function criarHotspotsSimulador(cena, aoAbrir) {
  if (!cena.simulatorHotspots || cena.simulatorHotspots.length === 0) return;

  cena.simulatorHotspots.forEach(function (sim) {
    var el = criarHotspotAtividade(
      cena.id,
      { id: sim.id, titulo: sim.titulo, tipo: sim.tipo, view: sim.view },
      sim.label || 'Simulador 3D',
      function () { aoAbrir(sim); },
      false
    );
    gameHotspotEntities[sim.id] = el;
  });
}

// Remove o destaque visual de qualquer hotspot de atividade
function limparDestaqueHotspots() {
  var destaques = document.querySelectorAll('.destaque-atividade');
  for (var i = 0; i < destaques.length; i++) {
    destaques[i].setAttribute('visible', false);
  }
  if (hotspotDestacado) {
    hotspotDestacado.removeAttribute('animation');
    hotspotDestacado.setAttribute('scale', '1 1 1');
    hotspotDestacado = null;
  }
}

// Destaca visualmente o hotspot da atividade indicada (pulsação + anel amarelo)
function destacarHotspotJogo(jogoId) {
  limparDestaqueHotspots();

  var el = gameHotspotEntities[jogoId];
  if (!el) return;

  hotspotDestacado = el;

  var destaque = el.querySelector('.destaque-atividade');
  if (destaque) {
    destaque.setAttribute('visible', true);
  }

  el.setAttribute('animation', {
    property: 'scale',
    to: '1.35 1.35 1.35',
    dir: 'alternate',
    dur: 700,
    loop: true,
    easing: 'easeInOutSine'
  });
}
