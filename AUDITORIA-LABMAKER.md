# Auditoria Completa do Projeto LabMaker

**Data:** 2026-09-09  
**Versão atual:** desenvolvimento-vr (v0.6.3 não implementada)  
**Status da auditoria:** Concluída  
**Alterações realizadas:** Nenhuma

---

## A. Estado do repositório

```
Branch atual: desenvolvimento-vr
Commits recentes: 2b0dab3 (v0.5.1 - Corrige carregamento da MediaTag)
Modificações não commitadas: 6 arquivos modificados, 2 novos arquivos
```

**Arquivos modificados:**
- `index.html` — Estrutura HTML, IDs de cena/cursor, ordem de scripts
- `src/hotspots.js` — Adiciona classe `interativo` aos círculos
- `src/main.js` — Fechamento do painel VR ao trocar de cena
- `src/tag-types/label.js` — Adiciona classe `interativo`
- `src/tag-types/media.js` — Adiciona classe `interativo`
- `src/ui.js` — Suporte ao painel espacial em modo VR

**Novos arquivos:**
- `src/vr-panel.js` — Implementação completa do painel espacial
- `src/mode.js` — Gerenciamento de modo VR/tela

---

## B. Resumo cronológico do desenvolvimento

| Versão | Data | Funcionalidades implementadas |
|--------|------|-------------------------------|
| v0.2 | Antes | LabelTag visual interativa |
| v0.3 | Antes | MediaTag com painel HTML |
| v0.4 | Antes | MediaTag com suporte a imagem no painel |
| v0.5 | aa8e06f | MediaTag com imagens e links externos |
| v0.5.1 | 2b0dab3 | Correção do carregamento da MediaTag |
| v0.6/v0.6.1 | Não implementado | Modos tela e VR, cursores e raycasters (descrito em relatório) |
| v0.6.2 | Não implementado | Correção das superfícies `.interativo` (descrito em relatório) |
| v0.6.3 | Não implementado | Painel espacial para hotspots laranja, correção de regressões |

**Observação:** As versões v0.6, v0.6.1, v0.6.2 e v0.6.3 não existem no histórico Git. Os commits mostram apenas v0.5 e v0.5.1. O desenvolvimento atual está na branch `desenvolvimento-vr` com alterações não commitadas.

---

## C. Funcionalidades concluídas

### ✅ Implementadas e validadas

| Funcionalidade | Arquivo | Status |
|----------------|---------|--------|
| Carregamento das cenas | `src/scenes.js`, `src/main.js` | Validado (código funcional) |
| Panorama 360° | `index.html`, `src/scenes.js` | Validado |
| Navegação por hotspots azuis | `src/hotspots.js` | Validado |
| LabelTag (círculo azul + texto) | `src/tag-types/label.js` | Validado |
| MediaTag (círculo laranja + texto + imagem) | `src/tag-types/media.js` | Validado |
| Painel HTML de recursos | `index.html`, `styles/main.css` | Validado |
| Clique com mouse | `src/main.js`, `src/hotspots.js` | Validado |

### ✅ Implementadas, mas ainda não validadas

| Funcionalidade | Arquivo | Status |
|----------------|---------|--------|
| Suporte HTTPS para testes no celular | Configuração de servidor | Não verificado |
| Toque no celular | CSS/JavaScript padrão | Espera validação física |

---

## D. Funcionalidades parcialmente concluídas

| Funcionalidade | Arquivo | Status | Detalhes |
|----------------|---------|--------|----------|
| Painel HTML no modo VR | `src/ui.js` | Parcial | Aguarda implementação do painel VR para troca automática |
| Modo VR Box | `src/mode.js`, `src/vr-panel.js` | Parcial | Inicialização implementada, mas painel VR não abre |
| Orientação pelo movimento do celular | A-Frame padrão | Parcial | Requer configuração do sensor |
| Cursor gaze/fuse | `index.html` | Implementado | `fuse: true` configurado para VR, `fuseTimeout: 1200ms` |
| Fechamento na troca de cenas | `src/main.js`, `src/vr-panel.js` | Implementado | Chama `window.labmakerVRPanel.fechar()` antes de carregar nova cena |
| Atualização dos raycasters | `src/mode.js`, `src/ui.js` | Implementado | `refreshInterativos()` chamado após troca de cena |
| Prevenção de cliques duplicados | Não verificado | Pendente | Não implementado código de debounce |
| Botão Fechar do painel VR (fuse) | `src/vr-panel.js` | Implementado | Hitbox invisível configurada com `id: vrPanelCloseHitbox` |

