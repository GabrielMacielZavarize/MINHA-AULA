# Minha Aula

Plataforma de gerenciamento de aulas particulares desenvolvida como projeto acadêmico no curso de Engenharia de Software.

## Visão Geral

O **Minha Aula** conecta professores e alunos em um marketplace de aulas particulares. Professores criam e gerenciam suas aulas; alunos encontram e agendam aulas disponíveis. A plataforma também cobre o ciclo financeiro completo: registro de pagamentos, relatórios e exportação em PDF.

## Funcionalidades

| Módulo | Descrição |
|---|---|
| **Autenticação** | Registro e login com Supabase Auth; papéis distintos (Professor / Aluno) |
| **Dashboard Professor** | Métricas de aulas, receita total, próximas aulas e pagamentos recentes |
| **Dashboard Aluno** | Marketplace para encontrar aulas disponíveis e visualizar aulas agendadas |
| **Agenda** | Visualização mensal/semanal de todas as aulas com filtros por status |
| **Alunos** | Listagem dos alunos com histórico de aulas e métricas individuais |
| **Financeiro** | Receitas por período, gráficos de evolução, top alunos e exportação PDF |
| **Notificações** | Alertas em tempo real (Supabase Realtime) para convites, cancelamentos e pagamentos |
| **Configurações** | Edição de perfil, troca de tema (claro/escuro) |

## Stack Tecnológica

- **Framework:** [Next.js 15](https://nextjs.org/) com App Router e React 19
- **Estilização:** [Tailwind CSS 3](https://tailwindcss.com/) + [Shadcn/UI](https://ui.shadcn.com/) (New York style)
- **Backend / Auth / DB:** [Supabase](https://supabase.com/) (PostgreSQL + Auth + Realtime)
- **Formulários:** [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Gráficos:** [Recharts](https://recharts.org/)
- **PDF:** [jsPDF](https://github.com/parallax/jsPDF)
- **Ícones:** [Lucide React](https://lucide.dev/)
- **Temas:** [next-themes](https://github.com/pacocoursey/next-themes)

## Arquitetura

```
FrontEnd/
├── app/                    # Next.js App Router
│   ├── page/               # Layout autenticado com sidebar
│   │   ├── layout.tsx      # Sidebar + header responsivo
│   │   ├── dashboard/      # Página inicial (professor ou aluno)
│   │   ├── calendar/       # Agenda
│   │   ├── students/       # Alunos
│   │   ├── financial/      # Financeiro
│   │   └── settings/       # Configurações
│   ├── login/              # Página de login (split layout)
│   ├── register/           # Página de cadastro (split layout)
│   └── globals.css         # Design tokens (CSS custom properties)
│
├── components/             # Componentes React
│   ├── ui/                 # Primitivos Shadcn/UI
│   ├── empty-state.tsx     # Estado vazio reutilizável
│   ├── stat-card.tsx       # Card de métrica reutilizável
│   ├── page-header.tsx     # Cabeçalho de página padronizado
│   ├── class-status-badge.tsx  # Badge de status de aula
│   ├── teacher-dashboard.tsx
│   ├── student-dashboard.tsx
│   ├── financial-view.tsx
│   ├── calendar-view.tsx
│   ├── students-view.tsx
│   └── notifications-view.tsx
│
├── hooks/                  # Custom React hooks
│   ├── use-classes.ts      # CRUD de aulas + estado
│   ├── use-students.ts     # CRUD de alunos + estado
│   ├── use-payments.ts     # CRUD de pagamentos + estado
│   ├── use-financial-stats.ts  # Cálculos financeiros, gráficos e filtros
│   └── use-toast.ts        # Sistema de toast notifications
│
└── lib/                    # Utilitários e integrações
    ├── supabase/           # Camada de dados por domínio
    │   ├── client.ts       # Instância do cliente Supabase
    │   ├── types.ts        # Interfaces TypeScript (Profile, Class, Payment, etc.)
    │   ├── profiles.ts     # CRUD de perfis de usuário
    │   ├── classes.ts      # CRUD de aulas + convites + reagendamento
    │   ├── students.ts     # Consultas de alunos
    │   ├── payments.ts     # CRUD de pagamentos
    │   └── notifications.ts # CRUD de notificações
    ├── supabase-db.ts      # Re-export barrel (compatibilidade)
    ├── pdf-generator.ts    # Geração de relatório financeiro em PDF
    └── utils.ts            # Funções auxiliares (formatCurrency, cn, etc.)
```

### Padrões de Design

- **Design tokens:** todas as cores via variáveis CSS `hsl(var(--token))` — dark mode controlado exclusivamente em `globals.css`
- **Componentes reutilizáveis:** `EmptyState`, `StatCard`, `PageHeader`, `ClassStatusBadge` evitam repetição de código
- **Separação de responsabilidades:** lógica de negócio nos hooks, acesso ao banco na camada `lib/supabase/`, apresentação nos componentes
- **Sem dark: hardcoded:** nenhum `dark:slate-*` ou `dark:text-white` inline nos componentes

## Como Rodar

### Pré-requisitos

- Node.js 18+
- Conta no [Supabase](https://supabase.com/)

### 1. Instalar dependências

```bash
cd FrontEnd
npm install
```

### 2. Configurar variáveis de ambiente

Crie um arquivo `.env.local` dentro de `FrontEnd/`:

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
```

### 3. Configurar o banco de dados

Execute o arquivo `supabase_schema.sql` no SQL Editor do seu projeto Supabase para criar as tabelas necessárias.

### 4. Iniciar o servidor de desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

### 5. Build de produção

```bash
npm run build
npm start
```

## Banco de Dados

### Tabelas principais

| Tabela | Descrição |
|---|---|
| `profiles` | Dados dos usuários (professores e alunos) |
| `classes` | Aulas: status, data, horário, valor, professor e aluno |
| `payments` | Registro de pagamentos vinculados a aulas |
| `notifications` | Notificações por usuário |
| `reschedule_requests` | Solicitações de reagendamento |
| `tags` / `class_tags` | Tags categorizando as aulas |

### Papéis de usuário

- **Professor (`teacher`):** cria e gerencia aulas, visualiza alunos e financeiro
- **Aluno (`student`):** navega no marketplace, agenda aulas, acompanha seu histórico

## Contribuidores

Projeto desenvolvido por alunos do curso de Engenharia de Software.
