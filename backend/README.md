<div align="center">

```
███████╗████████╗███████╗     ██████╗  █████╗ ███╗   ███╗██╗███████╗██╗ ██████╗ █████╗ ██████╗  █████╗ 
██╔════╝╚══██╔══╝██╔════╝    ██╔════╝ ██╔══██╗████╗ ████║██║██╔════╝██║██╔════╝██╔══██╗██╔══██╗██╔══██╗
█████╗     ██║   █████╗      ██║  ███╗███████║██╔████╔██║██║█████╗  ██║██║     ███████║██║  ██║███████║
██╔══╝     ██║   ██╔══╝      ██║   ██║██╔══██║██║╚██╔╝██║██║██╔══╝  ██║██║     ██╔══██║██║  ██║██╔══██║
███████╗   ██║   ███████╗    ╚██████╔╝██║  ██║██║ ╚═╝ ██║██║██║     ██║╚██████╗██║  ██║██████╔╝██║  ██║
╚══════╝   ╚═╝   ╚══════╝     ╚═════╝ ╚═╝  ╚═╝╚═╝     ╚═╝╚═╝╚═╝     ╚═╝ ╚═════╝╚═╝  ╚═╝╚═════╝ ╚═╝  ╚═╝
```

# 🏰 ETE Gamificada 2026.

### O Game Acadêmico Oficial da ETE Gil Rodrigues

