# Checklist de Testes — LabMaker

## Instruções

Este checklist deve ser executado manualmente após cada dia de desenvolvimento. Marque ✅ se o teste passar, ❌ se falhar.

**Ambiente de teste recomendado:**
- Navegador: Chrome (última versão) e Edge
- Dispositivo: Desktop e celular (ou emulação via DevTools)
- Resolução mínima de teste: 1366×768 (desktop), 375×667 (celular iPhone SE)
- Servidor: Live Server do VS Code ou `npx serve` ou `python -m http.server`

---

## Dia 2 — Estrutura A-Frame Básica

| # | Teste | Resultado |
|---|---|---|
| 2.1 | O `index.html` carrega sem erros no console do navegador | ✅ / ❌ |
| 2.2 | O A-Frame é carregado via CDN (verificar network tab) | ✅ / ❌ |
| 2.3 | A cena inicial (Antesala/Recepção) é exibida em 360° | ✅ / ❌ |
| 2.4 | A imagem panorâmica preenche todo o campo de visão | ✅ / ❌ |
| 2.5 | A câmera permite olhar em todas as direções (arrastar/gyroscope) | ✅ / ❌ |
| 2.6 | A página funciona em modo retrato e paisagem no celular | ✅ / ❌ |

## Dia 3 — Hotspots de Navegação

| # | Teste | Resultado |
|---|---|---|
| 3.1 | Hotspots de navegação estão visíveis na Antesala/Recepção | ✅ / ❌ |
| 3.2 | Clicar no hotspot "Entrar no Hub Central" navega para o Hub Central | ✅ / ❌ |
| 3.3 | Hub Central exibe 4 hotspots para as áreas temáticas + 1 para voltar | ✅ / ❌ |
| 3.4 | Cada hotspot de área temática navega para a cena correta | ✅ / ❌ |
| 3.5 | Cada cena temática tem um hotspot "Voltar ao Hub Central" | ✅ / ❌ |
| 3.6 | Navegação de volta à Antesala funciona do Hub Central | ✅ / ❌ |
| 3.7 | Hotspots são clicáveis via clique (desktop) e toque (celular) | ✅ / ❌ |
| 3.8 | Não há hotspots sobrepostos ou fora do campo de visão inicial | ✅ / ❌ |

## Dia 4 — Painel Pedagógico e UI

| # | Teste | Resultado |
|---|---|---|
| 4.1 | O painel pedagógico aparece como overlay sobre a cena 360° | ✅ / ❌ |
| 4.2 | O painel mostra o nome correto da cena atual | ✅ / ❌ |
| 4.3 | O painel mostra a descrição correta da cena atual | ✅ / ❌ |
| 4.4 | O painel mostra os recursos disponíveis na cena atual | ✅ / ❌ |
| 4.5 | Hotspots de recurso abrem o conteúdo correspondente (texto, imagem) | ✅ / ❌ |
| 4.6 | O conteúdo do recurso pode ser fechado | ✅ / ❌ |
| 4.7 | O painel não bloqueia a visão 360° | ✅ / ❌ |
| 4.8 | O painel é responsivo (funciona em desktop e celular) | ✅ / ❌ |
| 4.9 | A UI não tem sobreposição ou quebra visual | ✅ / ❌ |

## Dia 5 — Fluxo Pedagógico (Steps)

| # | Teste | Resultado |
|---|---|---|
| 5.1 | O painel mostra o progresso do estudante (ex: "Cena 2 de 6") | ✅ / ❌ |
| 5.2 | O painel sugere a próxima cena a visitar | ✅ / ❌ |
| 5.3 | A sequência pedagógica segue a ordem definida em `steps.js` | ✅ / ❌ |
| 5.4 | Ao concluir todas as cenas, o fluxo indica conclusão | ✅ / ❌ |
| 5.5 | A função `resetarProgresso()` funciona corretamente | ✅ / ❌ |

## Dia 6 — Refinamentos e Testes Finais

| # | Teste | Resultado |
|---|---|---|
| 6.1 | Console do navegador sem erros (0 erros, 0 warnings) | ✅ / ❌ |
| 6.2 | Hotspots visíveis em todas as 6 cenas | ✅ / ❌ |
| 6.3 | Navegação previsível — sem loops, sem becos sem saída | ✅ / ❌ |
| 6.4 | Posicionamento dos hotspots coerente (não flutuam ou somem) | ✅ / ❌ |
| 6.5 | Carregamento em conexão lenta (testar com throttling: Slow 3G) | ✅ / ❌ |
| 6.6 | Funciona no Chrome e Edge (testar nos dois) | ✅ / ❌ |
| 6.7 | Funciona em modo retrato e paisagem no celular | ✅ / ❌ |
| 6.8 | Todos os testes dos Dias 2, 3, 4 e 5 estão verdes | ✅ / ❌ |

---

## Resumo

| Dia | Testes totais | Aprovados | Falhos | Observações |
|---|---|---|---|---|
| Dia 2 | 6 | | | |
| Dia 3 | 8 | | | |
| Dia 4 | 9 | | | |
| Dia 5 | 5 | | | |
| Dia 6 | 8 | | | |
| **Total** | **36** | | | |

---

## Como usar

1. Execute os testes na ordem dos dias (cada dia depende do anterior).
2. Para cada teste, marque ✅ ou ❌ na coluna "Resultado".
3. Se um teste falhar, registre o erro em "Observações" e não prossiga para o próximo dia até resolver.
4. Ao final do Dia 6, preencha a tabela de resumo.