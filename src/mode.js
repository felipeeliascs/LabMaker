// Gerencia o modo de interação (tela vs VR Box)
// Arquitetura: um raycaster ativo por vez

var mode = {
  current: 'tela',
  scene: null,
  camera: null,
  vrCursor: null
};

function initializeMode() {
  mode.scene = document.getElementById('mainScene');
  mode.camera = document.querySelector('a-camera');
  mode.vrCursor = document.getElementById('vrCursor');
  
  if (!mode.scene || !mode.camera || !mode.vrCursor) {
    console.warn('mode.js: Elementos A-Frame não encontrados');
    return;
  }
  
  setModeTela();
  
  mode.scene.addEventListener('enter-vr', function() {
    setModeVR();
  });
  
  mode.scene.addEventListener('exit-vr', function() {
    setModeTela();
  });
}

function setModeTela() {
  mode.current = 'tela';
  
  if (!mode.vrCursor) return;
  
  // Modo tela: raycaster da cena habilitado, cursor VR desabilitado
  mode.scene.setAttribute('raycaster', 'enabled', true);
  mode.vrCursor.setAttribute('raycaster', 'enabled', false);
  mode.vrCursor.setAttribute('visible', false);
  
  // Fechar painel espacial se estiver aberto
  if (window.labmakerVRPanel && window.labmakerVRPanel.estaAberto()) {
    window.labmakerVRPanel.fechar();
  }
}

function setModeVR() {
  mode.current = 'vr';
  
  if (!mode.vrCursor) return;
  
  // Modo VR: raycaster da cena desabilitado, cursor VR habilitado
  mode.scene.setAttribute('raycaster', 'enabled', false);
  mode.vrCursor.setAttribute('raycaster', 'enabled', true);
  mode.vrCursor.setAttribute('visible', true);
  
  // Fechar painel HTML se estiver aberto
  if (typeof fecharRecurso === 'function') fecharRecurso();
  if (typeof fecharPainelPercurso === 'function') fecharPainelPercurso();
  
  // Fechar painel espacial se estiver aberto
  if (window.labmakerVRPanel && window.labmakerVRPanel.estaAberto()) {
    window.labmakerVRPanel.fechar();
  }
  
  // Atualizar raycasters para garantir detecção dos hotspots
  if (window.labmakerMode) {
    window.labmakerMode.refreshInterativos();
  }
}

window.labmakerMode = {
  isVR: function() {
    return mode.current === 'vr';
  },
  getCurrent: function() {
    return mode.current;
  },
  refreshInterativos: function() {
    if (!mode.scene || !mode.vrCursor) return;
    
    requestAnimationFrame(function() {
      var sceneRaycaster = mode.scene.components.raycaster;
      if (sceneRaycaster) {
        sceneRaycaster.refreshObjects();
      }
      
      var vrCursorRaycaster = mode.vrCursor.components.raycaster;
      if (vrCursorRaycaster) {
        vrCursorRaycaster.refreshObjects();
      }
    });
  }
};

function startMode() {
  var scene = document.getElementById('mainScene');

  if (!scene) {
    console.warn('mode.js: Cena A-Frame não encontrada');
    return;
  }

  if (scene.hasLoaded) {
    initializeMode();
  } else {
    scene.addEventListener('loaded', initializeMode, { once: true });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startMode, { once: true });
} else {
  startMode();
}
