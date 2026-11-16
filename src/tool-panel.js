// Painel único de exploração. URLs externas permanecem fora do LabMaker.
(function () {
  var panel = document.getElementById('toolPanel');
  var title = document.getElementById('toolPanelTitle');
  var list = document.getElementById('toolPanelList');
  var embed = document.getElementById('toolPanelEmbed');
  var frame = document.getElementById('toolPanelFrame');
  var fallback = document.getElementById('toolPanelFallback');
  var status = document.getElementById('toolPanelStatus');
  var closeButton = document.getElementById('toolPanelClose');
  if (!panel || !window.labmakerToolRegistry) return;

  var previousFocus = null;
  var activeIframeTool = null;
  var iframeTimer = null;

  function emit(name, toolId) {
    window.dispatchEvent(new CustomEvent('labmaker:tool-' + name, { detail: { toolId: toolId } }));
  }

  function clearEmbed() {
    if (iframeTimer) clearTimeout(iframeTimer);
    iframeTimer = null;
    if (activeIframeTool) emit('close', activeIframeTool);
    activeIframeTool = null;
    frame.src = 'about:blank';
    frame.title = '';
    embed.hidden = true;
    fallback.href = '#';
  }

  function openTool(tool) {
    if (!tool || tool.available === false) return;
    status.textContent = '';
    if ((tool.integration === 'iframe' || tool.integration === 'local') && tool.iframeAllowed) {
      clearEmbed();
      activeIframeTool = tool.id;
      embed.hidden = false;
      frame.title = tool.name;
      fallback.href = tool.url;
      status.textContent = 'Carregando ' + tool.name + '… Se a incorporação for bloqueada, use “Abrir em nova aba”.';
      // O iframe só recebe src após o clique. X-Frame-Options/CSP podem bloquear
      // sem disparar error; por isso o link de fallback fica sempre visível.
      frame.src = tool.url;
      iframeTimer = setTimeout(function () {
        if (activeIframeTool === tool.id) status.textContent = 'A ferramenta pode ter bloqueado a incorporação. Use “Abrir em nova aba”.';
      }, 7000);
      emit('open', tool.id);
      return;
    }
    window.open(tool.url, '_blank', 'noopener,noreferrer');
    emit('open', tool.id);
  }

  function makeCard(tool) {
    var card = document.createElement('li');
    card.className = 'tool-card';
    var icon = document.createElement('span');
    icon.className = 'tool-card-icon';
    if (tool.logo && tool.logo !== 'assets/tools/tool-placeholder.svg') {
      icon.style.backgroundImage = 'url("' + tool.logo + '")';
    } else {
      icon.textContent = tool.name.slice(0, 1).toUpperCase();
    }
    icon.setAttribute('aria-hidden', 'true');
    var body = document.createElement('div');
    body.className = 'tool-card-body';
    var name = document.createElement('strong');
    name.textContent = tool.name;
    var description = document.createElement('p');
    description.textContent = tool.description;
    body.appendChild(name);
    body.appendChild(description);
    var action = document.createElement('button');
    action.type = 'button';
    action.textContent = tool.available === false ? 'Em breve' : (tool.actionLabel || 'Abrir ferramenta');
    action.disabled = tool.available === false;
    action.addEventListener('click', function () { openTool(tool); });
    card.appendChild(icon);
    card.appendChild(body);
    card.appendChild(action);
    return card;
  }

  function show(group) {
    if (!group) return;
    if (typeof fecharRecurso === 'function') fecharRecurso();
    if (typeof fecharPainelPercurso === 'function') fecharPainelPercurso();
    if (window.labmakerMainMenu) window.labmakerMainMenu.close();
    clearEmbed();
    title.textContent = group.title || group.label || 'Ferramentas';
    list.replaceChildren();
    window.labmakerToolRegistry.list(group.toolIds || []).forEach(function (tool) {
      list.appendChild(makeCard(tool));
    });
    status.textContent = '';
    previousFocus = document.activeElement;
    panel.hidden = false;
    closeButton.focus();
  }

  function open(group) {
    var scene = document.getElementById('mainScene');
    if (window.labmakerMode && window.labmakerMode.isVR() && scene && scene.exitVR) {
      // A lista HTML é legível e operável após sair da experiência imersiva.
      scene.addEventListener('exit-vr', function () { show(group); }, { once: true });
      scene.exitVR();
    } else {
      show(group);
    }
  }

  function close() {
    if (panel.hidden) return;
    clearEmbed();
    panel.hidden = true;
    if (previousFocus && previousFocus.isConnected && previousFocus.focus) previousFocus.focus();
  }

  closeButton.addEventListener('click', close);
  panel.addEventListener('click', function (event) { if (event.target === panel) close(); });
  document.addEventListener('keydown', function (event) {
    if (panel.hidden) return;
    if (event.key === 'Escape') { event.preventDefault(); close(); }
    if (event.key === 'Tab') {
      var focusables = Array.from(panel.querySelectorAll('button:not([disabled]), a[href]')).filter(function (el) { return !el.closest('[hidden]'); });
      var first = focusables[0], last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  frame.addEventListener('load', function () {
    if (activeIframeTool && frame.src !== 'about:blank' && iframeTimer) {
      clearTimeout(iframeTimer);
      iframeTimer = null;
      status.textContent = 'Se a ferramenta não aparecer, use “Abrir em nova aba”.';
    }
  });
  frame.addEventListener('error', function () {
    if (activeIframeTool) status.textContent = 'Não foi possível incorporar a ferramenta. Use “Abrir em nova aba”.';
  });
  window.labmakerToolPanel = { open: open, close: close };
})();
