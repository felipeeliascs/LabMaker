// Giroscópio opcional para a cena 360 em modo tela. No VR, o rastreamento da cabeça permanece ativo.
(function () {
  var scene = document.getElementById('mainScene');
  var camera = document.querySelector('a-camera');
  var button = document.getElementById('btnGiroscopio');
  var notice = document.getElementById('menuAviso');
  if (!scene || !camera || !button) return;

  var ativo = false;
  var avisoTimer = null;

  function avisar(mensagem) {
    if (!notice) return;
    notice.textContent = mensagem;
    notice.hidden = false;
    clearTimeout(avisoTimer);
    avisoTimer = setTimeout(function () { notice.hidden = true; }, 5500);
  }

  function atualizarControle() {
    camera.setAttribute('look-controls', 'magicWindowTrackingEnabled',
      scene.is('vr-mode') || ativo);
    button.setAttribute('aria-pressed', String(ativo));
    button.setAttribute('aria-label', ativo ? 'Desativar giroscópio' : 'Ativar giroscópio');
    button.title = ativo ? 'Desativar giroscópio' : 'Ativar giroscópio';
  }

  // O A-Frame ativa o sensor por padrão em celulares; deixamos a escolha com a pessoa.
  atualizarControle();

  button.addEventListener('click', async function () {
    if (ativo) {
      ativo = false;
      atualizarControle();
      avisar('Giroscópio desativado. Arraste a cena para olhar ao redor.');
      return;
    }

    if (typeof DeviceOrientationEvent === 'undefined') {
      avisar('Este dispositivo não disponibiliza um giroscópio para o navegador.');
      return;
    }
    if (!window.isSecureContext) {
      avisar('Abra o LabMaker por HTTPS para ativar o giroscópio neste celular.');
      return;
    }
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        var permissao = await DeviceOrientationEvent.requestPermission();
        if (permissao !== 'granted') {
          avisar('Permissão do giroscópio não concedida.');
          return;
        }
      } catch (erro) {
        avisar('Não foi possível solicitar acesso ao giroscópio.');
        return;
      }
    }

    var controles = camera.components['look-controls'];
    if (!controles || !controles.magicWindowControls) {
      avisar('O giroscópio está disponível apenas no celular.');
      return;
    }

    ativo = true;
    atualizarControle();
    avisar('Giroscópio ativado. Mova o celular para olhar ao redor.');
  });

  scene.addEventListener('enter-vr', atualizarControle);
  scene.addEventListener('exit-vr', atualizarControle);
})();
