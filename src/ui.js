// Controle do painel de recursos educacionais
function abrirRecurso(titulo, descricao) {
  document.getElementById('recursoTitulo').textContent = titulo;
  document.getElementById('recursoDescricao').textContent = descricao;
  document.getElementById('painelRecurso').style.display = 'block';
}

function fecharRecurso() {
  var painel = document.getElementById('painelRecurso');
  if (painel) {
    painel.style.display = 'none';
  }
}