// Gerencia a criação e remoção de tags
// NOTA: Tags possuem ciclo de vida associado à cena (criadas no carregamento, destruídas ao trocar de cena)
// Remoção explícita de listeners pode ser considerada em futuras versões
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
      
      var transform = converterYawPitchParaTransform(tag.view);
      el.setAttribute('position', transform.position);
      el.setAttribute('rotation', transform.rotation);
      
      window.labmakerLabelTag.criar(el, tag, handlers);
      
      document.getElementById('hotspotRoot').appendChild(el);
      tagEntities.push(el);
    }
    else if (tag.type === 'media') {
      var el = criarTagElement(tag);
      
      var transform = converterYawPitchParaTransform(tag.view);
      el.setAttribute('position', transform.position);
      el.setAttribute('rotation', transform.rotation);
      
      window.labmakerMediaTag.criar(el, tag, handlers);
      
      document.getElementById('hotspotRoot').appendChild(el);
      tagEntities.push(el);
    }
  });
}

function limparTags() {
  tagEntities.forEach(function(el) {
    if (el.parentNode) {
      var tagType = el.getAttribute('data-tag-id');
      if (el.querySelector('a-text') && el.querySelector('a-circle')) {
        // Verifica se é tag conhecida e chama limpeza específica
        if (el.getAttribute('data-interactive-type') === 'tag') {
          var tipo = null;
          // Determinar tipo baseado em atributos ou estrutura (simplificado)
          // Em versão futura, usar mapa de tipos
          if (el.querySelector('[color="#2196F3"]')) {
            window.labmakerLabelTag.limpar(el);
          } else if (el.querySelector('[color="#FF9800"]')) {
            window.labmakerMediaTag.limpar(el);
          }
        }
      }
      el.parentNode.removeChild(el);
    }
  });
  tagEntities = [];
}

// Exportação para uso global
window.labmakerTags = { 
  criarTags: criarTags, 
  limparTags: limparTags 
};