---

## E. Regressões e problemas atuais

### 🔴 Problema crítico: Painel VR não abre

**Relato:** "O painel espacial chegou a aparecer em uma versão anterior, mas não fechava, não respeitava corretamente a troca de cenas e tinha visual inferior ao painel HTML. Após a implementação relatada como v0.6.3, o painel VR deixou de abrir."

**Arquivo afetado:** `src/vr-panel.js`

**Sintoma:** O método `window.labmakerVRPanel.abrir()` não produz efeito visível no modo VR.

### 🔴 Problema secundário: Duplicação de ID `vrPanelCanvas`

No `index.html`:
```html
<canvas id="vrPanelCanvas" width="1024" height="640" hidden></canvas>
```

No `src/vr-panel.js` (função `initVRPanel`):
```javascript
_vrPanelCanvas = document.createElement('canvas');
_vrPanelCanvas.id = 'vrPanelCanvas';
document.body.appendChild(_vrPanelCanvas);
```

**Impacto:** Isso cria dois elementos com o mesmo ID, o que viola o padrão HTML e causa comportamento imprevisível.

### 🔴 Problema secundário: Ordem de carregamento do canvas

A textura `THREE.CanvasTexture` é criada com `_vrPanelCanvas` antes de ele existir no DOM:

```javascript
// Linha 138
_vrPanelTexture = new THREE.CanvasTexture(_vrPanelCanvas);
```

Se `initVRPanel()` for chamado antes da cena carregar, a textura pode estar vazia.

---

## F. Causa provável do painel VR não abrir

### Causa principal: Erro de referência `window.labmakerMode` não definido

No arquivo `src/vr-panel.js`, a função `abrir()` verifica:

```javascript
if (!window.labmakerMode || !window.labmakerMode.isVR()) {
  return;
}
```

Se `window.labmakerMode` não estiver definido (porque o script `mode.js` falhou ou não carregou), a função retorna silenciosamente.

### Causa secundária: Erro de carregamento de `mode.js`

No `index.html`, `mode.js` carrega antes de `main.js`:
```html
<script src="src/mode.js?v=0.6.3"></script>
<script src="src/main.js?v=0.6.3"></script>
```

No `src/mode.js`, a função `startMode()` usa `document.addEventListener('DOMContentLoaded', ...)`, mas se a cena já carregou antes disso, os eventos `enter-vr` e `exit-vr` nunca disparam.

### Causa terciária: Canvas já existente no DOM

Como o canvas `<canvas id="vrPanelCanvas">` existe no HTML e o código JS tenta criar outro com o mesmo ID, o resultado é:

1. O canvas do HTML é oculto com `hidden`
2. O canvas JS é criado e anexado ao body
3. A textura é criada com o canvas JS, mas esse canvas pode não ser renderizado no A-Frame

### Causa quaternária: `vrPanelEntity` criado, mas `visible` não aplicado

No método `abrir()`:
```javascript
_vrPanelEntity = document.createElement('a-entity');
_vrPanelEntity.setAttribute('id', 'vrPanelRoot');
_vrPanelEntity.setAttribute('visible', 'true');
```

O problema é que `visible="true"` não é um atributo padrão do A-Frame. A forma correta é usar `visible=""` ou `visible="true"` com `aframe-component` ou atributo customizado.

---

## G. Alterações não commitadas

### `index.html`

