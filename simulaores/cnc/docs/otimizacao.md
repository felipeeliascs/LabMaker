# Otimização do simulador CNC

Ponto de restauração antes das alterações: commit `1f4ed21` no repositório Labmaker.

## Modelos

Medições dos arquivos reais, em MB decimais; não incluem JavaScript, CSS ou protocolo HTTP.

| Conjunto | STL original | GLB Meshopt | Triângulos originais | Triângulos simplificados |
| --- | ---: | ---: | ---: | ---: |
| CNC | 99,15 MB | 3,26 MB | 1.983.091 | 195.865 |
| UR5 e garra | 57,92 MB | 3,78 MB | 1.158.452 | 176.604 |
| Total | 157,08 MB | 7,04 MB | 3.141.543 | 372.469 |

A CNC reduziu 90,1% dos triângulos e 96,7% dos bytes dos modelos. O UR5 não participa do carregamento inicial. Os originais permanecem em `assets/source`; as cópias STL simplificadas ficam em `assets/optimized-stl`. Apenas GLB é distribuído no build estático.

O script une vértices coincidentes, compacta os índices e simplifica preservando bordas. A meta de proporção é 8% para CNC e 12% para UR5, com erro relativo limitado a 0,001. A geometria que atinge o limite de erro antes da meta permanece mais detalhada. São preservadas as coordenadas locais, sem recentralizar peças. Os limites originais são guardados para calcular exatamente o pivô da tampa. O cabeçote, as guias e os eixos conservam a hierarquia cinemática anterior.

O suporte cilíndrico do robô usa 12 segmentos; chapa, sensor e indicadores continuam como primitivas simples. Não foi feita remoção manual de peças mecânicas que pudesse prejudicar o reconhecimento do equipamento.

## Meshopt e Draco

Comparação offline sobre as mesmas malhas simplificadas, nesta máquina; uma amostra por modelo, incluindo leitura glTF pelo NodeIO. Não representa tempo de abertura no navegador nem benchmark de celular.

| Conjunto | Meshopt | Draco | Leitura Meshopt | Leitura Draco |
| --- | ---: | ---: | ---: | ---: |
| CNC | 3,26 MB | 0,94 MB | 38,8 ms | 120,0 ms |
| UR5 | 3,78 MB | 0,86 MB | 26,9 ms | 89,6 ms |

Foi adotado Meshopt pela menor carga de decodificação observada e pelo decoder integrado sem workers externos. Draco permanece como comparação no gerador. Em redes lentas, Draco poderá oferecer vantagem de transferência; essa escolha pode ser revisada com testes nos dispositivos de destino. O JSON ao lado registra todos os arquivos, tempos e tamanhos gzip estimados. O servidor atual pode servir arquivos sem gzip; os valores gzip não são uma promessa de transferência real.

## Execução e integração

- A renderização só pede novos quadros durante movimentos, corte, amortecimento da câmera ou mudanças nos controles.
- A página oculta pausa o corte e o agendador. O retorno não acumula tempo de simulação.
- Qualidade automática: DPR máximo 1 e sem sombras em telas pequenas ou até quatro processadores lógicos; demais dispositivos usam DPR máximo 1,5 e sombras de 1024. O usuário pode selecionar Econômica ou Normal.
- A carcaça fica oculta por padrão, com opções transparente e sólida. O intertravamento da tampa continua ativo em todos os modos.
- A seleção da tampa usa uma caixa com 12 triângulos; arrastar a câmera não aciona a tampa.
- Somente os trechos alterados da linha de corte são enviados à GPU. O corte continua sendo visual, sem operações booleanas volumétricas.
- Painel responsivo com uma única instância montada; atualizações de UI comparadas antes de alterar estado e suspensas quando a página está oculta.
- Downloads canceláveis ao desmontar a cena; geometrias, materiais, controles, observadores e contexto WebGL liberados no encerramento.
- Exportação estática Next.js em `dist`, sem processo Next em produção. Fontes do sistema eliminam a busca de fontes Google no build.
- Hotspot do Labmaker aponta para `simulaores/cnc/dist/index.html`, na mesma origem e porta. O loop A-Frame é suspenso durante a atividade e retomado ao fechar. O iframe volta para `about:blank` para descarregar a CNC.
- Nomes GLB com hash e assets Next versionados permitem cache de longa duração no servidor de hospedagem. O servidor HTTP local não foi alterado para impor políticas de cache globais.

## Validação

TypeScript, ESLint, build estático e onze testes automatizados: interpretação de G-code, continuidade dos arcos, formatos inválidos, independência da taxa de quadros, pausa/reinício, intertravamentos, agendador de renderização, decodificação de todos os GLBs, limites geométricos, ciclos de reabertura da CNC e do UR5 e suspensão/retomada do A-Frame.

No navegador, o desenho de exemplo concluiu o retângulo e o círculo no MDF. O contador de quadros permaneceu em 2.508 entre duas observações da cena parada; o robô apareceu somente após clicar em Carregar robô UR5. A contagem exibida inclui apenas o que foi renderizado na vista e pode incluir passes de sombra.

Faltam medições em celulares físicos e computadores escolares específicos. Os resultados de bytes e triângulos são verificáveis; não se afirma uma taxa de quadros mínima para hardware não testado.

Validação integrada: SVG importado e cortado até 100% pelo gameFrame em localhost:8000; fechamento retorna o iframe para about:blank e reabertura funciona. Apenas a porta 8000 permanece em escuta. Dependências atualizadas para versões compatíveis, incluindo Next.js 16.3.6; npm audit final sem vulnerabilidades conhecidas reportadas.