[![Status](https://img.shields.io/badge/STATUS-ONLINE-00ff88?style=for-the-badge&logo=statuspage&logoColor=black)](https://etegamificada.online)
[![Domínio](https://img.shields.io/badge/🌐_DOMÍNIO-etegamificada.online-6366f1?style=for-the-badge)](https://etegamificada.online)
[![React](https://img.shields.io/badge/React_18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com/)

**Plataforma full-stack de gamificação educacional que transforma o ambiente escolar em um RPG de verdade.**  
Economia real com PC$, sistema de Ranks, Leilões ao vivo, Buffs de multiplicação e guerra trimestral entre turmas.

</div>

---

## 📖 Índice

- [Visão Geral](#-visão-geral)
- [Stack Tecnológica](#-stack-tecnológica)
- [Arquitetura do Sistema](#-arquitetura-do-sistema)
- [Pilares do Sistema](#-pilares-do-sistema)
- [Regras de Negócio Cruciais](#-regras-de-negócio-cruciais)
- [Estrutura de Pastas](#-estrutura-de-pastas)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)
- [Guia de Instalação & Deploy](#-guia-de-instalação--deploy)
- [Endpoints da API](#-endpoints-da-api)
- [Tipos de Usuário & Permissões](#-tipos-de-usuário--permissões)
- [Sistema de Ranks](#-sistema-de-ranks)

---

## 🎮 Visão Geral

A **ETE Gamificada** nasceu de uma visão simples e ambiciosa: transformar o cotidiano escolar em uma experiência de RPG completa, onde cada nota, cada participação e cada conquista vira poder real dentro do sistema.

O aluno não é mais apenas um número no diário — ele é um jogador com saldo, inventário, habilidades e rank. Professores e monitores têm ferramentas de gestão para recompensar e penalizar. O Admin controla o mundo. E a turma inteira compete pela glória da Taça das Casas.

```
┌─────────────────────────────────────────────────────────────────┐
│                     FLUXO PRINCIPAL                             │
│                                                                 │
│  Professor → Lança Pontos → Sistema verifica Buffs Ativos       │
│                          ↓                                      │
│              2x ou 3x multiplicado automaticamente              │
│                          ↓                                      │
│          +0.5x se tiver Bênção de Merlin (cargo secreto)        │
│                          ↓                                      │
│        PC$ creditado → Rank atualizado → Skills desbloqueadas   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Stack Tecnológica

### Frontend
| Tecnologia | Versão | Uso |
|:---|:---:|:---|
| **React** | 18 | UI declarativa com Hooks |
| **Vite** | latest | Build ultrarrápido e HMR |
| **TypeScript** | 5+ | Tipagem estática em todo o frontend |
| **Tailwind CSS** | 3 | Design Pixelado/Neon via utility classes |
| **Framer Motion** | 10+ | Animações fluidas (accordion, modais, partículas) |
| **TanStack Query** | v5 | Cache de servidor, mutations e sincronização em tempo real |
| **React Router** | v6 | Roteamento SPA |
| **Lucide React** | latest | Ícones consistentes |
| **Sonner** | latest | Toast notifications |

### Backend
| Tecnologia | Versão | Uso |
|:---|:---:|:---|
| **Node.js** | 18+ | Runtime do servidor |
| **Express** | 4 | Framework HTTP |
| **MongoDB** | 6+ | Banco de dados principal (coleção `alunos`) |
| **Mongoose** | 7+ | ODM com schemas tipados |
| **Socket.io** | 4 | Leilões em tempo real (WebSocket) |
| **JWT** | - | Autenticação stateless |
| **bcryptjs** | - | Hash de senhas |
| **Multer** | - | Upload de imagens (avatares, itens, logo) |

### Infraestrutura
| Tecnologia | Uso |
|:---|:---|
| **Docker & Docker Compose** | Orquestração de containers (API + Nginx) |
| **Nginx** | Serve o build estático do Vite + proxy reverso para a API |
| **Volume Docker** | Persistência de `/uploads` entre reinicializações |

---

## 🏗️ Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────────────┐
│                        etegamificada.online                         │
│                                                                     │
│  ┌──────────────────────┐      ┌───────────────────────────────┐   │
│  │   NGINX (Container)  │      │    Node.js API (Container)    │   │
│  │                      │      │                               │   │
│  │  /dist (Vite Build)  │─────▶│  /api/*  (Express Routes)    │   │
│  │  React SPA           │      │  Socket.io (Leilão WS)        │   │
│  │  index.html fallback │      │  Multer (Uploads)             │   │
│  └──────────────────────┘      └──────────────┬────────────────┘   │
│                                               │                     │
│                                 ┌─────────────▼──────────────┐     │
│                                 │    MongoDB (Atlas/Local)    │     │
│                                 │                             │     │
│                                 │  Collection: alunos         │     │
│                                 │  Collection: storeitems     │     │
│                                 │  Collection: tickets        │     │
│                                 │  Collection: auctions       │     │
│                                 │  Collection: classrooms     │     │
│                                 │  Collection: logs           │     │
│                                 │  Collection: systemconfigs  │     │
│                                 └─────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
```

### Fluxo de Autenticação

```
Aluno → POST /auth/login  →  JWT gerado  →  Salvo em localStorage
                                             com prefixo @ETEGamificada:token

Toda requisição protegida →  Header: Authorization: Bearer <token>
                         →  Middleware verifica e injeta req.user
```

---

## 🚀 Pilares do Sistema

### 💰 1. Economia & ETE Bank

O coração do sistema. Tudo gira em torno do **PC$ (Pontos de Conhecimento)**.

- **Ganho de PC$:** Professores e Monitores lançam pontos diretamente na conta dos alunos. O valor é processado com os multiplicadores ativos antes de ser creditado.
- **ETE Bank:** Empréstimos disponíveis para alunos VIP (que possuem o VIP Card no inventário). Limite de até 1/3 do `maxPcAchieved`. Juros de 15% aplicados após 7 dias.
- **Transferências (PIX Escolar):** Envio de PC$ entre alunos via número de matrícula. 100% rastreável nos logs.
- **Limite Financeiro Anual:** Cada aluno tem um teto de recebimento por ano (`receivedThisYear`) para evitar abuso. Resetado automaticamente em virada de ano.
- **Dívidas:** Saldo negativo bloqueia novas compras na loja até ser quitado.

```javascript
// Lógica de multiplicação (backend/controllers/userController.js)
const getMultiplier = (user) => {
  const now = new Date();
  const activeBuffs = (user.activeBuffs || []).filter(b => 
    !b.expiresAt || new Date(b.expiresAt) > now
  );
  const hasTriple = activeBuffs.some(b => b.effect === 'TRIPLICADOR');
  const hasDouble = !hasTriple && activeBuffs.some(b => b.effect === 'DUPLICADOR');
  
  let multiplier = hasTriple ? 3 : hasDouble ? 2 : 1;
  
  // A Bênção de Merlin: +0.5x sobre qualquer multiplicador
  if (user.cargos?.includes('bencao_de_merlin')) multiplier += 0.5;
  
  return multiplier;
};
```

---

### 🎒 2. Sistema de Buffs & Auras

Um dos sistemas mais sofisticados: itens que ao serem **usados na Mochila**, não geram ticket — eles se transformam em **auras passivas** no array `activeBuffs` do usuário.

| Buff | Efeito | Duração |
|:---|:---|:---:|
| **Dobrador (2x)** | Dobra todos os ganhos de PC$ | 90 dias |
| **Triplicador (3x)** | Triplica todos os ganhos de PC$ | 90 dias |
| **Bênção de Merlin** | +0.5x fixo sobre qualquer multiplicador | Permanente (cargo) |

**Regras:**
- Só 1 buff do mesmo tipo pode estar ativo. Ativar um novo **substitui** o anterior.
- Buffs são limpos automaticamente no `pre('save')` do Model `User.js`.
- O multiplicador é calculado em tempo de execução no lançamento de pontos — não é um campo salvo.

---

### 🏆 3. Taça das Casas

A competição trimestral entre turmas. Cada PC$ ganho por um aluno soma para o placar da sua "Casa" (turma).

**Componentes:**
- **Placar em Tempo Real:** Soma de PC$ de todos os alunos da sala.
- **Beco Diagonal:** Seção especial da loja onde itens comprados vão para o `roomInventory` da sala (model `Classroom`), beneficiando a turma na competição.
- **Controle do Admin:** O placar pode ser **ocultado** nas semanas finais para suspense — configurado em `SystemConfig.becoDiagonalOpen`.
- **Recompensas:** A turma vencedora recebe itens exclusivos e PC$ bônus distribuídos pelo Admin.

---

### ⚖️ 4. Mercado & Leilão

**Leilão Real-Time (Socket.io):**
- Itens exclusivos não disponíveis na loja comum.
- Lances em tempo real via WebSocket.
- Suporte a restrições por **Rank** (ex: só Diamante+) e **Ano Escolar** (ex: só 3º ano).
- Ao vencer, item vai para o inventário e PC$ é debitado automaticamente.

**Mercado P2P:**
- Alunos anunciam itens da própria Mochila com preço definido.
- Skills de Rank e itens de Sala **não podem ser negociados**.

---

### 🛡️ 5. Governança (Painel Admin)

Controle total do ecossistema:

| Função | Descrição |
|:---|:---|
| `maintenanceMode` | Bloqueia acesso de alunos/monitores ao sistema |
| `becoDiagonalOpen` | Ativa/desativa a seção Beco na loja dos alunos |
| `vipCode` | Código secreto para ativação de status VIP |
| `siteName` / `landingMessage` | Personalização da landing page |
| `logoUrl` | Upload e troca da logo do sistema |
| Gestão de Itens | CRUD completo da loja com upload de imagem |
| Logs de Auditoria | Rastreamento de todas as ações críticas |
| Configuração de Leilões | Criar, encerrar e deletar lotes |

**Sincronização Admin → Aluno:**  
A configuração pública é exposta via `GET /public/config`. O frontend do aluno faz polling a cada 60s para detectar mudanças (ex: se o Beco for fechado enquanto um aluno está na página, ele é automaticamente redirecionado).

---

## 🧠 Regras de Negócio Cruciais

> **Leia antes de desenvolver qualquer feature.**

### 📊 Cálculo de Rank
O Rank é calculado com base no `maxPcAchieved` — o **maior saldo histórico** do aluno.

```
Aluno tem 5.000 PC$ → Gastou tudo na loja → Saldo atual: 0 PC$
Rank dele: Continua no mesmo nível (calculado pelos 5.000 históricos)
```

Gastar dinheiro **nunca** rebaixa o rank. O campo `maxPcAchieved` só sobe, nunca desce.

### 🖼️ Image Helper

As URLs de imagem são resolvidas dinamicamente no frontend:

```typescript
// utils/imageHelper.ts
export const getImageUrl = (path: string) => {
  if (!path) return '/assets/placeholder.png';
  if (path.startsWith('http')) return path;
  // Remove /api do base URL e aponta para /uploads
  const base = import.meta.env.VITE_API_URL.replace('/api', '');
  return `${base}${path}`;
};
```

### 🔐 Auth Persistence

```typescript
// Chaves usadas no localStorage
const TOKEN_KEY = '@ETEGamificada:token';
const USER_KEY  = '@ETEGamificada:user';

// Header obrigatório para rotas protegidas
Authorization: Bearer <token>
```

### 🔄 Cache (TanStack Query)

O projeto usa React Query para **todos** os dados do servidor. Padrões adotados:

```typescript
// Após qualquer mutação que altera dados globais:
queryClient.invalidateQueries({ queryKey: ['storeItems'] });
queryClient.invalidateQueries({ queryKey: queryKeys.admin.config });
queryClient.invalidateQueries({ queryKey: queryKeys.public.config });

// Configuração pública: polling para detectar mudanças do Admin
useQuery({
  queryKey: queryKeys.public.config,
  queryFn: () => api.get('/public/config').then(r => r.data),
  staleTime: 1000 * 30,     // Considera fresco por 30s
  refetchInterval: 1000 * 60 // Refetch a cada 60s em background
});
```

### 🧹 Limpeza de Buffs Expirados

Os buffs expirados são limpos em **dois momentos**:

1. **Backend:** `pre('save')` no `User.js` — filtra antes de qualquer save.
2. **Frontend:** `useMemo` no componente `Mochila.tsx` — filtra na renderização.

Isso garante que mesmo um aluno offline por dias não veja buffs fantasmas.

---

## 📁 Estrutura de Pastas

```
ete-gamificada/
│
├── frontend/                          # React App (Vite + TypeScript)
│   ├── src/
│   │   ├── api/
│   │   │   └── axios-config.ts        # Instância axios com interceptors JWT
│   │   ├── components/
│   │   │   ├── features/              # TransferModal, QRCode, etc.
│   │   │   ├── layout/                # AdminLayout, PageTransition
│   │   │   └── ui/                    # PixelCard, PixelButton
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx        # user, refreshUser, ranks
│   │   ├── hooks/
│   │   │   └── useGameSound.ts        # Sons de sucesso/erro
│   │   ├── pages/
│   │   │   ├── admin/                 # AdminConfig, AdminLoja, etc.
│   │   │   ├── aluno/                 # Loja, Mochila, Perfil, Ranking
│   │   │   └── public/               # WikiMap, Landing, Login
│   │   └── utils/
│   │       ├── cn.ts                  # className merge helper
│   │       ├── confetti.ts            # triggerSimpleConfetti / triggerEpicConfetti
│   │       ├── imageHelper.ts         # getImageUrl (resolve paths dinâmicos)
│   │       ├── queryKeys.ts           # Chaves centralizadas do React Query
│   │       └── rankHelper.ts          # calculateRank(maxPcAchieved, ranks[])
│   ├── .env                           # VITE_API_URL
│   └── vite.config.ts
│
├── backend/                           # Node.js + Express
│   ├── src/
│   │   ├── config/
│   │   │   └── skills.js              # SKILLS_CATALOG (todas as skills de rank)
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── inventoryController.js # useItem (lógica de buff vs ticket)
│   │   │   ├── storeController.js
│   │   │   ├── userController.js      # bulkUpdatePoints + getMultiplier()
│   │   │   └── adminController.js
│   │   ├── models/
│   │   │   ├── User.js                # Schema principal (inventory, activeBuffs)
│   │   │   ├── StoreItem.js           # buffEffect, validadeDias, isHouseItem
│   │   │   ├── Ticket.js              # QR Code tickets
│   │   │   ├── Classroom.js           # roomInventory (Baú da Turma)
│   │   │   ├── Auction.js             # Leilões com Socket.io
│   │   │   ├── Log.js                 # Auditoria de ações
│   │   │   └── SystemConfig.js        # maintenanceMode, becoDiagonalOpen, etc.
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── user.routes.js
│   │   │   ├── store.routes.js
│   │   │   ├── inventory.routes.js
│   │   │   ├── auction.routes.js
│   │   │   ├── public.routes.js       # GET /public/config (sem auth)
│   │   │   └── admin.routes.js
│   │   ├── middleware/
│   │   │   └── auth.middleware.js     # verifyToken, isAdmin, isDev
│   │   └── services/
│   │       └── skillService.js        # syncRankSkills(user)
│   ├── public/
│   │   └── uploads/                   # Imagens enviadas (mapeado como volume Docker)
│   └── .env
│
├── docker-compose.yml
└── README.md
```

---

## 🔑 Variáveis de Ambiente

### Frontend (`.env` na raiz de `/frontend`)

```env
# URL base da API — inclui /api no final
VITE_API_URL=https://api.etegamificada.online/api

# Em desenvolvimento local:
# VITE_API_URL=http://localhost:3000/api
```

### Backend (`.env` na raiz de `/backend`)

```env
# Banco de Dados
MONGODB_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/ete-gamificada

# JWT
JWT_SECRET=uma_string_secreta_longa_e_aleatoria_aqui
JWT_EXPIRES_IN=7d

# Servidor
PORT=3000
NODE_ENV=production

# CORS — domínios autorizados (separados por vírgula)
FRONTEND_URL=https://etegamificada.online,https://www.etegamificada.online

# Email (Recuperação de Senha)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu@email.com
EMAIL_PASS=sua_senha_de_app
```

---

## 🐋 Guia de Instalação & Deploy

### Desenvolvimento Local

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/ete-gamificada.git
cd ete-gamificada

# 2. Backend
cd backend
npm install
cp .env.example .env    # Configure as variáveis
npm run dev             # Nodemon na porta 3000

# 3. Frontend (outro terminal)
cd frontend
npm install
cp .env.example .env    # Configure VITE_API_URL
npm run dev             # Vite na porta 5173
```

### Build de Produção (Manual)

```bash
# Frontend
cd frontend
npm run build           # Gera /dist
# O Nginx irá servir os arquivos em /dist

# Backend
cd backend
npm start               # Node.js direto (use PM2 em produção)
```

### Deploy com Docker (Recomendado)

```yaml
# docker-compose.yml
version: '3.9'
services:

  api:
    build: ./backend
    container_name: ete_api
    ports:
      - "3000:3000"
    env_file: ./backend/.env
    volumes:
      # CRÍTICO: persiste as imagens entre deploys
      - ./backend/public/uploads:/app/public/uploads
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    container_name: ete_nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./frontend/dist:/usr/share/nginx/html:ro
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      - api
    restart: unless-stopped
```

```bash
# Deploy completo em um comando
cd frontend && npm run build && cd ..
docker-compose down && docker-compose up -d --build
```

### Configuração Nginx

```nginx
# nginx.conf
server {
    listen 80;
    server_name etegamificada.online www.etegamificada.online;

    root /usr/share/nginx/html;
    index index.html;

    # SPA fallback — redireciona todas as rotas para index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy para a API
    location /api {
        proxy_pass http://api:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # WebSocket (Socket.io para Leilão)
    location /socket.io {
        proxy_pass http://api:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

---

## 🔌 Endpoints da API

### Base URL
```
https://api.etegamificada.online/api
```

### Auth (`/auth`)

| Método | Rota | Auth | Descrição |
|:---:|:---|:---:|:---|
| POST | `/auth/login` | ❌ | Login (retorna JWT) |
| POST | `/auth/first-access` | ❌ | Valida matrícula + data nascimento |
| POST | `/auth/activate` | ❌ | Define senha e email no 1º acesso |
| POST | `/auth/forgot-password` | ❌ | Envia email de recuperação |
| POST | `/auth/reset-password` | ❌ | Define nova senha via token |

### Usuários (`/users`)

| Método | Rota | Auth | Descrição |
|:---:|:---|:---:|:---|
| GET | `/users/classes` | ✅ | Lista todas as turmas |
| GET | `/users/students` | ✅ | Lista alunos (query: `?turma=3A DS`) |
| GET | `/users/me` | ✅ | Dados do usuário logado |
| PUT | `/users/points/bulk` | 🔐 Admin | Adiciona/remove pontos em massa |
| PUT | `/users/toggle-monitor` | 🔐 Admin | Promove/rebaixa monitor |
| PUT | `/users/toggle-block` | 🔐 Admin | Bloqueia/desbloqueia conta |
| PUT | `/users/toggle-special-role` | 🔐 Admin | Gerencia cargos especiais |
| PUT | `/users/avatar` | ✅ | Upload de avatar (multipart) |
| POST | `/users/redeem-vip` | ✅ | Resgata código VIP |

### Loja (`/store`)

| Método | Rota | Auth | Descrição |
|:---:|:---|:---:|:---|
| GET | `/store/items` | ✅ | Lista todos os itens da loja |
| POST | `/store/buy/:id` | ✅ | Compra um item |
| POST | `/store/items` | 🔐 Admin | Cria novo item (multipart) |
| PUT | `/store/items/:id` | 🔐 Admin | Edita item existente |
| DELETE | `/store/items/:id` | 🔐 Admin | Remove item |

### Inventário (`/inventory`)

| Método | Rota | Auth | Descrição |
|:---:|:---|:---:|:---|
| GET | `/inventory` | ✅ | Lista inventário pessoal + sala |
| POST | `/inventory/use` | ✅ | Usa item → Gera ticket OU ativa buff |
| POST | `/inventory/use-room` | ✅ | Usa item do baú da sala |
| DELETE | `/inventory/item/:slotId` | ✅ | Descarta item pessoal |
| DELETE | `/inventory/room/:slotId` | ✅ | Descarta item da sala (só dono) |

### Tickets (`/tickets`)

| Método | Rota | Auth | Descrição |
|:---:|:---|:---:|:---|
| GET | `/tickets` | ✅ | Lista tickets do usuário |
| POST | `/tickets/validate` | 🔐 Admin | Valida ticket por hash |
| DELETE | `/tickets/:id` | ✅ | Cancela ticket PENDENTE (devolve item) |

### Leilão (`/auction`)

| Método | Rota | Auth | Descrição |
|:---:|:---|:---:|:---|
| GET | `/auction` | ✅ | Lista leilões ativos e finalizados |
| POST | `/auction/bid/:id` | ✅ | Dá um lance |
| GET | `/auction/history` | ✅ | Histórico de lances do usuário |
| POST | `/auction` | 🔐 Admin | Cria lote (multipart) |
| PUT | `/auction/:id/close` | 🔐 Admin | Encerra leilão manualmente |
| DELETE | `/auction/:id` | 🔐 Admin | Remove leilão |

### Admin & Config (`/admin`, `/public`)

| Método | Rota | Auth | Descrição |
|:---:|:---|:---:|:---|
| GET | `/admin/config` | 🔐 Admin | Lê configurações do sistema |
| PUT | `/admin/config` | 🔐 Admin | Atualiza config (multipart para logo) |
| GET | `/admin/logs` | 🔐 Admin | Logs de auditoria (últimos 100) |
| GET | `/public/config` | ❌ | Config pública (sem auth) |

---

## 👥 Tipos de Usuário & Permissões

| Role | Acesso | Capacidades |
|:---|:---:|:---|
| `student` | Padrão | Loja, Mochila, Leilão, Roleta, Perfil, Ranking |
| `monitor` | Elevado | Tudo do student + lançar/remover pontos da própria turma |
| `admin` | Total | Tudo + Painel Admin completo, Config do sistema, Gestão de usuários |
| `dev` | Máximo | Tudo + não pode ser bloqueado, acessa logs de nível dev |

### Cargos Especiais (dentro de `student` e `monitor`)

| Cargo | Emoji | Efeito |
|:---|:---:|:---|
| `monitor_disciplina` | 🤓 | Identificação visual |
| `monitor_escola` | 🏫 | Identificação visual |
| `armada_dumbledore` | 🧙 | Identificação visual |
| `monitor_biblioteca` | 📚 | Identificação visual |
| `monitor_quadra` | ⚽ | Identificação visual |
| `banda` | 🎼 | Identificação visual |
| `representante` | 🫡 | Identificação visual |
| `colaborador` | 🎮 | Dado automaticamente a todos os monitores |
| `estudante_honorario` | 😎 | Identificação visual |
| `bencao_de_merlin` | ✨ | **+0.5x fixo em todos os ganhos de PC$** |

---

## 🏅 Sistema de Ranks

Calculado com base em `maxPcAchieved` (recorde histórico de saldo).

| Rank | Mínimo PC$ | Cor | Emoji |
|:---|---:|:---|:---:|
| Comum | 0 | `text-slate-400` | — |
| Bronze | 500 | `text-orange-400` | 🥉 |
| Prata | 1.500 | `text-slate-300` | 🥈 |
| Ouro | 3.000 | `text-yellow-400` | 🥇 |
| Diamante | 6.000 | `text-cyan-400` | 💎 |
| Épico | 10.000 | `text-purple-400` | ⚡ |
| Lendário | 15.000 | `text-fuchsia-400` | 🌟 |
| Supremo | 25.000 | `text-red-400` | 🔥 |
| Mitológico | 40.000 | `text-rose-400` | 🌹 |
| Soberano | 60.000 | `text-yellow-100` | 👑 |

> **Ranks de itens na loja** seguem o mesmo esquema de cores para manter consistência visual em todo o sistema.

---

<div align="center">

---

**ETE Gamificada 2026** — Construído com 💜 para a ETE Gil Rodrigues

`React` · `Node.js` · `MongoDB` · `Socket.io` · `Docker`

*"Transformando educação em conquista."*

[![Stars](https://img.shields.io/github/stars/seu-usuario/ete-gamificada?style=for-the-badge&color=ffd700)](https://github.com/seu-usuario/ete-gamificada)

</div>
