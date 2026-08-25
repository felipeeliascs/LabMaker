// MediaTag: ícone laranja + texto → abre painel HTML
// Funções para criar e limpar tags do tipo 'media'
// NOTA: Pode ser refatorado em abstração futura para compartilhar lógica com LabelTag

function criarMediaTag(el, tagData, handlers) {
  el.setAttribute('scale', '1 1 1');
  
  var circle = document.createElement('a-circle');
  circle.setAttribute('color', '#FF9800');
  circle.setAttribute('radius', '0.4');
  circle.setAttribute('side', 'double');
  circle.setAttribute('transparent', 'true');
  circle.setAttribute('opacity', '0.8');
  circle.setAttribute('position', '0 0 0');
  el.appendChild(circle);
  
  var texto = document.createElement('a-text');
  texto.setAttribute('value', tagData.content.title);
  texto.setAttribute('align', 'center');
  texto.setAttribute('width', '3');
  texto.setAttribute('color', '#ffffff');
  texto.setAttribute('position', '0 0.55 0');
  el.appendChild(texto);
  
  el.addEventListener('mouseenter', function() {
    el.setAttribute('scale', '1.1 1.1 1.1');
    circle.setAttribute('color', '#F57C00');
  });
  
  el.addEventListener('mouseleave', function() {
    el.setAttribute('scale', '1 1 1');
    circle.setAttribute('color', '#FF9800');
  });
  
  el.addEventListener('click', function() {
    if (handlers && handlers.abrirRecurso) {
      handlers.abrirRecurso(tagData);
    }
  });
}

function limparMediaTag(el) {
  var textos = el.querySelectorAll('a-text');
  textos.forEach(function(t) {
    if (t.parentNode) t.parentNode.removeChild(t);
  });
  var circulos = el.querySelectorAll('a-circle');
  circulos.forEach(function(c) {
    if (c.parentNode) c.parentNode.removeChild(c);
  });
}

window.labmakerMediaTag = { criar: criarMediaTag, limpar: limparMediaTag };
