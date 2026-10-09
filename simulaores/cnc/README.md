# Simulador CNC laser do Labmaker

Simulação visual de corte de desenhos em MDF, com importação local de SVG e G-code. Interface em português e robô UR5 opcional.

## Executar

Requer Node.js 22.12 ou superior.

```sh
npm ci
npm run dev
```

Abra http://localhost:3000. Importe um arquivo ou carregue o desenho de exemplo, ligue a máquina, mantenha a tampa fechada e inicie o corte. A importação seleciona o modo automático. A aba Robô UR5 permite carregar o robô quando necessário.

## Integrar ao Labmaker

```sh
npm run build
```

A exportação é gerada em `dist/`, sem servidor Next.js em produção. O hotspot utiliza `simulaores/cnc/dist/index.html`. Sirva o diretório raiz do Labmaker por HTTP; abrir diretamente com `file://` não funciona.

O caminho padrão de produção é `/simulaores/cnc/dist`. Para outro prefixo, defina `NEXT_PUBLIC_BASE_PATH` antes do build (por exemplo, `/LabMaker/simulaores/cnc/dist` em uma hospedagem sob /LabMaker). HTML precisa ser revalidado; arquivos com hash podem receber `Cache-Control: public, max-age=31536000, immutable` no servidor.

O Labmaker suspende o loop 3D enquanto a atividade está aberta e descarrega o iframe ao fechar. Ocultar a página pausa o corte; a retomada exige clicar em Continuar corte.

## Modelos

- `assets/source/`: STLs originais preservados, fora da pasta pública.
- `assets/optimized-stl/`: cópias binárias simplificadas.
- `public/models/`: GLBs indexados com compressão Meshopt e nomes com hash.
- `src/lib/machine/modelManifest.json`: caminhos e limites originais que preservam o pivô da tampa.

Para regenerar os modelos:

```sh
npm run models:build
npm test
npm run build
```

A simplificação roda offline. Não há conversão de STL durante o uso do simulador. O relatório em [docs/otimizacao.md](docs/otimizacao.md) registra os resultados e as limitações.

## Validação

```sh
npm run typecheck
npm run lint
npm test
```

Os testes cobrem o interpretador G-code, intertravamentos, avanço independente da taxa de quadros, pausa, reinício, renderização sob demanda, decodificação dos modelos, coordenadas e ciclos de liberação/reabertura.

## Sobre / Informações

Este simulador é um fork do projeto original **ThreeJS-CNC**, adaptado para o Labmaker. A identificação da origem também está disponível no painel Sobre / Informações da aplicação.

O projeto original usa a licença MIT. Os avisos obrigatórios estão preservados em [LICENSE](LICENSE) e na cópia publicada em `public/LICENSE.txt`. O endereço do repositório original ainda precisa ser confirmado.

## Formatos de corte

SVG: contornos vetoriais, curvas e transformações, com unidades físicas quando disponíveis. Texto e imagens precisam ser convertidos em caminhos antes da importação.

G-code: movimentos XY G0/G1, arcos G2/G3 com I/J, unidades G20/G21, coordenadas G90/G91 e comandos M3/M4/M5, S e F. Recursos não suportados são rejeitados explicitamente.

Limites: 2 MB por arquivo, 50 mil segmentos e área útil de 960 × 720 mm. O sulco é uma representação visual progressiva na superfície; não há remoção volumétrica do MDF nem controle de equipamento físico.
