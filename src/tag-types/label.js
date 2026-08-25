// LabelTag: texto flutuante nativo A-Frame com visualização 3D
// Funções para criar e limpar tags do tipo 'label'

function criarLabelTag(el, tagData, handlers) {
  el.setAttribute('scale', '1 1 1');
  
  var circle = document.createElement('a-circle');
  circle.setAttribute('color', '#2196F3');
  circle.setAttribute('radius', '0.4');
  circle.setAttribute('side', 'double');
  circle.setAttribute('transparent', 'true');
  circle.setAttribute('opacity', '0.8');
  circle.setAttribute('position', '0 0 0');
  el.appendChild(circle);
  
  var texto = document.createElement('a-text');
  texto.setAttribute('value', tagData.text);
  texto.setAttribute('align', 'center');
  texto.setAttribute('width', '3');
  texto.setAttribute('color', '#ffffff');
  texto.setAttribute('position', '0 0.55 0');
  el.appendChild(texto);
  
  el.addEventListener('mouseenter', function() {
    el.setAttribute('scale', '1.3 1.3 1.3');
    circle.setAttribute('color', '#1976D2');
  });
  
  el.addEventListener('mouseleave', function() {
    el.setAttribute('scale', '1 1 1');
    circle.setAttribute('color', '#2196F3');
  });
  
  el.addEventListener('click', function() {
    if (handlers && handlers.onTagClick) {
      handlers.onTagClick(tagData);
    }
  });
}

function limparLabelTag(el) {
  var textos = el.querySelectorAll('a-text');
  textos.forEach(function(t) {
    if (t.parentNode) t.parentNode.removeChild(t);
  });
  var circulos = el.querySelectorAll('a-circle');
  circulos.forEach(function(c) {
    if (c.parentNode) c.parentNode.removeChild(c);
  });
}

window.labmakerLabelTag = { criar: criarLabelTag, limpar: limparLabelTag };
