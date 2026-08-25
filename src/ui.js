// Controle do painel de recursos educacionais
function abrirRecurso(titulo, descricao) {
  fecharPainelPercurso();
  
  // Suporte a tagData (objeto com content) ou strings separados
  if (typeof titulo === 'object' && titulo !== null && titulo.content) {
    // formato: abrirRecurso(tagData)
    document.getElementById('recursoTitulo').textContent = titulo.content.title || '';
    document.getElementById('recursoDescricao').textContent = titulo.content.description || '';
  } else {
    // formato original: abrirRecurso(titulo, descricao)
    document.getElementById('recursoTitulo').textContent = titulo || '';
    document.getElementById('recursoDescricao').textContent = descricao || '';
  }
  
  document.getElementById('painelRecurso').style.display = 'block';
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