// Zoom da cena 360 em modo tela, sem alterar a posição dos hotspots.
(function () {
  if (new URLSearchParams(window.location.search).get('dev') === '1') return;

  var FOV_MIN = 40;
  var FOV_MAX = 100;
  var PASSO = 5;

  function iniciarZoom() {
    var scene = document.getElementById('mainScene');
    var camera = document.querySelector('a-camera');
    var controls = document.getElementById('zoomControls');
    var zoomIn = document.getElementById('btnZoomIn');
    var zoomOut = document.getElementById('btnZoomOut');
    if (!scene || !camera || !controls || !zoomIn || !zoomOut) return;

    var fovPadrao = Number(camera.getAttribute('camera').fov) || 80;
    var fov = fovPadrao;
    var distanciaPinca = null;

    function emVR() {
      return scene.is('vr-mode') ||
        (window.labmakerMode && window.labmakerMode.isVR());
    }

    function atualizarBotoes() {
      zoomIn.disabled = fov <= FOV_MIN;
      zoomOut.disabled = fov >= FOV_MAX;
    }

    function definirFov(valor) {
      if (emVR()) return;
      fov = Math.max(FOV_MIN, Math.min(FOV_MAX, valor));
      camera.setAttribute('camera', 'fov', fov);
      atualizarBotoes();
    }

    zoomIn.addEventListener('click', function () { definirFov(fov - PASSO); });
    zoomOut.addEventListener('click', function () { definirFov(fov + PASSO); });

    scene.addEventListener('enter-vr', function () {
      controls.hidden = true;
      distanciaPinca = null;
      camera.setAttribute('camera', 'fov', fovPadrao);
    });
    scene.addEventListener('exit-vr', function () {
      camera.setAttribute('camera', 'fov', fov);
      controls.hidden = false;
      atualizarBotoes();
    });

    function conectarGestos() {
      var canvas = scene.canvas;
      if (!canvas) return;

      canvas.addEventListener('wheel', function (event) {
        if (emVR()) return;
        event.preventDefault();
        definirFov(fov + Math.sign(event.deltaY) * PASSO);
      }, { passive: false });

      function distancia(touches) {
        return Math.hypot(
          touches[0].clientX - touches[1].clientX,
          touches[0].clientY - touches[1].clientY
        );
      }

      canvas.addEventListener('touchstart', function (event) {
        if (emVR() || event.touches.length !== 2) return;
        distanciaPinca = distancia(event.touches);
        event.preventDefault();
        event.stopImmediatePropagation();
      }, { capture: true, passive: false });

      canvas.addEventListener('touchmove', function (event) {
        if (emVR() || event.touches.length !== 2) return;
        var novaDistancia = distancia(event.touches);
        if (distanciaPinca && novaDistancia) definirFov(fov * distanciaPinca / novaDistancia);
        distanciaPinca = novaDistancia;
        event.preventDefault();
        event.stopImmediatePropagation();
      }, { capture: true, passive: false });

      canvas.addEventListener('touchend', function (event) {
        if (event.touches.length < 2) distanciaPinca = null;
      }, { capture: true });
      canvas.addEventListener('touchcancel', function () { distanciaPinca = null; }, { capture: true });
    }

    controls.hidden = emVR();
    atualizarBotoes();
    if (scene.canvas) conectarGestos();
    else scene.addEventListener('renderstart', conectarGestos, { once: true });
  }

  var scene = document.getElementById('mainScene');
  if (scene && scene.hasLoaded) iniciarZoom();
  else if (scene) scene.addEventListener('loaded', iniciarZoom, { once: true });
})();
