// Modo de Desenvolvimento de Hotspots (?dev=1)
(function () {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('dev') !== '1') return;

  const STORAGE_KEY = 'labmaker.hotspot-layout.v1';
  let selectedHotspot = null;
  let isDragging = false;
  let isPointerDown = false;
  let startX = 0, startY = 0;

  // Criar barra de desenvolvimento
  function criarDevBar() {
    if (document.getElementById('devBar')) return;

    const bar = document.createElement('div');
    bar.id = 'devBar';
    bar.style.cssText = 'position:fixed; top:16px; left:16px; background:rgba(0,0,0,0.85); color:#fff; padding:12px 16px; border-radius:8px; z-index:10000; font-family:Arial,sans-serif; font-size:13px; max-width:320px; box-shadow:0 4px 12px rgba(0,0,0,0.5); user-select:none;';
    bar.innerHTML = `
      <div style="font-weight:bold; font-size:15px; margin-bottom:6px; color:#4CAF50;">Modo de Desenvolvimento</div>
      <div id="devSceneName" style="margin-bottom:4px; opacity:0.9; font-weight:bold;">Cena: ...</div>
      <div style="font-size:12px; opacity:0.75; margin-bottom:8px; font-style:italic;">Arraste os hotspots para reposicioná-los</div>
      <div id="devCoords" style="background:rgba(255,255,255,0.1); padding:6px 8px; border-radius:4px; font-family:monospace; font-size:12px; margin-bottom:10px; word-break:break-all;">Nenhum hotspot selecionado</div>
      <div style="margin-bottom:8px;">
        <label style="font-size:11px; opacity:0.8;">Selecionar hotspot (se o clique falhar):</label>
        <select id="devHotspotSelect" style="width:100%; margin-top:4px; background:#222; color:#fff; border:1px solid #444; padding:4px; border-radius:4px; font-size:12px;">
          <option value="">— clique no hotspot ou escolha aqui —</option>
        </select>
      </div>
      <div style="margin-bottom:10px; background:rgba(255,255,255,0.07); padding:8px; border-radius:6px;">
        <label style="font-size:12px; display:flex; justify-content:space-between; margin-bottom:4px;"><span>Profundidade (radius)</span><span id="devRadiusVal" style="font-family:monospace; color:#4CAF50;">-</span></label>
        <input type="range" id="devRadiusSlider" min="2" max="15" step="0.1" value="4.5" style="width:100%; accent-color:#4CAF50;" />
        <div style="display:flex; gap:6px; margin-top:6px;">
          <button id="devRadiusMinus" style="flex:1; background:#333; color:white; border:1px solid #555; padding:4px; border-radius:4px; cursor:pointer; font-size:12px;">− Aproximar</button>
          <button id="devRadiusPlus" style="flex:1; background:#333; color:white; border:1px solid #555; padding:4px; border-radius:4px; cursor:pointer; font-size:12px;">+ Afastar</button>
        </div>
        <div style="font-size:10px; opacity:0.55; margin-top:4px; text-align:center;">Scroll do mouse sobre a cena também ajusta</div>
      </div>
      <div style="display:flex; flex-wrap:wrap; gap:6px;">
        <button id="devBtnExport" style="background:#2196F3; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">Exportar layout</button>
        <button id="devBtnImport" style="background:#FF9800; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">Importar layout</button>
        <button id="devBtnRestoreScene" style="background:#9C27B0; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">Restaurar esta cena</button>
        <button id="devBtnRestoreAll" style="background:#f44336; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">Restaurar tudo</button>
        <button id="devBtnExit" style="background:#607D8B; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">Sair</button>
      </div>
      <input type="file" id="devFileInput" accept=".json" style="display:none;" />
    `;
    document.body.appendChild(bar);

    document.getElementById('devBtnExport').addEventListener('click', exportarLayout);
    document.getElementById('devBtnImport').addEventListener('click', () => document.getElementById('devFileInput').click());
    document.getElementById('devFileInput').addEventListener('change', importarLayout);
    document.getElementById('devBtnRestoreScene').addEventListener('click', restaurarCenaAtual);
    document.getElementById('devBtnRestoreAll').addEventListener('click', restaurarTudo);
    document.getElementById('devBtnExit').addEventListener('click', sairDoModoDev);

    // Controles de profundidade
    const slider = document.getElementById('devRadiusSlider');
    slider.addEventListener('input', () => aplicarRadius(parseFloat(slider.value)));
    slider.addEventListener('change', () => salvarRadiusAtual());
    document.getElementById('devRadiusMinus').addEventListener('click', () => { ajustarRadius(-0.5); salvarRadiusAtual(); });
    document.getElementById('devRadiusPlus').addEventListener('click', () => { ajustarRadius(0.5); salvarRadiusAtual(); });

    // Select fallback para quando raycast falha
    const selectEl = document.getElementById('devHotspotSelect');
    selectEl.addEventListener('change', () => {
      const id = selectEl.value;
      if (!id) return;
      const el = document.querySelector(`[data-hotspot-id="${id}"]`);
      if (el) {
        selectedHotspot = el;
        destacarSelecao(el);
        atualizarInfoHotspot(el);
        console.log('[dev-mode] selecionado via lista', id);
      }
    });

    // Scroll do mouse ajusta radius do hotspot selecionado (funciona em qualquer lugar da cena)
    document.addEventListener('wheel', (e) => {
      if (!selectedHotspot || isDragging) return;
      if (e.target.closest && e.target.closest('#devBar, #painelJogo, #menuExtras, #btnMenuPrincipal')) return;
      const ctx = getCamera();
      if (!ctx || !ctx.canvas) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.3 : 0.3;
      ajustarRadius(delta, true);
    }, { passive: false });

    atualizarNomeCenaDev();
    atualizarInfoHotspot(null);
    atualizarListaHotspots();
    setInterval(() => { atualizarNomeCenaDev(); atualizarListaHotspots(); }, 800);
    // Hook carregarCena para atualizar lista ao trocar de cena
    if (typeof window.carregarCena === 'function' && !window._devOriginalCarregarCena) {
      window._devOriginalCarregarCena = window.carregarCena;
      window.carregarCena = function(id) {
        const ret = window._devOriginalCarregarCena.apply(this, arguments);
        setTimeout(() => { atualizarListaHotspots(); atualizarInfoHotspot(null); selectedHotspot = null; }, 600);
        return ret;
      };
    }
  }

  function atualizarNomeCenaDev() {
    const nomeEl = document.getElementById('nomeCena');
    const devSceneEl = document.getElementById('devSceneName');
    if (nomeEl && devSceneEl) {
      devSceneEl.textContent = 'Cena: ' + nomeEl.textContent;
    }
  }

  function getCamera() {
    const cameraEl = document.querySelector('a-camera');
    if (!cameraEl) return null;
    const sceneEl = cameraEl.sceneEl;
    if (!sceneEl || !sceneEl.canvas) return null;
    // A-Frame expõe a câmera em cameraEl.components.camera.camera ou sceneEl.camera
    const cam = (cameraEl.components.camera && cameraEl.components.camera.camera) || cameraEl.getObject3D('camera') || sceneEl.camera;
    return { cameraEl, sceneEl, camera: cam, canvas: sceneEl.canvas };
  }

  function getYawPitchFromScreenPosition(clientX, clientY) {
    const ctx = getCamera();
    if (!ctx) return null;
    const rect = ctx.canvas.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, ctx.camera);
    const dir = raycaster.ray.direction;
    const pitchRad = Math.asin(Math.max(-1, Math.min(1, dir.y)));
    const pitch = pitchRad * 180 / Math.PI;
    const yawRad = Math.atan2(dir.x, -dir.z);
    const yaw = yawRad * 180 / Math.PI;
    return {
      yaw: Math.round(yaw * 100) / 100,
      pitch: Math.round(pitch * 100) / 100
    };
  }

  // Raycast real contra os meshes dos hotspots para encontrar o hotspot sob o cursor
  function getIntersectedHotspot(clientX, clientY) {
    const ctx = getCamera();
    if (!ctx) return null;
    const rect = ctx.canvas.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, ctx.camera);

    const entities = (typeof hotspotEntities !== 'undefined' ? hotspotEntities : window.hotspotEntities) || [];
    if (!entities || entities.length === 0) return null;

    const meshes = [];
    entities.forEach(el => {
      if (!el || !el.object3D) return;
      el.object3D.traverse(obj => {
        if (obj.isMesh) meshes.push(obj);
      });
    });
    if (meshes.length === 0) return null;

    const intersects = raycaster.intersectObjects(meshes, false);
    if (intersects.length > 0) {
      let hitEl = intersects[0].object.el;
      let cur = hitEl;
      let guard = 0;
      while (cur && guard < 10) {
        if (cur.dataset && cur.dataset.hotspotId) return cur;
        cur = cur.parentEl || cur.parentNode;
        if (cur && cur.tagName === 'A-SCENE') break;
        guard++;
      }
    }
    // Fallback: hotspot mais próximo por ângulo (quando mesh ainda não carregou ou ray errou por pouco)
    const probe = getYawPitchFromScreenPosition(clientX, clientY);
    if (!probe) return null;
    let best = null, bestDist = 7; // threshold 7 graus
    entities.forEach(el => {
      if (!el.dataset || !el.dataset.yaw) return;
      const y = parseFloat(el.dataset.yaw), p = parseFloat(el.dataset.pitch);
      // Distância angular considerando wrap do yaw
      let dyaw = Math.abs(y - probe.yaw);
      if (dyaw > 180) dyaw = 360 - dyaw;
      const dpitch = Math.abs(p - probe.pitch);
      const d = Math.hypot(dyaw, dpitch);
      if (d < bestDist) { bestDist = d; best = el; }
    });
    if (best) console.log(`[dev-mode] fallback angular ${best.dataset.hotspotId} dist ${bestDist.toFixed(1)}°`);
    return best;
  }

  function salvarPosicaoHotspot(sceneId, hotspotId, yaw, pitch, radius) {
    let layout;
    try {
      layout = JSON.parse(localStorage.getItem(STORAGE_KEY)) || { version: 1, scenes: {} };
    } catch (e) {
      layout = { version: 1, scenes: {} };
    }
    if (!layout.scenes) layout.scenes = {};
    if (!layout.scenes[sceneId]) layout.scenes[sceneId] = {};
    layout.scenes[sceneId][hotspotId] = { yaw, pitch, radius };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  }

  function calcularPosicaoYawPitchRadius(yaw, pitch, radius) {
    const yawRad = yaw * Math.PI / 180;
    const pitchRad = pitch * Math.PI / 180;
    const x = radius * Math.cos(pitchRad) * Math.sin(yawRad);
    const y = 1.6 + radius * Math.sin(pitchRad);
    const z = -radius * Math.cos(pitchRad) * Math.cos(yawRad);
    return { x, y, z };
  }

  function aplicarRadius(novoRadius) {
    if (!selectedHotspot) {
      console.warn('[dev-mode] aplicarRadius sem hotspot selecionado');
      alert('Selecione um hotspot primeiro (clique nele ou use o dropdown).');
      return;
    }
    const r = Math.max(2, Math.min(15, Math.round(novoRadius * 10) / 10));
    const yaw = parseFloat(selectedHotspot.dataset.yaw || 0);
    const pitch = parseFloat(selectedHotspot.dataset.pitch || 0);
    selectedHotspot.dataset.radius = String(r);

    const pos = calcularPosicaoYawPitchRadius(yaw, pitch, r);
    const rot = { x: pitch, y: -yaw, z: 0 };
    const posStr = `${pos.x.toFixed(3)} ${pos.y.toFixed(3)} ${pos.z.toFixed(3)}`;
    const rotStr = `${rot.x.toFixed(2)} ${rot.y.toFixed(2)} ${rot.z.toFixed(2)}`;

    // A-Frame: string é mais confiável que objeto
    selectedHotspot.setAttribute('position', posStr);
    selectedHotspot.setAttribute('rotation', rotStr);

    // Força no object3D para feedback imediato (e testa visibilidade da mudança)
    if (selectedHotspot.object3D) {
      selectedHotspot.object3D.position.set(pos.x, pos.y, pos.z);
      if (window.THREE && THREE.MathUtils) {
        selectedHotspot.object3D.rotation.set(
          THREE.MathUtils.degToRad(rot.x),
          THREE.MathUtils.degToRad(rot.y),
          THREE.MathUtils.degToRad(rot.z)
        );
      }
      selectedHotspot.object3D.updateMatrixWorld(true);
    }

    console.log(`[dev-mode] radius ${r} -> pos ${posStr} rot ${rotStr} yaw:${yaw} pitch:${pitch}`);
    atualizarInfoHotspot(selectedHotspot);
    selectedHotspot.setAttribute('animation__radius', {
      property: 'scale',
      to: '1.2 1.2 1.2',
      dur: 140,
      dir: 'alternate',
      loop: 1,
      easing: 'easeOutQuad'
    });
  }

  function ajustarRadius(delta, salvar) {
    if (!selectedHotspot) {
      alert('Selecione um hotspot primeiro (clique nele).');
      return;
    }
    const atual = parseFloat(selectedHotspot.dataset.radius || 4.5);
    aplicarRadius(atual + delta);
    // Sempre salva após ajuste por botão/roda para persistir
    salvarRadiusAtual();
  }

  function salvarRadiusAtual() {
    if (!selectedHotspot) return;
    const sceneId = selectedHotspot.dataset.sceneId;
    const hotspotId = selectedHotspot.dataset.hotspotId;
    if (!sceneId || !hotspotId) {
      console.warn('[dev-mode] salvar sem sceneId/hotspotId', selectedHotspot.dataset);
      return;
    }
    const yaw = parseFloat(selectedHotspot.dataset.yaw);
    const pitch = parseFloat(selectedHotspot.dataset.pitch);
    const radius = parseFloat(selectedHotspot.dataset.radius || 4.5);
    salvarPosicaoHotspot(sceneId, hotspotId, yaw, pitch, radius);
    console.log(`[dev-mode] salvo ${sceneId}/${hotspotId}`, { yaw, pitch, radius });
    if (window.labmakerMode && typeof window.labmakerMode.refreshInterativos === 'function') {
      window.labmakerMode.refreshInterativos();
    }
  }

  function atualizarListaHotspots() {
    const sel = document.getElementById('devHotspotSelect');
    if (!sel) return;
    const prev = sel.value;
    sel.innerHTML = '<option value="">— clique no hotspot ou escolha aqui —</option>';
    const entities = (typeof hotspotEntities !== 'undefined' ? hotspotEntities : window.hotspotEntities) || [];
    entities.forEach(el => {
      if (!el.dataset || !el.dataset.hotspotId) return;
      const opt = document.createElement('option');
      opt.value = el.dataset.hotspotId;
      opt.textContent = `${el.dataset.sceneId}/${el.dataset.hotspotId} (y:${el.dataset.yaw} p:${el.dataset.pitch} r:${el.dataset.radius})`;
      sel.appendChild(opt);
    });
    if (prev) sel.value = prev;
  }

  function atualizarInfoHotspot(el) {
    const coordsEl = document.getElementById('devCoords');
    const slider = document.getElementById('devRadiusSlider');
    const valEl = document.getElementById('devRadiusVal');
    const sel = document.getElementById('devHotspotSelect');
    if (!coordsEl) return;
    if (!el) {
      coordsEl.textContent = 'Nenhum hotspot selecionado';
      if (valEl) valEl.textContent = '-';
      if (slider) slider.disabled = true;
      return;
    }
    const id = el.dataset.hotspotId || 'desconhecido';
    const yaw = el.dataset.yaw || 0;
    const pitch = el.dataset.pitch || 0;
    const radius = el.dataset.radius || 4.5;
    coordsEl.innerHTML = `<b>${id}</b><br>yaw: ${yaw} | pitch: ${pitch} | r: ${radius}`;
    if (valEl) valEl.textContent = radius + ' m';
    if (slider) {
      slider.disabled = false;
      slider.value = radius;
    }
    if (sel && sel.value !== id) sel.value = id;
  }

  function destacarSelecao(el) {
    // Remove destaque anterior
    document.querySelectorAll('[data-hotspot-id]').forEach(h => {
      h.removeAttribute('data-selected');
    });
    if (el) {
      el.setAttribute('data-selected', 'true');
      // feedback visual rápido: aumenta levemente
      // não alteramos scale permanente, só via atributo para debug
    }
  }

  function onPointerDown(clientX, clientY) {
    if (window.labmakerMode && window.labmakerMode.isVR()) return null;
    const hit = getIntersectedHotspot(clientX, clientY);
    if (!hit) return null;
    selectedHotspot = hit;
    isPointerDown = true;
    destacarSelecao(selectedHotspot);
    atualizarInfoHotspot(selectedHotspot);
    startX = clientX;
    startY = clientY;
    isDragging = false;
    return hit;
  }

  function onPointerMove(clientX, clientY, preventDefault) {
    if (!selectedHotspot || !isPointerDown) return;
    if (window.labmakerMode && window.labmakerMode.isVR()) return;
    const dist = Math.hypot(clientX - startX, clientY - startY);
    if (!isDragging && dist > 4) {
      isDragging = true;
      selectedHotspot._wasDragged = true;
      const cameraEl = document.querySelector('a-camera');
      if (cameraEl && cameraEl.components['look-controls']) {
        cameraEl.components['look-controls'].pause();
      }
      // Desabilita raycaster da cena durante arraste para não haver hover/click
      const sceneEl = document.querySelector('a-scene');
      if (sceneEl) sceneEl.setAttribute('raycaster', 'enabled', false);
    }
    if (isDragging) {
      if (preventDefault) preventDefault();
      const pos = getYawPitchFromScreenPosition(clientX, clientY);
      if (!pos) return;
      const radius = parseFloat(selectedHotspot.dataset.radius || 4.5);
      selectedHotspot.dataset.yaw = String(pos.yaw);
      selectedHotspot.dataset.pitch = String(pos.pitch);
      const p3 = calcularPosicaoYawPitchRadius(pos.yaw, pos.pitch, radius);
      const rotStr = `${pos.pitch.toFixed(2)} ${(-pos.yaw).toFixed(2)} 0`;
      const posStr = `${p3.x.toFixed(3)} ${p3.y.toFixed(3)} ${p3.z.toFixed(3)}`;
      selectedHotspot.setAttribute('position', posStr);
      selectedHotspot.setAttribute('rotation', rotStr);
      if (selectedHotspot.object3D) {
        selectedHotspot.object3D.position.set(p3.x, p3.y, p3.z);
        selectedHotspot.object3D.updateMatrixWorld(true);
      }
      atualizarInfoHotspot(selectedHotspot);
    }
  }

  function onPointerUp() {
    if (!selectedHotspot) return;
    isPointerDown = false;
    const wasDragging = isDragging;
    if (wasDragging) {
      isDragging = false;
      const cameraEl = document.querySelector('a-camera');
      if (cameraEl && cameraEl.components['look-controls']) {
        cameraEl.components['look-controls'].play();
      }
      const sceneEl = document.querySelector('a-scene');
      if (sceneEl) sceneEl.setAttribute('raycaster', 'enabled', true);

      const sceneId = selectedHotspot.dataset.sceneId;
      const hotspotId = selectedHotspot.dataset.hotspotId;
      const yaw = parseFloat(selectedHotspot.dataset.yaw);
      const pitch = parseFloat(selectedHotspot.dataset.pitch);
      const radius = parseFloat(selectedHotspot.dataset.radius || 4.5);
      salvarPosicaoHotspot(sceneId, hotspotId, yaw, pitch, radius);
      if (window.labmakerMode && typeof window.labmakerMode.refreshInterativos === 'function') {
        window.labmakerMode.refreshInterativos();
      }
      setTimeout(() => {
        if (selectedHotspot) selectedHotspot._wasDragged = false;
      }, 150);
    } else {
      // Clique sem arraste: apenas seleciona e mostra coords, mas não consome o clique se não arrastou
      // Limpa flag para permitir clique normal
      setTimeout(() => {
        if (selectedHotspot) selectedHotspot._wasDragged = false;
      }, 50);
    }
  }

  // Mouse events - usam capture para interceptar antes do look-controls
  document.addEventListener('mousedown', function (e) {
    // Ignora cliques na barra dev
    if (e.target.closest && e.target.closest('#devBar, #painelJogo, #menuExtras, #btnMenuPrincipal')) return;
    const hit = onPointerDown(e.clientX, e.clientY);
    if (hit) {
      // Previne look-controls de iniciar rotação
      e.preventDefault();
    }
  }, true);

  document.addEventListener('mousemove', function (e) {
    if (e.target.closest && e.target.closest('#painelJogo')) return;
    if (!selectedHotspot) return;
    onPointerMove(e.clientX, e.clientY, () => e.preventDefault());
  }, true);

  document.addEventListener('mouseup', function (e) {
    if (!selectedHotspot) return;
    onPointerUp();
    // Mantém seleção para exibir coords, mas libera arraste
    // selectedHotspot permanece selecionado até próximo clique
  }, true);

  // Touch events
  document.addEventListener('touchstart', function (e) {
    if (e.target.closest && e.target.closest('#devBar, #painelJogo, #menuExtras, #btnMenuPrincipal')) return;
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    const hit = onPointerDown(t.clientX, t.clientY);
    if (hit) e.preventDefault();
  }, { passive: false, capture: true });

  document.addEventListener('touchmove', function (e) {
    if (e.target.closest && e.target.closest('#painelJogo')) return;
    if (!selectedHotspot) return;
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    onPointerMove(t.clientX, t.clientY, () => e.preventDefault());
  }, { passive: false, capture: true });

  document.addEventListener('touchend', function (e) {
    if (!selectedHotspot) return;
    onPointerUp();
  }, true);

  // Clique em área vazia deseleciona (se não arrastou)
  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('#devBar, #painelJogo, #menuExtras, #btnMenuPrincipal')) return;
    // Se acabou de arrastar, já tratado via _wasDragged
    if (selectedHotspot && selectedHotspot._wasDragged) return;
    // Se clicou fora de hotspot e não está arrastando, deseleciona após pequeno delay
    setTimeout(() => {
      if (!isDragging) {
        const hit = getIntersectedHotspot(e.clientX, e.clientY);
        if (!hit) {
          // Não limpa seleção se acabou de selecionar
        }
      }
    }, 0);
  }, true);

  // Funções dos Botões
  function exportarLayout() {
    let layout;
    try {
      layout = JSON.parse(localStorage.getItem(STORAGE_KEY)) || { version: 1, scenes: {} };
    } catch (e) {
      layout = { version: 1, scenes: {} };
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(layout, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "labmaker-hotspot-layout.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  function importarLayout(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (evt) {
      try {
        const parsed = JSON.parse(evt.target.result);
        if (parsed && parsed.scenes) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
          alert('Layout importado com sucesso! Recarregando cena...');
          if (typeof carregarCena === 'function' && typeof cenaAtual !== 'undefined' && cenaAtual) {
            carregarCena(cenaAtual);
          } else {
            window.location.reload();
          }
        } else {
          alert('Arquivo JSON inválido.');
        }
      } catch (err) {
        alert('Erro ao processar arquivo JSON: ' + err.message);
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  }

  function restaurarCenaAtual() {
    if (typeof cenaAtual === 'undefined' || !cenaAtual) {
      alert('Nenhuma cena ativa.');
      return;
    }
    if (!confirm('Deseja restaurar os hotspots da cena atual (' + cenaAtual + ') para o padrão?')) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const layout = JSON.parse(raw);
        if (layout && layout.scenes && layout.scenes[cenaAtual]) {
          delete layout.scenes[cenaAtual];
          localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
        }
      }
      if (typeof carregarCena === 'function') {
        carregarCena(cenaAtual);
      }
      alert('Cena restaurada para o padrão!');
      atualizarInfoHotspot(null);
      destacarSelecao(null);
      selectedHotspot = null;
    } catch (e) {
      console.warn('Erro ao restaurar cena', e);
    }
  }

  function restaurarTudo() {
    if (!confirm('Deseja apagar TODO o layout salvo do LabMaker e retornar todas as cenas ao padrão?')) return;
    localStorage.removeItem(STORAGE_KEY);
    if (typeof carregarCena === 'function' && typeof cenaAtual !== 'undefined' && cenaAtual) {
      carregarCena(cenaAtual);
    } else {
      window.location.reload();
    }
    alert('Todas as cenas foram restauradas ao padrão!');
    atualizarInfoHotspot(null);
    destacarSelecao(null);
    selectedHotspot = null;
  }

  function sairDoModoDev() {
    window.location.href = window.location.pathname;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', criarDevBar);
  } else {
    criarDevBar();
  }
})();
