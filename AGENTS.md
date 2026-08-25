---

# Sistema de interações

O projeto possui uma camada de interações sobre as cenas 360.

Elementos existentes:

- Hotspots de navegação;
- Hotspots de recursos;
- Tags interativas.

As novas interações devem:

- reutilizar a arquitetura existente quando possível;
- evitar duplicação de lógica;
- manter compatibilidade com hotspots antigos;
- priorizar baixo consumo de recursos.

Não substituir funcionalidades existentes sem autorização.

---

# Controle de versão

O projeto utiliza Git para controle de alterações.

Antes de alterações significativas:

- verificar o estado atual do repositório;
- informar arquivos modificados;
- sugerir criação de commit após conclusão.

Nunca executar sem autorização:

- git reset;
- git clean;
- remoção de arquivos;
- alterações destrutivas de histórico.

O agente deve considerar que cada alteração deve ser reversível.

---

# Desenvolvimento incremental

Implementações devem ser pequenas e verificáveis.

Preferir:

- uma funcionalidade por vez;
- testes após cada alteração;
- commits frequentes;
- mudanças isoladas.

Evitar:

- grandes refatorações;
- múltiplas funcionalidades em uma única alteração;
- mudanças arquiteturais sem validação.