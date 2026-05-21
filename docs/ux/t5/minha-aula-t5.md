# T5) Arquitetura da Informacao + User Flow

Nome do Projeto: MINHA-AULA

Grupo: [Preencher com os nomes dos integrantes]

## 1. User Flow (Fluxo Critico: Professor cria e gerencia aula)

Diagrama do User Flow:

- [User flow do professor em SVG](/home/gabrielmaciel/MINHA-AULA/docs/ux/t5/minha-aula-userflow-professor.svg)
- [User flow do professor em Mermaid](/home/gabrielmaciel/MINHA-AULA/docs/ux/t5/minha-aula-userflow-professor.mmd)
- Inserir no PDF um print desse diagrama, preferencialmente importado no Figma.

Tabela:

| Etapa | Acao / Tela | Condicao / Decisao | Proximo Passo |
| --- | --- | --- | --- |
| 1 | Inicio | - | Login / Cadastro |
| 2 | Login / Cadastro | Autenticado? | Se nao, permanece no fluxo de acesso; se sim, vai para o Dashboard do professor |
| 3 | Dashboard do professor | - | Acessa Gerenciar Aulas |
| 4 | Gerenciar Aulas | - | Clica em Nova Aula |
| 5 | Modal Nova Aula | - | Preenche materia, data, horario, duracao, valor e observacoes |
| 6 | Preenchimento da aula | Informou matricula? | Se nao, salva aula aberta; se sim, valida a matricula |
| 7 | Validacao de matricula | Aluno encontrado? | Se nao, exibe erro e retorna ao formulario; se sim, prepara o convite da aula |
| 8 | Persistencia da aula | Tipo de criacao | Se aberta, salva com status `open`; se vinculada por matricula, salva com status `pending_approval` e notifica o aluno |
| 9 | Lista Gerenciar Aulas | Precisa editar ou gerenciar? | Se nao, encerra o fluxo; se sim, abre Editar Aula |
| 10 | Modal Editar Aula | - | Ajusta dados da aula, altera status e gerencia pagamento |
| 11 | Gestao posterior | - | Retorna para Gerenciar Aulas e encerra o fluxo |

## 2. Sitemap Simples (Mapa de Telas)

Diagrama do Sitemap:

- [Sitemap em SVG](/home/gabrielmaciel/MINHA-AULA/docs/ux/t5/minha-aula-sitemap.svg)
- [Sitemap em Mermaid](/home/gabrielmaciel/MINHA-AULA/docs/ux/t5/minha-aula-sitemap.mmd)
- Inserir no PDF um print desse diagrama, preferencialmente importado no Figma.

Estrutura de navegacao representada no sitemap:

- Acesso
- `/`: verifica sessao e redireciona
- `Login`
- `Cadastro`
- `/dashboard`: redirecionamento para a area autenticada
- Area autenticada
- Professor: `Dashboard`, `Gerenciar Aulas`, `Agenda`, `Meus Alunos`, `Financeiro`, `Notificacoes`, `Configuracoes`
- Aluno: `Encontrar Aulas`, `Minhas Aulas`, `Meus Professores`, `Notificacoes`, `Configuracoes`

## Observacoes de preenchimento

- O sitemap reflete a navegacao atual em `app/page/*`.
- Rotas legadas ou apenas de compatibilidade ficaram fora do diagrama principal: `/dashboard/settings`, links com `?tab=` e `/page/dashboard/appointments`.
- O user flow foi baseado no comportamento real de `createClass`, `getStudentByEnrollment` e `updateClass`.
- Como o conector do Figma nao ficou exposto como ferramenta chamavel nesta sessao, os diagramas foram gerados em SVG para importacao direta no Figma.
- Para Miro, os arquivos Mermaid permitem editar o conteudo pelo codigo no app Mermaid, o que costuma ser melhor que subir um SVG pronto.

## Base usada no codigo

- [layout autenticado](/home/gabrielmaciel/MINHA-AULA/FrontEnd/app/page/layout.tsx)
- [gerenciamento de aulas](/home/gabrielmaciel/MINHA-AULA/FrontEnd/app/page/dashboard/classes/page.tsx)
- [agenda do aluno](/home/gabrielmaciel/MINHA-AULA/FrontEnd/app/page/dashboard/schedule/page.tsx)
- [configuracoes](/home/gabrielmaciel/MINHA-AULA/FrontEnd/components/settings-view.tsx)
- [notificacoes](/home/gabrielmaciel/MINHA-AULA/FrontEnd/components/notifications-view.tsx)
- [regras de classes e status](/home/gabrielmaciel/MINHA-AULA/FrontEnd/lib/supabase-db.ts)

## Como usar no Figma

1. Crie ou abra um arquivo no Figma.
2. Crie uma pagina chamada `T5 - Arquitetura da Informacao e User Flow`.
3. Arraste os dois SVGs para dentro dessa pagina.
4. Ajuste a escala e exporte ou tire o print para colar no template do PDF.
