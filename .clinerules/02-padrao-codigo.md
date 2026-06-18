# Padrão de Código

## Regras gerais

1. Escrever código simples, legível e modular.
2. Evitar arquivos grandes.
3. Evitar duplicação.
4. Usar nomes claros para funções, variáveis e arquivos.
5. Não criar dependências externas sem justificativa.
6. Não misturar HTML, CSS e JavaScript em excesso depois do primeiro protótipo.
7. Separar dados das cenas da lógica de navegação.
8. Manter compatibilidade com desktop e celular.
9. O projeto deve funcionar localmente no navegador.

## Organização esperada

- `index.html`: estrutura principal do tour.
- `styles/main.css`: estilos da interface.
- `src/scenes.js`: dados das cenas.
- `src/hotspots.js`: criação e controle dos hotspots.
- `src/ui.js`: atualização de painéis e interface.
- `src/steps.js`: fluxo pedagógico.
- `src/main.js`: inicialização geral.

## Critérios mínimos de qualidade

- Console do navegador sem erros.
- Hotspots visíveis e clicáveis.
- Navegação previsível.
- Código compreensível para um desenvolvedor iniciante.
- Comentários curtos apenas quando forem úteis.