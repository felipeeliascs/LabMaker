(function () {
  var tamanho = 18;
  var contraste = document.getElementById('altoContraste');
  document.getElementById('textoMenor').addEventListener('click', function () {
    tamanho = Math.max(16, tamanho - 2);
    document.documentElement.style.fontSize = tamanho + 'px';
  });
  document.getElementById('textoMaior').addEventListener('click', function () {
    tamanho = Math.min(28, tamanho + 2);
    document.documentElement.style.fontSize = tamanho + 'px';
  });
  contraste.addEventListener('click', function () {
    var ativo = document.body.classList.toggle('high-contrast');
    contraste.setAttribute('aria-pressed', String(ativo));
  });

  var sceneId = new URLSearchParams(location.search).get('scene');
  if (['antesala', 'hub', 'programacao', 'eletronica', 'fabricacao', 'arena', 'ciencias', 'ia'].includes(sceneId)) {
    document.getElementById('voltarTour').href = 'index.html?scene=' + encodeURIComponent(sceneId);
  }
})();
