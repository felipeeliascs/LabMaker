# Arquitetura do LabMaker

O LabMaker é um tour 360° estático em HTML, CSS, JavaScript e A-Frame. Não há backend, login ou banco de dados. Deve ser servido por HTTP.

## Módulos do tour

| Arquivo | Responsabilidade |
|---|---|
| `index.html` | Cena A-Frame, raycasters, painéis HTML, menus e ordem dos scripts |
| `src/scenes.js` | Oito cenas, panoramas, portais e hotspots declarativos |
| `src/steps.js` | Oito atividades Blockly da trilha recomendada |
| `src/hotspots.js` | Entidades 3D, posição, tipos, `.interativo`, popups e limpeza na troca de cena |
| `src/main.js` | `carregarCena()`, panorama, pré-carregamento e atividades locais |
| `src/ui.js` e `src/vr-panel.js` | Painéis de recursos e trilha em Tela e VR |
| `src/mode.js` | Alternância do raycaster da cena (mouse) e cursor fuse (VR), com `refreshInterativos()` |
| `src/main-menu.js` e `src/vr-main-menu.js` | Navegação direta em Tela e VR |
| `src/tool-registry.js` | Definição única das ferramentas externas e da futura ferramenta local GearsBot |
| `src/tool-panel.js` | Painel reutilizável para grupos de ferramentas, com iframe sob demanda e link alternativo |
| `src/tags.js` e `src/tag-types/` | Tags de mídia associadas ao ciclo de vida da cena |
| `styles/main.css` | Estilos responsivos dos painéis e menus |

## Troca de cena e modos

`carregarCena(id)` encontra a definição da cena, fecha painéis, remove entidades antigas, cria os novos hotspots e tags, chama `refreshInterativos()` e troca o panorama de `<a-sky>`. Os alvos clicáveis recebem `.interativo`. No modo Tela, o raycaster da cena usa o mouse. No VR, ele é desativado e o cursor fuse da câmera assume a seleção. O menu e os painéis VR são entidades espaciais próprias. Ao abrir um grupo de ferramentas no VR, a experiência sai do modo imersivo para apresentar o painel HTML legível.

As atividades Blockly, impressão 3D e CNC Laser continuam no painel local `#painelJogo`. Ferramentas externas usam o painel `#toolPanel`, com URLs centralizadas no registro e sem carregamento inicial de iframe externo. Consulte [Ecossistema de Ferramentas](ecossistema-ferramentas.md).
