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

  cenaAtual = id;
  sky.setAttribute('src', cena.panorama);
  nomeCena.textContent = cena.name;
  descricaoCena.textContent = cena.description;

  criarHotspotsNavegacao(cena, function (destino) {
    carregarCena(destino);
  });
}

// Inicia o tour na Antesala
document.addEventListener('DOMContentLoaded', function () {
  carregarCena('antesala');
});