// Controle do painel de recursos educacionais
function abrirRecurso(titulo, descricao) {
  fecharPainelPercurso();
  
  // Limpar tudo anteriormente
  var imgEl = document.getElementById('recursoImagem');
  var acoesEl = document.getElementById('recursoAcoes');
  
  imgEl.src = '';
  imgEl.alt = '';
  imgEl.style.display = 'none';
  acoesEl.innerHTML = '';
  acoesEl.style.display = 'none';
  
  // Fallback de imagem
  imgEl.onerror = function() {
    this.src = '';
    this.style.display = 'none';
  };
  
  // Processar conteúdo (tagData ou strings)
  if (typeof titulo === 'object' && titulo !== null && titulo.content) {
    // formato: abrirRecurso(tagData) — MediaTag
    document.getElementById('recursoTitulo').textContent = titulo.content.title || '';
    document.getElementById('recursoDescricao').textContent = titulo.content.description || '';
    
    if (titulo.content.image && titulo.content.image.trim() !== '') {
      imgEl.src = titulo.content.image;
      imgEl.alt = titulo.content.title || 'Imagem';
      imgEl.style.display = 'block';
    }
    
    if (titulo.content.links && titulo.content.links.length > 0) {
      criarLinks(titulo.content.links);
    }
  } else {
    // formato original: abrirRecurso(titulo, descricao) — resourceHotspot
    document.getElementById('recursoTitulo').textContent = titulo || '';
    document.getElementById('recursoDescricao').textContent = descricao || '';
  }
  
  document.getElementById('painelRecurso').style.display = 'block';
}

function criarLinks(links) {
  var acoesEl = document.getElementById('recursoAcoes');
  links.forEach(function(link) {
    if (link.url && link.url.trim() !== '') {
      var a = document.createElement('a');
      a.textContent = link.label;
      a.href = link.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.className = 'acao-link';
      acoesEl.appendChild(a);
    }
  });
  acoesEl.style.display = 'block';
}

function fecharRecurso() {
  var painel = document.getElementById('painelRecurso');
  if (painel) {
    painel.style.display = 'none';
  }
}

// Controle do painel de percurso pedagógico
function abrirPainelPercurso() {
  fecharRecurso();
  irParaEtapa(0);
  atualizarPainelPercurso();
  document.getElementById('painelPercurso').style.display = 'block';
}

function fecharPainelPercurso() {
  var painel = document.getElementById('painelPercurso');
  if (painel) {
    painel.style.display = 'none';
  }
}

function atualizarPainelPercurso() {
  var etapa = getEtapaAtual();
  var indice = getIndiceAtual();
  var total = getTotalEtapas();

  document.getElementById('percursoTitulo').textContent = etapa.titulo;
  document.getElementById('percursoDescricao').textContent = etapa.descricao;
  document.getElementById('percursoProgresso').textContent = 'Etapa ' + (indice + 1) + ' de ' + total;

  document.getElementById('btnAnterior').disabled = (indice === 0);
  document.getElementById('btnProxima').disabled = (indice === total - 1);
}