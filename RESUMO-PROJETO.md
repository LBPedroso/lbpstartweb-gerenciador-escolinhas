# Resumo de Evolucao - R Sports

## 0. Versao atual
- v1.0-demo
- Marco de apresentacao comercial validado para escolinha.
- Fluxos principais operando com estabilidade para demo e uso inicial.

## 1. Objetivo atingido
- Entrega de um MVP comercial de entrada para gestao de escolinha.
- Produto funcional para operacao real e apresentacao a prospects.
- Base preparada para evolucoes futuras (seguranca, permissoes e BI avancado).

## 2. Escopo implementado
- Cadastro e gestao de alunos.
- Ficha completa do aluno com historico financeiro.
- Registro de mensalidades com competencia (mes/ano) separada da data de caixa.
- Cancelamento de pagamento direto no historico.
- Modulo completo de despesas (cadastro, edicao, exclusao e listagem).
- Parcelamento de despesas com geracao automatica por meses.
- Dashboard gerencial com KPIs de alunos, receitas e despesas.
- Filtros por status em pagamentos e despesas (todos, pago, pendente).
- Analise de periodo mensal, anual e personalizado.
- Blocos visuais de receita x despesa e despesas por categoria.
- Capa de apresentacao sob demanda (via query `?capa=1`).
- Upload local de foto de aluno com fallback de avatar.
- Suporte a logo oficial da marca na capa.

## 3. Decisoes de produto e arquitetura
- Entrega por fases para reduzir risco e manter estabilidade.
- Separacao entre competencia financeira e data de recebimento.
- Uso de Server Actions para fluxo simples e manutencao rapida.
- Uso de query params para filtros e feedback de acoes.
- MVP sem autenticacao nesta fase para acelerar validacao comercial.

## 4. Problemas relevantes resolvidos
- Correcao de parse de valor monetario em formulario de pagamento.
- Correcao de uso de enum em runtime no modulo de despesas.
- Atualizacao de Prisma Client apos alteracoes de schema.
- Contorno de conflitos de `next dev` com multiplos processos/portas.
- Correcao de imagem quebrada em foto/logo com fallback visual.
- Correcao de travamento da capa (logica de exibicao e hidratacao).
- Estabilizacao da capa para uso sob demanda, sem impacto no fluxo normal.

## 5. Estado atual do sistema
- Sistema funcional e estavel para entrada comercial.
- Fluxos principais operando: alunos, pagamentos, despesas e dashboard.
- Capa controlada por atalho no dashboard e por `?capa=1`.
- Logo oficial carregada a partir de `public/uploads/logo-rsports.png`.

## 6. Caminho recomendado de evolucao
### Fase 1 - Seguranca basica
- Login com usuario e senha.
- Sessao autenticada.
- Protecao de rotas.

### Fase 2 - Governanca
- Perfis e permissoes (admin, financeiro, secretaria, treinador).
- Log de acoes criticas.
- Recuperacao de senha.

### Fase 3 - Inteligencia de negocio
- Indicadores por categoria/turma/periodo.
- Relatorios executivos.
- Exportacoes para tomada de decisao.

### Fase 4 - Escala comercial
- Multiunidade/multicliente.
- Branding por cliente.
- Planos e cobranca recorrente.

## 7. Rotina de trabalho que funcionou
- Implementar em blocos pequenos.
- Validar (`lint/build`) a cada bloco.
- Versionar por fase com commit objetivo.
- Priorizar estabilidade antes de abrir nova frente.

## 8. Guia rapido para retomada futura
1. Atualizar repositorio local.
2. Rodar instalacao e validacao basica.
3. Definir fase da vez (seguranca, permissoes ou BI).
4. Implementar somente o escopo da fase.
5. Validar, versionar e documentar mudancas.
