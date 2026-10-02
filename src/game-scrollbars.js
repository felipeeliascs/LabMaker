// Barras arrastáveis para o iframe de tamanho fixo no celular.
(function () {
  var panel = document.getElementById('painelJogo');
  var area = document.getElementById('jogoViewportArea');
  var viewport = document.getElementById('jogoViewport');
  var frame = document.getElementById('gameFrame');
  var horizontal = document.getElementById('jogoScrollX');
  var vertical = document.getElementById('jogoScrollY');
  if (!panel || !area || !viewport || !frame || !horizontal || !vertical) return;

  function celular() {
    return window.matchMedia('(pointer: coarse)').matches;
  }

  function atualizarBarra(track, eixo) {
    var horizontalAxis = eixo === 'x';
    var tamanhoVisivel = horizontalAxis ? viewport.clientWidth : viewport.clientHeight;
    var tamanhoTotal = horizontalAxis ? viewport.scrollWidth : viewport.scrollHeight;
    var maximo = Math.max(0, tamanhoTotal - tamanhoVisivel);
    track.hidden = !celular() || maximo < 2;
    if (track.hidden) return;

    var tamanhoTrack = horizontalAxis ? track.clientWidth : track.clientHeight;
    var tamanhoThumb = Math.min(tamanhoTrack, Math.max(48, tamanhoTrack * tamanhoVisivel / tamanhoTotal));
    var posicao = horizontalAxis ? viewport.scrollLeft : viewport.scrollTop;
    var deslocamento = (tamanhoTrack - tamanhoThumb) * posicao / maximo;
    var thumb = track.firstElementChild;
    thumb.style.width = horizontalAxis ? tamanhoThumb + 'px' : '100%';
    thumb.style.height = horizontalAxis ? '100%' : tamanhoThumb + 'px';
    thumb.style.transform = horizontalAxis ? 'translateX(' + deslocamento + 'px)' : 'translateY(' + deslocamento + 'px)';
    track.setAttribute('aria-valuemin', '0');
    track.setAttribute('aria-valuemax', String(Math.round(maximo)));
    track.setAttribute('aria-valuenow', String(Math.round(posicao)));
  }

  function atualizar() {
    if (panel.style.display !== 'flex') return;
    area.classList.toggle('has-vertical-scroll', celular() && viewport.scrollHeight - viewport.clientHeight >= 2);
    atualizarBarra(horizontal, 'x');
    atualizarBarra(vertical, 'y');
  }

  function agendarAtualizacao() {
    requestAnimationFrame(atualizar);
  }

  function ligarArraste(track, eixo) {
    var horizontalAxis = eixo === 'x';
    var pointerId = null;
    var deslocamentoNoThumb = 0;

    function mover(event) {
      var rect = track.getBoundingClientRect();
      var thumb = track.firstElementChild;
      var tamanhoTrack = horizontalAxis ? rect.width : rect.height;
      var tamanhoThumb = horizontalAxis ? thumb.offsetWidth : thumb.offsetHeight;
      var percurso = tamanhoTrack - tamanhoThumb;
      var coordenada = (horizontalAxis ? event.clientX - rect.left : event.clientY - rect.top) - deslocamentoNoThumb;
      var maximo = horizontalAxis ? viewport.scrollWidth - viewport.clientWidth : viewport.scrollHeight - viewport.clientHeight;
      var posicao = percurso > 0 ? Math.max(0, Math.min(1, coordenada / percurso)) * maximo : 0;
      if (horizontalAxis) viewport.scrollLeft = posicao;
      else viewport.scrollTop = posicao;
      atualizar();
    }

    track.addEventListener('pointerdown', function (event) {
      if (track.hidden) return;
      var thumb = track.firstElementChild;
      var thumbRect = thumb.getBoundingClientRect();
      deslocamentoNoThumb = thumb.contains(event.target)
        ? (horizontalAxis ? event.clientX - thumbRect.left : event.clientY - thumbRect.top)
        : (horizontalAxis ? thumbRect.width : thumbRect.height) / 2;
      pointerId = event.pointerId;
      track.setPointerCapture(pointerId);
      mover(event);
      event.preventDefault();
    });

    track.addEventListener('pointermove', function (event) {
      if (event.pointerId !== pointerId) return;
      mover(event);
      event.preventDefault();
    });

    function terminar(event) {
      if (event.pointerId !== pointerId) return;
      if (track.hasPointerCapture(pointerId)) track.releasePointerCapture(pointerId);
      pointerId = null;
    }
    track.addEventListener('pointerup', terminar);
    track.addEventListener('pointercancel', terminar);

    track.addEventListener('keydown', function (event) {
      var delta = 0;
      if (event.key === (horizontalAxis ? 'ArrowRight' : 'ArrowDown')) delta = 60;
      if (event.key === (horizontalAxis ? 'ArrowLeft' : 'ArrowUp')) delta = -60;
      if (event.key === 'PageDown') delta = 200;
      if (event.key === 'PageUp') delta = -200;
      if (event.key === 'Home') delta = -Infinity;
      if (event.key === 'End') delta = Infinity;
      if (!delta) return;
      if (horizontalAxis) viewport.scrollLeft += delta;
      else viewport.scrollTop += delta;
      event.preventDefault();
    });
  }

  ligarArraste(horizontal, 'x');
  ligarArraste(vertical, 'y');
  viewport.addEventListener('scroll', agendarAtualizacao, { passive: true });
  frame.addEventListener('load', agendarAtualizacao);
  window.addEventListener('resize', agendarAtualizacao);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', agendarAtualizacao);
  if (window.ResizeObserver) new ResizeObserver(agendarAtualizacao).observe(viewport);
  new MutationObserver(function () {
    if (panel.style.display === 'flex') {
      viewport.scrollLeft = 0;
      viewport.scrollTop = 0;
      agendarAtualizacao();
    }
  }).observe(panel, { attributes: true, attributeFilter: ['style'] });
})();
