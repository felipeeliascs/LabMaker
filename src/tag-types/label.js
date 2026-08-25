// LabelTag: texto flutuante nativo A-Frame
// Funções para criar e limpar tags do tipo 'label'

function criarLabelTag(el, tagData, handlers) {
  var texto = document.createElement('a-text');
  texto.setAttribute('value', tagData.text);
  texto.setAttribute('align', 'center');
  texto.setAttribute('width', '4');
  texto.setAttribute('color', '#ffffff');
  texto.setAttribute('position', '0 0.3 0');
  el.appendChild(texto);
}

function limparLabelTag(el) {
  // Remover filhos de texto se necessário no futuro
  var textos = el.querySelectorAll('a-text');
  textos.forEach(function(t) {
    if (t.parentNode) t.parentNode.removeChild(t);
  });
}

// Exportação para uso global
window.labmakerLabelTag = { criar: criarLabelTag, limpar: limparLabelTag };
