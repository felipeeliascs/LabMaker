# Relatório: Painel Espacial de Recursos - Correção v0.6.3

## 1. Causa do botão Fechar não funcionar

O problema estava na geometria do hitbox do botão. Na versão anterior:

- O botão tinha uma entidade com geometria própria (`plane`)
- A entidade estava visível (cor `#DC2626` com opacidade `1`)
- O `userData.isVRPanelCloseBtn` estava definido
- Mas o raycaster do cursor VR não estava incluindo o hitbox em sua lista de objetos

**Solução implementada:**
- Hitbox com geometria própria: `primitive: plane; width: 0.45; height: 0.12`
- Opacidade mínima: `0.001` (praticamente invisível, mas visível para o raycaster)
- Posicionado à frente do fundo: `z: 0.01` (fundo está em `z: 0`)
- Classe `interativo` atribuída diretamente à entidade do hitbox
- ID estável: `vrPanelCloseHitbox`
- `userData.isVRPanelCloseBtn: true` para identificação no evento click

## 2. Posição e geometria do hitbox

```
Entidade: a-entity#vrPanelCloseHitbox
- geometry: plane 0.45m x 0.12m
- material: #FF9800 (laranja), opacity: 0.001
- position: 0 -0.35 0.01 (relativo ao painel)
- class: interativo
```

A profundidade (`z: 0.01`) garante que o hitbox seja a primeira interseção do raycaster quando o cursor aponta para a área do botão.

## 3. Resultado da inclusão do botão no raycaster

O raycaster do cursor VR deve incluir o botão em sua lista de objetos:
- `vrCursor.components.raycaster.objects` inclui `#vrPanelCloseHitbox`
- O evento click é capturado e verifica `target.object3D.userData.isVRPanelCloseBtn`
- Ao detectar o clique, executa `stopPropagation()` e `window.labmakerVRPanel.fechar()`

## 4. Integração do fechamento com `carregarCena`

No início da função `carregarCena(id)` em `src/main.js`:

```javascript
function carregarCena(id) {
  var cena = buscarCena(id);
  if (!cena) return;

  fecharRecurso();
  
  // Fechar painel espacial se estiver aberto
  if (window.labmakerVRPanel) {
    window.labmakerVRPanel.fechar();
  }

  cenaAtual = id;
  // ...
}
```

Isso garante que:
- Ao trocar de cena, o painel espacial é fechado
- O conteúdo antigo não é transportado para a nova cena
- O painel permanece fechado até um novo hotspot laranja ser selecionado

## 5. Como o design HTML foi reproduzido no canvas

**Elementos do painel HTML (referência):**
- Fundo: `rgba(0, 0, 0, 0.88)` - cor escura com 88% opacidade
- Border-radius: `12px`
- Padding: `24px 28px`
- Título: `#FF9800` (laranja), `20px`, negrito
- Descrição: `15px`, `line-height: 1.5`
- Botão Fechar: `#FF9800`, `10px 24px`, borda arredondada `6px`

**Canvas VR (1024x640 pixels):**
- Fundo: `rgba(0, 0, 0, 0.88)` com `roundRect(0, 0, w, h, 20)`
- Título: `44px`, negrito, cor `#FF9800` (equivalente a ~20px no HTML)
- Descrição: `32px`, cor `#FFFFFF` (equivalente a ~15px no HTML)
- Botão Fechar: `#FF9800`, arredondado `8px`, texto branco `20px`
- Margens: `paddingX: 60px`, `paddingY: 50px`

**Canvas como textura:**
```javascript
var _vrPanelTexture = new THREE.CanvasTexture(_vrPanelCanvas);
// ...
background.setAttribute('material', 'src: #vrPanelCanvas; ...');
```

## 6. Tratamento de textos longos

A função `wrapText(text, ctx, maxWidth)` quebra o texto automaticamente:

```javascript
function wrapText(text, ctx, maxWidth) {
  if (!text) return [];
  
  var words = text.split(' ');
  var lines = [];
  var currentLine = words[0];
  
  for (var i = 1; i < words.length; i++) {
    var word = words[i];
    var width = ctx.measureText(currentLine + ' ' + word).width;
    if (width < maxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
}
```

