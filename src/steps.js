// Dados do percurso pedagógico
var etapasPercurso = [
  {
    titulo: 'Observar',
    descricao: 'Explore o ambiente e identifique os espaços, ferramentas e possibilidades de aprendizagem.'
  },
  {
    titulo: 'Investigar',
    descricao: 'Clique nos recursos educacionais para compreender sua função no laboratório maker.'
  },
  {
    titulo: 'Criar',
    descricao: 'Relacione os recursos do LabMaker com uma situação-problema ou desafio de robótica educacional.'
  },
  {
    titulo: 'Testar',
    descricao: 'Simule, ajuste e reflita sobre soluções possíveis para o desafio proposto.'
  },
  {
    titulo: 'Compartilhar',
    descricao: 'Registre ou apresente o que foi aprendido, destacando estratégias, dificuldades e descobertas.'
  }
];

var etapaAtual = 0;

function getTotalEtapas() {
  return etapasPercurso.length;
}

function getEtapaAtual() {
  return etapasPercurso[etapaAtual];
}

function getIndiceAtual() {
  return etapaAtual;
}

function proximaEtapa() {
  if (etapaAtual < etapasPercurso.length - 1) {
    etapaAtual++;
  }
}

function etapaAnterior() {
  if (etapaAtual > 0) {
    etapaAtual--;
  }
}

function irParaEtapa(index) {
  if (index >= 0 && index < etapasPercurso.length) {
    etapaAtual = index;
  }
}