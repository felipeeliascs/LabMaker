// Gerencia a criação e remoção de tags
var tagEntities = [];

// Converte coordenadas angulares (yaw/pitch) para posição e rotação 3D
// NOTA: Esta função será futuramente compartilhada com hotspots.js
// para evitar duplicação de código
function converterYawPitchParaTransform(view) {
  var radius = 4.5;
  var yawRad = view.yaw * Math.PI / 180;
  var pitchRad = view.pitch * Math.PI / 180;
  
  var x = radius * Math.cos(pitchRad) * Math.sin(yawRad);
  var y = 1.6 + radius * Math.sin(pitchRad);
  var z = -radius * Math.cos(pitchRad) * Math.cos(yawRad);
  
  var rotX = view.pitch;
  var rotY = -view.yaw;
  var rotZ = 0;
  
  return {
    position: { x: x, y: y, z: z },
    rotation: { x: rotX, y: rotY, z: rotZ }
  };
}

function criarTagElement(tag) {
  var el = document.createElement('a-entity');
  el.setAttribute('data-tag-id', tag.id);
  el.setAttribute('data-interactive-type', 'tag');
  return el;
}

function criarTags(cena, handlers) {
  limparTags();
  if (!cena.tags || cena.tags.length === 0) return;
  
  cena.tags.forEach(function(tag) {
    if (tag.type === 'label') {
      var el = criarTagElement(tag);
      
      // Posicionar baseado em view (yaw/pitch)
      var transform = converterYawPitchParaTransform(tag.view);
      el.setAttribute('position', transform.position);
      el.setAttribute('rotation', transform.rotation);
      
      // Criar container interno para conteúdo
      var contentEl = document.createElement('a-entity');
      contentEl.setAttribute('position', '0 0 0');
      el.appendChild(contentEl);
      
      // Criar conteúdo do tipo
      window.labmakerLabelTag.criar(contentEl, tag, handlers);
      
      document.getElementById('hotspotRoot').appendChild(el);
      tagEntities.push(el);
    }
  });
}

function limparTags() {
  tagEntities.forEach(function(el) {
    if (el.parentNode) {
      el.parentNode.removeChild(el);
    }
  });
  tagEntities = [];
}

// Exportação para uso global
window.labmakerTags = { criarTags: criarTags, limparTags: limparTags };