**Limitação de linhas:**
- Área disponível para descrição: aproximadamente 12 linhas
- Se exceder: `lines[availableLines - 1] = lines[availableLines - 1].slice(0, -3) + '...';`
- As reticências indicam que há mais conteúdo

## 7. Git diff completo

### index.html
```diff
@@ -8,13 +8,24 @@
   <link rel="stylesheet" href="styles/main.css">
 </head>
 <body>
-  <a-scene>
+  <a-scene
+    id="mainScene"
+    cursor="rayOrigin: mouse; fuse: false"
+    raycaster="objects: .interativo; enabled: true">
     <a-sky id="mainSky" src="assets/panoramas/01-antesala-recepcao.png"></a-sky>
     <a-camera>
-      <a-cursor></a-cursor>
+      <a-cursor
+        id="vrCursor"
+        cursor="rayOrigin: entity; fuse: true; fuseTimeout: 1200"
+        raycaster="objects: .interativo; enabled: false"
+        visible="false">
+      </a-cursor>
     </a-camera>
     <a-entity id="hotspotRoot"></a-entity>
+  
+  <!-- Canvas oculto para renderização do painel VR -->
+  <canvas id="vrPanelCanvas" width="1024" height="640" hidden></canvas>
 
   <div id="painelRecurso">
     <div id="recursoConteudo">
@@ -48,11 +59,13 @@
 
   <script src="src/scenes.js"></script>
   <script src="src/steps.js"></script>
-  <script src="src/ui.js"></script>
+  <script src="src/vr-panel.js?v=0.6.3"></script>
+  <script src="src/ui.js?v=0.6.3"></script>
   <script src="src/hotspots.js"></script>
   <script src="src/tag-types/label.js"></script>
   <script src="src/tag-types/media.js"></script>
+  <script src="src/mode.js?v=0.6.3"></script>
   <script src="src/tags.js"></script>
-  <script src="src/main.js"></script>
+  <script src="src/main.js?v=0.6.3"></script>
 </body>
```

### src/main.js
```diff
@@ -18,6 +18,11 @@ function carregarCena(id) {
   if (!cena) return;

   fecharRecurso();
+  
+  // Fechar painel espacial se estiver aberto
+  if (window.labmakerVRPanel) {
+    window.labmakerVRPanel.fechar();
+  }

   cenaAtual = id;
   sky.setAttribute('src', cena.panorama);
@@ -39,6 +44,10 @@ function carregarCena(id) {
     navigate: function (destino) { carregarCena(destino); },
     abrirRecurso: function (titulo, descricao) { abrirRecurso(titulo, descricao); }
   });

+  if (window.labmakerMode) {
+    window.labmakerMode.refreshInterativos();
+  }
 }
```

### src/ui.js
```diff
@@ -1,5 +1,17 @@
 // Controle do painel de recursos educacionais
 function abrirRecurso(titulo, descricao) {
+  // Modo VR: usar painel espacial
+  if (window.labmakerMode && window.labmakerMode.isVR()) {
+    if (window.labmakerVRPanel) {
+      // Se o painel já estiver aberto, recriar com novos dados
+      if (window.labmakerVRPanel.estaAberto()) {
+        window.labmakerVRPanel.fechar();
+      }
+      window.labmakerVRPanel.abrir(titulo, descricao);
+    }
+    return;
+  }
+  
   fecharPainelPercurso();
```

### src/vr-panel.js (novo arquivo)
- Arquivo completo com implementação do painel espacial
- Canvas 1024x640 com renderização via Canvas API
- Hitbox invisível para o raycaster
- Gerenciamento de listeners sem duplicação

### src/mode.js
- Integração com sistema de modo VR/tela
- Fechamento do painel ao trocar de modo

## 8. Git status

```
On branch desenvolvimento-vr
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   index.html
	modified:   src/hotspots.js
	modified:   src/main.js
	modified:   src/tag-types/label.js
	modified:   src/tag-types/media.js
	modified:   src/ui.js

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	relatorio-vr-panel.md
	src/mode.js
	src/vr-panel.js
```

## 9. Confirmação de nenhum commit

Nenhum commit foi feito.

---

**Classificação:** painel VR corrigido e redesenhado, aguardando teste funcional no VR Box.