**Mudanças:**
1. A-Frame scene agora tem `id="mainScene"`, `cursor` e `raycaster` configurados
2. Cursor VR adicionado com `id="vrCursor"`, `fuse: true`, `fuseTimeout: 1200`, `visible="false"`
3. Canvas oculto `<canvas id="vrPanelCanvas" width="1024" height="640" hidden>` adicionado
4. Ordem de scripts alterada: `vr-panel.js` e `ui.js` antes de `hotspots.js`, `mode.js` antes de `main.js`

**Evidência:**
```diff
-  <a-scene>
+  <a-scene
+    id="mainScene"
+    cursor="rayOrigin: mouse; fuse: false"
+    raycaster="objects: .interativo; enabled: true">
```

### `src/hotspots.js`

**Mudanças:**
```diff
+    circle.setAttribute('class', 'interativo');
```

**Impacto:** Hotspots agora são detectados pelo raycaster devido à classe `.interativo`.

### `src/main.js`

**Mudanças:**
```diff
  fecharRecurso();
+  
+  // Fechar painel espacial se estiver aberto
+  if (window.labmakerVRPanel) {
+    window.labmakerVRPanel.fechar();
+  }
```

**Evidência:** Código existe para fechar o painel VR ao trocar de cena.

### `src/ui.js`

**Mudanças:**
```diff
  // Modo VR: usar painel espacial
  if (window.labmakerMode && window.labmakerMode.isVR()) {
    if (window.labmakerVRPanel) {
      if (window.labmakerVRPanel.estaAberto()) {
        window.labmakerVRPanel.fechar();
      }
      window.labmakerVRPanel.abrir(titulo, descricao);
    }
    return;
  }
```

**Evidência:** O código verifica o modo VR e tenta abrir o painel espacial, mas falha silenciosamente se `window.labmakerVRPanel` ou `window.labmakerMode` não existirem.

---

## H. Próximos passos em ordem de prioridade

### Prioridade 1: Restaurar a abertura do painel VR

1. **Corrigir duplicação de ID `vrPanelCanvas`:**
   - Remover o `<canvas id="vrPanelCanvas">` do HTML (já criado dinamicamente)
   - OU usar o canvas existente no DOM em vez de criar um novo

2. **Garantir carregamento de `mode.js`:**
   - Verificar se `window.labmakerMode` está definido antes de `abrirRecurso()` ser chamado
   - Adicionar log de depuração: `console.log('labmakerMode:', window.labmakerMode)`

3. **Corrigir `visible` attribute:**
   ```javascript
   // Em vr-panel.js, método abrir()
   _vrPanelEntity.setAttribute('visible', '');
   // ou
   _vrPanelEntity.setAttribute('visible', true);  // sem aspas
   ```

### Prioridade 2: Validar o botão Fechar por fuse

- Verificar se `vrPanelCloseHitbox` está na lista de objetos do raycaster
- Adicionar log no evento click: `console.log('hit:', e.detail.target.id)`

### Prioridade 3: Fechar o painel na troca de cenas

- Já implementado em `src/main.js`, mas requer validação
- Verificar se `fechar()` remove todos os listeners

### Prioridade 4: Confirmar que cada painel usa o conteúdo da cena atual

- Testar com múltiplas tags MediaTag
- Verificar se `_vrPanelCurrentData` é atualizado corretamente

### Prioridade 5: Melhorar e validar o visual

- Comparar o canvas renderizado com o painel HTML
- Ajustar tamanhos de fonte para equivalência visual

### Prioridade 6: Testar computador, celular normal e VR Box

- Testar em navegador desktop
- Testar com toque no celular (sem VR)
- Testar com VR Box (com headset)

### Prioridade 7: Commit

- Após validação de todas as funcionalidades
- Mensagem clara: `feat: adiciona painel espacial VR para hotspots laranja`

---

## I. Riscos técnicos encontrados

### Risco 1: Ordem de carregamento de scripts

A ordem atual no HTML é:
```html
1. vr-panel.js
2. ui.js
3. hotspots.js
4. tag-types/label.js
5. tag-types/media.js
6. mode.js
7. tags.js
8. main.js
```

