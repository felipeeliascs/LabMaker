# Mapa de Cenas — LabMaker

O tour tem oito cenas. Os IDs abaixo são usados em `index.html?scene=<id>` e no menu espacial VR. As definições, panoramas e posições dos hotspots ficam em `src/scenes.js`.

| Cena | ID | Panorama | Conteúdo principal |
|---|---|---|---|
| Recepção e Orientação | `antesala` | `01-antesala-recepcao.jpg` | Uso, navegação, Tela/VR, segurança e ambientes |
| Hub Central do LabMaker | `hub` | `02-hub-central.jpg` | Portais para as seis áreas, Projetos Maker e retorno à recepção |
| Programação e Computação Criativa | `programacao` | `03-programacao-robotica.jpg` | Blockly LabMaker e outras ferramentas de programação |
| Eletrônica e Prototipagem | `eletronica` | `04-eletronica-prototipagem.jpg` | Simuladores de eletrônica e lógica digital |
| Modelagem e Fabricação Digital | `fabricacao` | `05-fabricacao-digital.jpg` | Simuladores próprios, modelagem e bibliotecas 3D |
| Arena de Robótica e Desafios | `arena` | `06-arena-batalha-robos.jpg` | Desafios Blockly, GearsBot futuro e ferramentas de robótica |
| Ciências e Simulações | `ciencias` | `04-eletronica-prototipagem.jpg` (provisório) | PhET |
| Inteligência Artificial | `ia` | `03-programacao-robotica.jpg` (provisório) | Teachable Machine e PictoBlox ML |

Todas as áreas têm portal de retorno ao Hub. As cenas novas reutilizam panoramas locais para evitar novos arquivos pesados nesta etapa. `navigationHotspots`, `resourceHotspots`, `toolHotspots` e `simulatorHotspots` são listas independentes; `src/main.js` as recria a cada troca de cena e chama `labmakerMode.refreshInterativos()` para mouse e cursor VR.

As atividades Blockly são definidas em `src/steps.js`. Os grupos de exploração apontam para IDs em `src/tool-registry.js`; leia [Ecossistema de Ferramentas](ecossistema-ferramentas.md) para adicionar uma ferramenta.
