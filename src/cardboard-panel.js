// Painel educativo dedicado: não modifica o tema dos outros recursos.
(function () {
  var panel = document.getElementById('cardboardPanel');
  var scroll = document.getElementById('cardboardScroll');
  var closeButton = document.getElementById('cardboardClose');
  var playButton = document.getElementById('cardboardPlay');
  var videoWrap = document.getElementById('cardboardVideoWrap');
  var video = document.getElementById('cardboardVideo');
  if (!panel) return;
  var previousFocus = null;
  var inertElements = [];
  var openRequest = 0;

  function close() {
    openRequest++;
    video.src = 'about:blank';
    videoWrap.hidden = true;
    playButton.hidden = false;
    if (panel.hidden) return;
    panel.hidden = true;
    document.body.classList.remove('cardboard-open');
    inertElements.forEach(function (el) { el.inert = false; });
    inertElements = [];
    if (previousFocus && previousFocus.isConnected) previousFocus.focus();
    previousFocus = null;
  }

  async function open() {
    fecharRecurso();
    fecharPainelPercurso();
    if (window.labmakerToolPanel) window.labmakerToolPanel.close();
    if (window.labmakerMainMenu) window.labmakerMainMenu.close();
    if (window.labmakerMenuVR) window.labmakerMenuVR.close();
    var request = ++openRequest;
    // Vídeo e impressão precisam da tela do celular, como as atividades do tour.
    if (window.labmakerMode && window.labmakerMode.isVR()) {
      try { await document.getElementById('mainScene').exitVR(); }
      catch (error) {
        if (request === openRequest && window.labmakerVRPanel) {
          window.labmakerVRPanel.abrir('GOOGLE CARDBOARD', 'Retire o visor e volte ao modo Tela para ver o tutorial ilustrado, assistir ao vídeo e abrir o molde para imprimir.');
        }
        return;
      }
    }
    if (request !== openRequest) return;
    previousFocus = document.activeElement !== document.body ? document.activeElement : document.getElementById('btnMenuPrincipal');
    inertElements = Array.from(document.body.children).filter(function (el) {
      return el !== panel && el.tagName !== 'SCRIPT' && !el.inert;
    });
    inertElements.forEach(function (el) { el.inert = true; });
    panel.hidden = false;
    document.body.classList.add('cardboard-open');
    scroll.scrollTop = 0;
    closeButton.focus();
  }

  playButton.addEventListener('click', function () {
    videoWrap.hidden = false;
    video.src = 'https://www.youtube-nocookie.com/embed/6He2Ff2s3A4?rel=0';
    playButton.hidden = true;
    video.focus();
  });
  closeButton.addEventListener('click', close);
  panel.addEventListener('click', function (event) { if (event.target === panel) close(); });
  document.addEventListener('keydown', function (event) {
    if (panel.hidden) return;
    if (event.key === 'Escape') { event.preventDefault(); close(); return; }
    if (event.key !== 'Tab') return;
    var focusables = Array.from(panel.querySelectorAll('button, a[href], iframe, [tabindex="0"]')).filter(function (el) { return !el.closest('[hidden]'); });
    var first = focusables[0], last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  window.labmakerCardboard = { open: open, close: close };
})();