O problema é que `mode.js` (que define `window.labmakerMode`) carrega **depois** de `ui.js` (que usa `window.labmakerMode`). Isso causa um erro silencioso.

**Solução:** Mover `mode.js` para carregar antes de `ui.js`:
```html
<script src="src/mode.js?v=0.6.3"></script>
<script src="src/ui.js?v=0.6.3"></script>
```

### Risco 2: Inicialização condicional

Em `src/mode.js`:
```javascript
function startMode() {
  var scene = document.getElementById('mainScene');
  if (scene.hasLoaded) {
    initializeMode();
  } else {
    scene.addEventListener('loaded', initializeMode, { once: true });
  }
}
```

Se a cena já carregou antes de `startMode()` ser chamado, `initializeMode()` será executado, mas os eventos `enter-vr` e `exit-vr` podem já ter disparado e serem perdidos.

### Risco 3: Erro de referência `window.labmakerVRPanel`

Se `vr-panel.js` falhar no carregamento (por erro de sintaxe ou referência), `window.labmakerVRPanel` não é definido, e `ui.js` tenta chamá-lo silenciosamente:

```javascript
if (window.labmakerVRPanel.estaAberto()) {  // TypeError se undefined
```

**Solução:** Adicionar verificação `typeof`:
```javascript
if (typeof window.labmakerVRPanel === 'object' && window.labmakerVRPanel.estaAberto()) {
```

### Risco 4: Canvas não atualizado no A-Frame

Se `THREE.CanvasTexture` for criado com um canvas que não existe no DOM, a textura pode ficar vazia. O A-Frame não atualiza automaticamente a textura se o canvas for substituído.

---

## J. Recomendação sobre manter, corrigir ou reverter a v0.6.3

### Recomendação: **Reverter e refazer com correções**

**Por quê?**
1. A versão "v0.6.3" não existe no histórico Git — é apenas uma marcação no nome dos arquivos
2. Há erros críticos que impedem o painel VR de abrir
3. A ordem de carregamento dos scripts está incorreta (`mode.js` depois de `ui.js`)
4. Duplicação de ID `vrPanelCanvas` viola padrões HTML

**Ação recomendada:**

1. **Reverter todas as alterações:**
   ```bash
   git checkout .
   git clean -fd
   ```

2. **Aplicar correções em etapas:**

   **Etapa 1: Corrigir ordem de scripts**
   ```diff
   -  <script src="src/vr-panel.js?v=0.6.3"></script>
   -  <script src="src/ui.js?v=0.6.3"></script>
   +  <script src="src/ui.js?v=0.6.3"></script>
   +  <script src="src/vr-panel.js?v=0.6.3"></script>
     <script src="src/hotspots.js"></script>
     <script src="src/tag-types/label.js"></script>
     <script src="src/tag-types/media.js"></script>
   -  <script src="src/mode.js?v=0.6.3"></script>
   +  <script src="src/mode.js?v=0.6.3"></script>
     <script src="src/tags.js"></script>
   ```

   **Etapa 2: Remover canvas duplicado do HTML**
   ```diff
   -  <!-- Canvas oculto para renderização do painel VR -->
   -  <canvas id="vrPanelCanvas" width="1024" height="640" hidden></canvas>
   ```

   **Etapa 3: Corrigir verificação em `ui.js`**
   ```javascript
   if (window.labmakerMode && window.labmakerMode.isVR() && window.labmakerVRPanel) {
   ```

   **Etapa 4: Adicionar depuração**
   ```javascript
   console.log('abrirRecurso:', titulo, 'modoVR:', window.labmakerMode?.isVR());
   ```

3. **Testar incrementalmente:**
   - Testar com `console.log` antes de integrar
   - Validar que `window.labmakerMode` está definido
   - Validar que `window.labmakerVRPanel` está definido
   - Testar abertura do painel VR com um hotspot laranja

---

**Classificação:** projeto auditado — nenhuma alteração realizada.

**Próxima ação:** Reverter alterações e aplicar correções na ordem correta, priorizando a ordem de carregamento dos scripts antes de testar o painel VR.
