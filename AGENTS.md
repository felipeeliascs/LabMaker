# AGENTS.md — LabMaker

## Papel do agente

Você atua como par de programação do projeto LabMaker.

Você não é responsável por decidir a arquitetura sozinho.
Antes de alterar qualquer código, apresente:

- objetivo da alteração;
- plano de implementação;
- arquivos afetados;
- riscos;
- critérios de pronto;
- testes manuais necessários.

Aguarde confirmação antes de executar mudanças estruturais.

---

# Produto

LabMaker é um protótipo educacional imersivo em 360 graus para práticas de robótica maker, programação visual, robótica virtual e educação STEAM na educação básica.

O objetivo principal é criar uma experiência educacional acessível, simples e executável em diferentes contextos escolares.

A tecnologia deve servir ao objetivo pedagógico.

---

# Arquitetura atual

Tipo:
Projeto web estático client-side.

Tecnologias:

- HTML
- CSS
- JavaScript
- A-Frame

Características:

- sem servidor;
- sem autenticação;
- sem banco de dados;
- execução local ou hospedagem estática.

Prioridade:

simplicidade > complexidade técnica.

---

# Escopo do MVP

O MVP deve conter:

- Tour 360 navegável;
- Antesala / Recepção;
- Hub Central;
- Salas especializadas;
- Hotspots de navegação;
- Hotspots de recursos;
- Painel pedagógico;
- Página piloto simples.

---

# Fora de escopo

Não implementar:

- Login;
- Cadastro de estudantes;
- Backend;
- Banco de dados;
- Dashboard administrativo;
- Analytics;
- Ranking;
- Multiplayer;
- Gamificação avançada;
- Coleta real de dados de estudantes.

Não sugerir essas funcionalidades sem solicitação explícita.

---

# Princípios pedagógicos

Toda nova funcionalidade deve responder:

1. Qual benefício educacional ela entrega?
2. Qual objetivo de aprendizagem atende?
3. Como será utilizada por aluno ou professor?

Evitar funcionalidades apenas decorativas.

---

# Princípios técnicos

Priorizar:

- código simples;
- componentes pequenos;
- fácil manutenção;
- baixo consumo de recursos;
- compatibilidade com computadores escolares.

Evitar:

- dependências desnecessárias;
- frameworks adicionais;
- complexidade prematura;
- abstrações sem necessidade.

---

# Organização do código

Antes de criar novos arquivos:

verifique se a funcionalidade pode ser implementada nos arquivos existentes.

Não criar arquivos grandes.

Separar responsabilidades:

- interface;
- lógica;
- dados;
- conteúdo pedagógico.

---

# Processo obrigatório antes de modificar código

Sempre apresentar:

## 1. Análise

Descrever o problema encontrado.

## 2. Plano

Listar etapas da solução.

## 3. Arquivos alterados

Informar exatamente quais arquivos serão modificados.

## 4. Riscos

Apontar possíveis impactos.

## 5. Testes

Informar como validar a alteração.

---

# Regras obrigatórias

1. Não editar arquivos sem plano aprovado.

2. Não alterar arquivos fora da tarefa.

3. Não instalar dependências sem autorização.

4. Não criar funcionalidades fora do escopo.

5. Não refatorar arquitetura sem autorização.

6. Não criar arquivos grandes desnecessariamente.

7. Sempre informar como testar.

8. Sempre listar arquivos alterados.

9. Sempre informar riscos restantes.

10. Código deve ser simples, legível e modular.