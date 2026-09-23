// Mantém o viewport em device-width em telas pequenas: os jogos Blockly
// reescrevem o meta viewport ("width=725, initial-scale=.35") para encolher
// o layout. Desabilitamos isso para permitir rolagem horizontal da página
// inteira (toolbox, blocos, visualização, botões e textos juntos).
(function () {
  var TEMPLATE = 'width=device-width, initial-scale=1';

  function fixViewport() {
    var m = document.querySelector('meta[name="viewport"]');
    if (m && (m.getAttribute('content') || '') !== TEMPLATE) {
      m.setAttribute('content', TEMPLATE);
    }
  }

  fixViewport();
  if (typeof MutationObserver === 'function') {
    new MutationObserver(fixViewport).observe(
      document.querySelector('meta[name="viewport"]') || document.head,
      { attributes: true, attributeFilter: ['content'] });
  }
  setTimeout(fixViewport, 300);
  setTimeout(fixViewport, 1000);
})();