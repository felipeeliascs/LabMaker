// Inicialização do tour LabMaker
var cenaAtual = null;
var sky = document.getElementById('mainSky');
var nomeCena = document.getElementById('nomeCena');
var descricaoCena = document.getElementById('descricaoCena');

function buscarCena(id) {
  for (var i = 0; i < labmakerScenes.length; i++) {
    if (labmakerScenes[i].id === id) {
      return labmakerScenes[i];
    }
  }
  return null;
}

function carregarCena(id) {
  var cena = buscarCena(id);
  if (!cena) return;

  fecharRecurso();

  cenaAtual = id;
  sky.setAttribute('src', cena.panorama);
  sky.setAttribute('rotation', cena.initialRotation || '0 -90 0');
  nomeCena.textContent = cena.name;
  descricaoCena.textContent = cena.description;

  limparHotspots();

  criarHotspotsNavegacao(cena, function (destino) {
    carregarCena(destino);
  });

  criarHotspotsRecurso(cena, function (titulo, descricao) {
    abrirRecurso(titulo, descricao);
  });
}

// Conecta eventos dos botões
document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('btnFecharRecurso').addEventListener('click', function () {
    fecharRecurso();
  });

  document.getElementById('btnPercurso').addEventListener('click', function () {
    abrirPainelPercurso();
  });

  document.getElementById('btnFecharPercurso').addEventListener('click', function () {
    fecharPainelPercurso();
  });

  document.getElementById('btnAnterior').addEventListener('click', function () {
    etapaAnterior();
    atualizarPainelPercurso();
  });

  document.getElementById('btnProxima').addEventListener('click', function () {
    proximaEtapa();
    atualizarPainelPercurso();
  });

  carregarCena('antesala');
});