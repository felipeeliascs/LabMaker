
// Ajusta os links gerados pelo menu compilado (index/generated) para os novos
// nomes de páginas HTML. Não altera a lógica original: apenas reescreve hrefs.
(function () {
  var mapa = {
    'puzzle.html': 'blocos.html',
    'maze.html': 'labirinto.html',
    'bird.html': 'drone.html',
    'turtle.html': 'geobot.html',
    'movie.html': 'dancebot.html',
    'music.html': 'djbot.html',
    'pond-tutor.html': 'treinamento.html',
    'pond-duck.html': 'torneio.html'
  };

  var XLINK = 'http://www.w3.org/1999/xlink';

  function corrigir() {
    var links = document.querySelectorAll('a');
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      var href = a.getAttribute('href') ||
                 a.getAttributeNS(XLINK, 'href');
      if (!href) continue;

      var base = href.split('?')[0];
      if (mapa[base]) {
        var novo = href.replace(base, mapa[base]);
        a.setAttribute('href', novo);
        a.setAttributeNS(XLINK, 'xlink:href', novo);
      }
    }
  }

  // O menu é injetado via innerHTML no evento load; observamos o body para
  // corrigir os links assim que aparecerem e desligamos o observer depois.
  function iniciar() {
    corrigir();
    if (window.MutationObserver) {
      var alvo = document.body;
      var obs = new MutationObserver(corrigir);
      obs.observe(alvo, { childList: true, subtree: true });
      setTimeout(function () { obs.disconnect(); corrigir(); }, 3000);
    }
  }

  if (document.readyState === 'complete') {
    setTimeout(iniciar, 0);
  } else {
    window.addEventListener('load', function () { setTimeout(iniciar, 0); });
  }
})();
