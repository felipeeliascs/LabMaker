// Menu principal compartilhado entre a interface de tela e o painel espacial VR.
(function () {
  var button = document.getElementById('btnMenuPrincipal');
  var extras = document.getElementById('menuExtras');
  var scene = document.getElementById('mainScene');
  var sceneName = document.getElementById('nomeCena');
  var trailButton = document.getElementById('btnPercurso');
  var accessibilityButton = document.getElementById('btnAcessibilidade');
  if (!button || !extras || !scene) return;
  if (new URLSearchParams(window.location.search).get('dev') === '1') {
    document.body.classList.add('labmaker-dev-mode');
  }

  function atualizarCenaAtual() {
    var atual = window.cenaAtual;
    extras.querySelectorAll('#menuCenas button[data-scene-id]').forEach(function (item) {
      var selecionado = item.dataset.sceneId === atual;
      item.classList.toggle('is-current', selecionado);
      if (selecionado) item.setAttribute('aria-current', 'page');
      else item.removeAttribute('aria-current');
    });
  }

  function definirAberto(aberto) {
    extras.hidden = !aberto;
    document.body.classList.toggle('labmaker-menu-open', aberto);
    button.setAttribute('aria-expanded', String(aberto));
    button.setAttribute('aria-label', aberto ? 'Fechar menu principal' : 'Abrir menu principal');
    if (aberto) atualizarCenaAtual();
  }

  function irParaCena(id) {
    if (typeof labmakerScenes === 'undefined' || !labmakerScenes.some(function (cena) { return cena.id === id; })) return;
    definirAberto(false);
    if (window.labmakerMenuVR) window.labmakerMenuVR.close();
    if (typeof carregarCena === 'function') carregarCena(id);
  }

  function abrirAtividade(indice) {
    var atividade = window.trilhaAprendizagem && window.trilhaAprendizagem[indice];
    if (!atividade) return;
    definirAberto(false);
    if (window.labmakerMenuVR) window.labmakerMenuVR.close();
    if (typeof navegarParaAtividade === 'function') navegarParaAtividade(indice, false);
    if (typeof abrirAtividadeJogo === 'function') abrirAtividadeJogo(atividade);
  }

  function abrirAcessibilidade() {
    var sceneId = window.cenaAtual || 'antesala';
    window.open('acessibilidade.html?scene=' + encodeURIComponent(sceneId), '_blank', 'noopener,noreferrer');
    definirAberto(false);
    if (window.labmakerMenuVR) window.labmakerMenuVR.close();
  }

  button.addEventListener('click', function () {
    definirAberto(extras.hidden);
  });

  extras.addEventListener('click', function (event) {
    var cena = event.target.closest('#menuCenas button[data-scene-id]');
    if (cena) return irParaCena(cena.dataset.sceneId);
    var atividade = event.target.closest('.menu-activity-list button[data-activity-index]');
    if (atividade) abrirAtividade(Number(atividade.dataset.activityIndex));
  });

  if (accessibilityButton) accessibilityButton.addEventListener('click', abrirAcessibilidade);

  if (trailButton) trailButton.addEventListener('click', function () { definirAberto(false); });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && !extras.hidden) definirAberto(false);
  });
  scene.addEventListener('enter-vr', function () {
    definirAberto(false);
    button.hidden = true;
  });
  scene.addEventListener('exit-vr', function () { button.hidden = false; });
  if (sceneName) new MutationObserver(atualizarCenaAtual).observe(sceneName, { childList: true, characterData: true, subtree: true });

  window.labmakerMainMenu = {
    close: function () { definirAberto(false); },
    isOpen: function () { return !extras.hidden; },
    goToScene: irParaCena,
    openActivity: abrirAtividade,
    openAccessibility: abrirAcessibilidade
  };
})();
