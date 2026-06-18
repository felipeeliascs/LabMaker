# Roadmap do LabMaker — MVP

## Visão Geral

Este roadmap descreve os marcos planejados para o desenvolvimento do protótipo MVP do LabMaker. Cada dia representa uma etapa incremental, construída sobre a anterior.

## Marcos

### ✅ Dia 1 — Documentação Inicial (concluído)

- [x] Revisar estrutura do projeto
- [x] Criar `docs/mapa-cenas.md` — especificação das 6 cenas
- [x] Criar `docs/arquitetura.md` — arquitetura dos módulos
- [x] Criar `docs/roadmap-labmaker.md` — este documento
- [x] Criar `docs/checklist-testes.md` — cenários de teste
- [x] Criar `README.md` — apresentação do projeto

### 🔲 Dia 2 — Estrutura A-Frame Básica

**Objetivo:** Ter uma cena funcional no navegador.

- [ ] Criar `index.html` com A-Frame carregado via CDN
- [ ] Definir `<a-scene>` com câmera (`<a-camera>`) e `<a-sky>`
- [ ] Preencher `src/scenes.js` com dados das 6 cenas
- [ ] Implementar `src/main.js` — carregar cena inicial (Antesala/Recepção)
- [ ] Verificar que a imagem 360° renderiza corretamente
- [ ] Testar em desktop e celular

**Critério de pronto:** Ao abrir `index.html` no navegador, o estudante vê a Antesala/Recepção em 360°.

### 🔲 Dia 3 — Hotspots de Navegação

**Objetivo:** Navegar entre cenas clicando em hotspots.

- [ ] Implementar `src/hotspots.js` — função `criarHotspots(cena)`
- [ ] Implementar `src/hotspots.js` — função `navegarPara(destinoId)`
- [ ] Implementar `src/hotspots.js` — função `limparHotspots()`
- [ ] Posicionar hotspots de navegação na cena Antesala → Hub Central
- [ ] Posicionar hotspots no Hub Central → demais cenas
- [ ] Posicionar hotspots de volta ao Hub Central em cada cena
- [ ] Testar navegação completa entre todas as 6 cenas

**Critério de pronto:** O estudante consegue navegar entre todas as cenas clicando nos hotspots.

### 🔲 Dia 4 — Painel Pedagógico e UI

**Objetivo:** Exibir informações contextuais de cada cena.

- [ ] Estilizar `styles/main.css` — painel overlay, botões, tipografia
- [ ] Implementar `src/ui.js` — função `atualizarPainel(cena)`
- [ ] Exibir nome da cena, descrição e recursos disponíveis
- [ ] Implementar abertura/fechamento de recursos (texto, imagem, vídeo placeholder)
- [ ] Garantir que o painel não bloqueie a visão 360°
- [ ] Testar responsividade (desktop e celular)

**Critério de pronto:** Ao navegar para uma cena, o painel mostra informações corretas. Recursos podem ser abertos e fechados.

### 🔲 Dia 5 — Fluxo Pedagógico (Steps)

**Objetivo:** Guiar o estudante em uma sequência pedagógica.

- [ ] Implementar `src/steps.js` — sequência recomendada de cenas
- [ ] Função `proximaCena()` — sugerir próximo passo
- [ ] Função `cenaAtual()` — indicar progresso
- [ ] Exibir no painel a dica de próximo passo
- [ ] Função `resetarProgresso()` — reiniciar fluxo
- [ ] Testar fluxo completo do início ao fim

**Critério de pronto:** O painel mostra o progresso do estudante e sugere a próxima cena a visitar.

### 🔲 Dia 6 — Refinamentos e Testes Finais

**Objetivo:** Polir a experiência e garantir qualidade.

- [ ] Revisar console do navegador — zero erros
- [ ] Verificar hotspots visíveis e clicáveis em todas as cenas
- [ ] Testar navegação previsível (sem loops ou becos sem saída)
- [ ] Ajustar posicionamento dos hotspots (não flutuarem estranhamente)
- [ ] Verificar carregamento em conexão lenta (otimização de imagens se necessário)
- [ ] Testar em pelo menos 2 navegadores (Chrome, Edge)
- [ ] Testar em modo portrait e landscape no celular
- [ ] Rodar checklist de testes completo (`docs/checklist-testes.md`)

**Critério de pronto:** Checklist de testes aprovado. Console limpo. Navegação fluida.

### 🔲 Dia 7 — Página Piloto e Documentação Final

**Objetivo:** Preparar o projeto para o teste piloto.

- [ ] Criar landing page simples para o teste piloto (fora do tour 360)
- [ ] Incluir informações de contato/autor no README
- [ ] Revisar toda a documentação gerada
- [ ] Registrar dúvidas e observações para a próxima iteração
- [ ] Commit final do MVP

---

## Observações

- Os dias são sequenciais e incrementais. Cada dia depende do anterior.
- Se um dia não for concluído, os próximos devem ser ajustados no escopo.
- Testes manuais devem ser feitos ao final de cada dia (não apenas no Dia 6).
- Este roadmap pode ser revisado conforme o desenvolvimento avança.