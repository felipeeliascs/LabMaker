// Movimento de apresentação, executado apenas na primeira visita deste navegador.
(function () {
  var scene = document.getElementById('mainScene');
  var camera = document.querySelector('a-camera');
  if (!scene || !camera || new URLSearchParams(location.search).get('dev') === '1') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var chave = 'labmaker.intro-rotation-seen.v1';
  try {
    if (localStorage.getItem(chave)) return;
    localStorage.setItem(chave, '1');
  } catch (erro) {
    // Navegação privada pode impedir o armazenamento; o movimento ainda funciona nesta carga.
  }

  var parado = false;
  var frame = null;
  var anterior = null;
  var eventos = ['pointermove', 'mousemove', 'pointerdown', 'mousedown', 'touchstart', 'keydown', 'wheel', 'click'];

  function parar() {
    if (parado) return;
    parado = true;
    if (frame !== null) cancelAnimationFrame(frame);
    eventos.forEach(function (nome) { document.removeEventListener(nome, parar, true); });
    scene.removeEventListener('enter-vr', parar);
  }

  function girar(tempo) {
    if (parado) return;
    var controle = camera.components['look-controls'];
    if (controle && controle.yawObject) {
      if (anterior !== null) {
        var segundos = Math.min((tempo - anterior) / 1000, 0.1);
        // Yaw negativo vira a visão lentamente para a direita (sentido horário).
        controle.yawObject.rotation.y -= segundos * Math.PI / 120;
      }
      anterior = tempo;
    }
    frame = requestAnimationFrame(girar);
  }

  eventos.forEach(function (nome) { document.addEventListener(nome, parar, true); });
  scene.addEventListener('enter-vr', parar);
  frame = requestAnimationFrame(girar);

  window.labmakerIntroRotation = { isActive: function () { return !parado; } };
})();
