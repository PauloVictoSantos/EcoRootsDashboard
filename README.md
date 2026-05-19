<div align="center">

<img src="https://eco-roots-dashboard.vercel.app/logoecoroots.jpg" alt="EcoRoots Logo" width="120" />

# 🌿 EcoRoots — Monitor de Plantas

**Dashboard inteligente para monitoramento de estufas hidropônicas em tempo real**

[![Deploy on Vercel](https://img.shields.io/badge/Deploy-Vercel-black?style=for-the-badge&logo=vercel)](https://eco-roots-dashboard.vercel.app/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.io/)
[![Gemini AI](https://img.shields.io/badge/Gemini-AI-4285F4?style=for-the-badge&logo=google)](https://deepmind.google/technologies/gemini/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

> Sistema integrado com **Supabase** e **Gemini AI** para monitoramento em tempo real de temperatura, luminosidade, sensores e atuadores de estufas hidropônicas — desenvolvido no Amazonas. 🌱

[🚀 Demo ao vivo](https://eco-roots-dashboard.vercel.app/) · [📋 Relatórios](https://eco-roots-dashboard.vercel.app/relatorios) · [🐛 Reportar bug](../../issues) · [✨ Solicitar feature](../../issues)

</div>

---

## 📋 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Funcionalidades](#-funcionalidades)
- [Stack Tecnológica](#-stack-tecnológica)
- [Arquitetura](#-arquitetura)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação e Configuração](#-instalação-e-configuração)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)
- [Estrutura de Pastas](#-estrutura-de-pastas)
- [Banco de Dados](#-banco-de-dados)
- [Funcionalidades em Detalhe](#-funcionalidades-em-detalhe)
- [API e Integrações](#-api-e-integrações)
- [Deploy](#-deploy)
- [Contribuindo](#-contribuindo)
- [Roadmap](#-roadmap)
- [Licença](#-licença)

---

## 🌿 Sobre o Projeto

O **EcoRoots** é um dashboard web para **monitoramento inteligente de estufas hidropônicas**, desenvolvido para fornecer dados em tempo real sobre o estado das plantas, condições ambientais e status dos equipamentos.

O sistema coleta dados de sensores físicos (temperatura do ar, temperatura da água, luminosidade/UV) e os exibe de forma visual e intuitiva. Integrado ao **Gemini AI (Google)**, o EcoRoots é capaz de gerar **análises automáticas** e alertas baseados nos dados coletados, auxiliando produtores a tomarem decisões mais inteligentes.

### 🎯 Problema que resolve

Em estufas hidropônicas, o controle preciso de variáveis ambientais é crítico. Temperaturas da água acima de 24 °C, por exemplo, reduzem o oxigênio dissolvido e aumentam o risco de doenças como o *Pythium*. Sem um sistema de monitoramento centralizado, esses desvios podem causar perda total de plantações.

O EcoRoots centraliza essas informações, automatiza alertas e oferece análise por IA, tudo em uma interface moderna e acessível por qualquer dispositivo.

---

## ✨ Funcionalidades

### Dashboard Principal
- 📊 **Monitoramento em tempo real** — temperatura do ar, luminosidade (lux/UV) e temperatura da água
- 🌡️ **Indicadores visuais de status** — escalas com zonas críticas e ideais (ex.: temperatura ideal entre 18–24 °C)
- 🔄 **Atualização manual e automática** dos dados de sensores
- 🗺️ **Mapa visual das plantas** — localização de cada planta dentro da estufa
- ⚡ **Painel de atuadores** — controle e visualização do estado de equipamentos (bombas, ventiladores, iluminação)
- 🌞 **Ciclo de luminosidade** — monitoramento do ciclo de luz com horas ligada/escura e estado atual (acesa/apagada)

### Relatórios
- 📈 **Histórico completo** de leituras por planta e por sensor
- 📉 **Gráficos de evolução** temporal das variáveis monitoradas
- 🔬 **Análise individual por planta** com histórico detalhado

### Inteligência Artificial
- 🤖 **Análise por Gemini AI** — insights automáticos sobre o estado da estufa
- ⚠️ **Alertas inteligentes** baseados em padrões anômalos nos dados
- 💡 **Recomendações agronômicas** com base nas leituras

### Infraestrutura
- ☁️ **Backend serverless** com Supabase (PostgreSQL + Realtime)
- 🌐 **Deploy na Vercel** com CI/CD automático
- 📱 **Interface responsiva** para acesso via desktop e mobile

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia | Finalidade |
|---|---|---|
| **Frontend** | [Next.js 15](https://nextjs.org/) (App Router) | Framework React com SSR/SSG |
| **Linguagem** | [TypeScript 5](https://www.typescriptlang.org/) | Tipagem estática e segurança |
| **Estilização** | [Tailwind CSS](https://tailwindcss.com/) | Estilização utilitária |
| **Backend / DB** | [Supabase](https://supabase.io/) | PostgreSQL + Auth + Realtime |
| **IA** | [Google Gemini AI](https://deepmind.google/technologies/gemini/) | Análise e recomendações |
| **Deploy** | [Vercel](https://vercel.com/) | Hospedagem + Edge Functions |
| **Gráficos** | Recharts / Chart.js | Visualização de dados históricos |

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                        Cliente (Browser)                    │
│                     Next.js 15 App Router                   │
│   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   │
│   │  Dashboard   │   │  Relatórios  │   │  Mapa/Mapa   │   │
│   │   /          │   │  /relatorios │   │  Plantas     │   │
│   └──────┬───────┘   └──────┬───────┘   └──────┬───────┘   │
└──────────┼─────────────────┼─────────────────┼────────────┘
           │                 │                 │
           ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────┐
│                   Next.js API Routes / Server Actions        │
│         (Leitura de sensores, acionamento de atuadores)      │
└────────────────┬───────────────────────┬────────────────────┘
                 │                       │
        ┌────────▼────────┐    ┌─────────▼──────────┐
        │   Supabase      │    │   Google Gemini AI  │
        │  (PostgreSQL +  │    │  (Análise de dados  │
        │   Realtime)     │    │   e recomendações)  │
        └────────┬────────┘    └────────────────────┘
                 │
        ┌────────▼────────┐
        │  Sensores IoT   │
        │  (Temperatura,  │
        │  Luminosidade,  │
        │  Atuadores)     │
        └─────────────────┘
```

O fluxo de dados segue o modelo:

1. **Sensores físicos** enviam leituras para o Supabase via HTTP ou MQTT
2. O **Next.js** consome os dados via Supabase Client (Realtime ou polling)
3. A **Gemini AI** analisa os dados sob demanda e retorna insights
4. O **dashboard** exibe tudo em tempo real para o usuário

---

## 📦 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- [Node.js](https://nodejs.org/) `>= 18.x`
- [npm](https://www.npmjs.com/) `>= 9.x` ou [pnpm](https://pnpm.io/) `>= 8.x`
- Conta no [Supabase](https://supabase.io/) (gratuita)
- Chave de API do [Google Gemini AI](https://aistudio.google.com/)
- Conta na [Vercel](https://vercel.com/) (para deploy)

---

## 🚀 Instalação e Configuração

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/eco-roots-dashboard.git
cd eco-roots-dashboard
```

### 2. Instale as dependências

```bash
npm install
# ou
pnpm install
```

### 3. Configure as variáveis de ambiente

Copie o arquivo de exemplo e preencha com suas credenciais:

```bash
cp .env.example .env.local
```

Edite o `.env.local` com suas chaves (veja a seção [Variáveis de Ambiente](#-variáveis-de-ambiente)).

### 4. Configure o banco de dados no Supabase

Execute os scripts SQL da pasta `/database` no SQL Editor do Supabase:

```bash
# Ordem de execução:
database/01_schema.sql      # Criação das tabelas
database/02_rls.sql         # Políticas de segurança (Row Level Security)
database/03_functions.sql   # Funções e triggers
database/04_seed.sql        # Dados iniciais (opcional)
```

### 5. Execute em desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) no navegador.

---

## 🔐 Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```env
# ─── Supabase ─────────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# ─── Google Gemini AI ─────────────────────────────────────────
GEMINI_API_KEY=your_gemini_api_key

# ─── App ──────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=EcoRoots
```

> ⚠️ **Atenção:** nunca commite o `.env.local` no repositório. Ele já está incluído no `.gitignore`.

---

## 📁 Estrutura de Pastas

```
eco-roots-dashboard/
├── 📁 app/                         # App Router do Next.js
│   ├── 📁 (dashboard)/             # Grupo de rotas do dashboard
│   │   ├── page.tsx                # Página principal — /
│   │   └── relatorios/
│   │       └── page.tsx            # Página de relatórios — /relatorios
│   ├── 📁 api/                     # API Routes
│   │   ├── sensores/
│   │   │   └── route.ts            # Endpoint de leitura de sensores
│   │   ├── atuadores/
│   │   │   └── route.ts            # Endpoint de controle de atuadores
│   │   └── ia/
│   │       └── route.ts            # Endpoint de análise com Gemini AI
│   ├── layout.tsx                  # Layout raiz
│   └── globals.css                 # Estilos globais
│
├── 📁 components/                  # Componentes React reutilizáveis
│   ├── 📁 dashboard/
│   │   ├── TemperaturaCard.tsx     # Card de temperatura
│   │   ├── LuminosidadeCard.tsx    # Card de luminosidade
│   │   ├── CicloLuz.tsx           # Componente do ciclo de luz
│   │   ├── MapaPlantas.tsx         # Mapa visual das plantas
│   │   └── AtuadoresPanel.tsx      # Painel de atuadores
│   ├── 📁 relatorios/
│   │   ├── GraficoEvolucao.tsx     # Gráficos históricos
│   │   └── TabelaLeituras.tsx      # Tabela de leituras
│   └── 📁 ui/                      # Componentes de UI genéricos
│       ├── Badge.tsx
│       ├── Card.tsx
│       └── Skeleton.tsx
│
├── 📁 lib/                         # Utilitários e configurações
│   ├── supabase/
│   │   ├── client.ts               # Cliente Supabase (browser)
│   │   └── server.ts               # Cliente Supabase (server)
│   ├── gemini.ts                   # Configuração do Gemini AI
│   └── utils.ts                    # Funções utilitárias
│
├── 📁 hooks/                       # React Hooks customizados
│   ├── useSensores.ts              # Hook de dados dos sensores
│   ├── usePlantas.ts               # Hook de dados das plantas
│   └── useAtuadores.ts             # Hook de controle dos atuadores
│
├── 📁 types/                       # Tipagens TypeScript
│   ├── sensores.ts
│   ├── plantas.ts
│   └── atuadores.ts
│
├── 📁 database/                    # Scripts SQL do Supabase
│   ├── 01_schema.sql
│   ├── 02_rls.sql
│   └── 03_functions.sql
│
├── 📁 public/                      # Assets estáticos
│   └── logoecoroots.jpg
│
├── .env.example                    # Exemplo de variáveis de ambiente
├── .env.local                      # Variáveis de ambiente (não commitado)
├── next.config.ts                  # Configuração do Next.js
├── tailwind.config.ts              # Configuração do Tailwind CSS
├── tsconfig.json                   # Configuração do TypeScript
└── package.json
```

---

## 🗄️ Banco de Dados

O EcoRoots utiliza **PostgreSQL via Supabase**. Abaixo estão as principais tabelas:

### `plantas`
| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | `uuid` | Identificador único |
| `nome` | `text` | Nome da planta |
| `especie` | `text` | Espécie botânica |
| `posicao_x` | `int` | Posição X no mapa da estufa |
| `posicao_y` | `int` | Posição Y no mapa da estufa |
| `status` | `text` | `saudavel`, `atencao`, `critico` |
| `criado_em` | `timestamptz` | Data de cadastro |

### `leituras_sensores`
| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | `uuid` | Identificador único |
| `planta_id` | `uuid` | FK → plantas |
| `temperatura_ar` | `float` | Temperatura do ar (°C) |
| `temperatura_agua` | `float` | Temperatura da água (°C) |
| `luminosidade` | `float` | Luminosidade em lux |
| `uv` | `float` | Índice UV |
| `lido_em` | `timestamptz` | Timestamp da leitura |

### `atuadores`
| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | `uuid` | Identificador único |
| `nome` | `text` | Nome do atuador |
| `tipo` | `text` | `bomba`, `ventilador`, `luz`, `aquecedor` |
| `status` | `bool` | `true` = ligado, `false` = desligado |
| `atualizado_em` | `timestamptz` | Último acionamento |

---

## 🔍 Funcionalidades em Detalhe

### 🌡️ Monitoramento de Temperatura

O sistema monitora a temperatura do ar em tempo real com indicação visual de zonas:

| Faixa | Status |
|---|---|
| `< 10 °C` | ❄️ Crítico (frio) |
| `10–18 °C` | ⚠️ Abaixo do ideal |
| `18–24 °C` | ✅ Ideal |
| `> 24 °C` | 🔥 Crítico (calor) |

> **Atenção:** Temperatura da **água** acima de 24 °C reduz o oxigênio dissolvido e eleva o risco de *Pythium* (fungo aquático).

### ☀️ Ciclo de Luminosidade

O painel de luz exibe:
- Estado atual (luz **acesa** ou **apagada**)
- Lux atual do sensor
- Horas com luz ligada no dia
- Distribuição do ciclo diário (24h)

### 🗺️ Mapa das Plantas

Representação visual do layout da estufa com:
- Posição de cada planta (grid X/Y)
- Indicador de status por cor (verde/amarelo/vermelho)
- Acesso rápido ao relatório individual

### ⚡ Painel de Atuadores

Controle e monitoramento dos equipamentos:
- Bombas d'água
- Ventiladores
- Sistema de iluminação
- Aquecedores

---

## 🔌 API e Integrações

### Endpoints internos (Next.js API Routes)

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/api/sensores` | Última leitura de todos os sensores |
| `POST` | `/api/sensores` | Registrar nova leitura |
| `GET` | `/api/atuadores` | Estado de todos os atuadores |
| `PATCH` | `/api/atuadores/:id` | Alterar estado de um atuador |
| `POST` | `/api/ia/analise` | Solicitar análise por Gemini AI |

### Supabase Realtime

O dashboard se inscreve nos canais do Supabase para receber atualizações em tempo real:

```typescript
const canal = supabase
  .channel('leituras_sensores')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'leituras_sensores',
  }, (payload) => {
    // Atualiza o estado local com a nova leitura
    atualizarDashboard(payload.new)
  })
  .subscribe()
```

### Integração com Gemini AI

```typescript
// Exemplo de chamada ao Gemini AI para análise
const resposta = await gemini.generateContent(`
  Analise os dados da estufa hidropônica:
  - Temperatura do ar: ${temperatura}°C
  - Temperatura da água: ${temperaturaAgua}°C
  - Luminosidade: ${luminosidade} lux
  
  Identifique riscos e forneça recomendações.
`)
```

---

## 🚢 Deploy

### Deploy na Vercel (recomendado)

1. Faça fork ou importe o repositório na [Vercel](https://vercel.com/)
2. Configure as **variáveis de ambiente** no painel da Vercel (Settings → Environment Variables)
3. A Vercel detecta automaticamente o Next.js e realiza o build

```bash
# Ou via CLI da Vercel:
npx vercel --prod
```

### Build manual

```bash
npm run build
npm run start
```

### Scripts disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Servidor de desenvolvimento (localhost:3000) |
| `npm run build` | Build de produção |
| `npm run start` | Inicia o servidor de produção |
| `npm run lint` | Verifica erros de linting |
| `npm run type-check` | Verificação de tipos TypeScript |

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Siga os passos abaixo:

1. **Fork** o repositório
2. Crie uma **branch** para sua feature:
   ```bash
   git checkout -b feature/minha-nova-feature
   ```
3. **Commit** suas alterações com mensagens claras:
   ```bash
   git commit -m "feat: adiciona gráfico de pH do solo"
   ```
4. **Push** para a branch:
   ```bash
   git push origin feature/minha-nova-feature
   ```
5. Abra um **Pull Request** descrevendo as mudanças

### Padrão de commits (Conventional Commits)

| Prefixo | Uso |
|---|---|
| `feat:` | Nova funcionalidade |
| `fix:` | Correção de bug |
| `docs:` | Atualização de documentação |
| `style:` | Mudanças de estilo/formatação |
| `refactor:` | Refatoração de código |
| `test:` | Adição ou correção de testes |
| `chore:` | Tarefas de manutenção |

---

## 🗺️ Roadmap

- [x] Dashboard de monitoramento em tempo real
- [x] Painel de atuadores
- [x] Mapa visual das plantas
- [x] Ciclo de luminosidade
- [x] Histórico e relatórios
- [x] Integração com Gemini AI
- [ ] Notificações push / alertas por e-mail
- [ ] Suporte a múltiplas estufas por usuário
- [ ] Integração com MQTT para leitura direta de sensores
- [ ] App mobile (React Native / Expo)
- [ ] Monitoramento de pH e EC (condutividade elétrica)
- [ ] Dashboard de consumo de energia
- [ ] Exportação de relatórios em PDF/CSV
- [ ] Modo offline com sincronização

---

## 📄 Licença

Este projeto está licenciado sob a **MIT License** — veja o arquivo [LICENSE](LICENSE) para detalhes.

---

<div align="center">

Desenvolvido com 💚 no **Amazonas, Brasil**

**EcoRoots** — Tecnologia a serviço da natureza 🌱

</div>