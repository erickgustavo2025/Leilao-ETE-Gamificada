# SISTEMA ETE GAMIFICADA 2K26 — ESPECIFICAÇÕES TÉCNICAS

Este documento detalha as regras matemáticas, limites de sistema e funcionalidades da plataforma ETE Gamificada, servindo como a base de conhecimento técnico para o Oráculo GIL.

## 1. ARQUITETURA ECONÔMICA (PC$ & XP)

A economia do sistema é baseada em uma única moeda e métricas de progressão histórica.

### 1.1. Moeda e Saldo
- **PC$ (Pontos de Conhecimento):** Moeda volátil utilizada para todas as transações (compras, investimentos, transferências).
- **maxPcAchieved:** Registro do maior saldo de PC$ que o aluno já possuiu. É esta métrica que define o Rank, garantindo que gastar PC$ não prejudique a progressão de nível.
- **XP:** Métrica de experiência acumulada, independente do saldo financeiro.

### 1.2. Limites e Travas do "Oloko"
Para garantir o equilíbrio econômico, existem limites anuais de recebimento de PC$ baseados no ano escolar:
- **1º Ano:** Limite de 400 PC$ por ano.
- **2º Ano:** Limite de 800 PC$ por ano.
- **3º Ano:** Limite de 1.200 PC$ por ano.
- **Exceção:** Transações de comércio (Mercado P2P) não consomem este limite, mas são registradas para fins estatísticos.

### 1.3. Transferências (PIX Escolar)
- **Taxa Padrão (PIX_FEE):** 800 PC$ por transação.
- **Isenção de Taxa:** Pode ser obtida através de Skills de Rank ou itens específicos (ex: TRANSF DE CONHECIMENTO ).
- **Segurança:** Requer confirmação de senha e validação de limite anual do destinatário.

## 2. SISTEMA FINANCEIRO (GIL INVESTE)

O Gil Investe permite a multiplicação de patrimônio através de ativos reais e internos.

### 2.1. Ativos Reais (B3 e Cripto)
- **Cotações:** Sincronizadas a cada 5 minutos via Yahoo Finance.
- **Taxa de Corretagem:** 1 PC$ por operação (compra ou venda).
- **Cálculo de Preço Médio:** O sistema recalcula automaticamente o preço médio em cada compra para fornecer o P&L (Profit & Loss) preciso.

### 2.2. Startups de Alunos
- **IPO:** Criadas por alunos e aprovadas por admins com um valuation inicial.
- **Market Maker (Oferta e Demanda):** O preço flutua ±0.1% por ação negociada. 
    - Fórmula de Impacto: `novoPreço = preçoAtual * (1 + (0.001 * quantidade))` para compras.
- **Insider Trading:** Fundadores são bloqueados de negociar ações da própria empresa.
- **Dividendos:** Pagos mensalmente com base na performance acadêmica (0-100).
    - Fórmula: `(performance / 10) * 0.05` PC$ por ação.

## 3. COMÉRCIO E LEILÕES

### 3.1. Loja Oficial e Beco Diagonal
- **Itens Individuais:** Consumíveis (com validade), Permanentes ou Buffs.
- **Itens de Sala (Beco):** Beneficiam a turma toda e são armazenados no Inventário da Sala.
- **Buffs:** Efeitos passivos (ex: Dobradores de PC$) que expiram automaticamente conforme o `expiresAt`.

### 3.2. Casa de Leilões
- **Lances:** Devem ser superiores ao lance atual ou ao lance mínimo.
- **Descontos de Arrematador:**
    - **Arrematador:** Paga apenas 50% do valor do lance vencedor.
    - **Arrematador Aprimorado:** Paga apenas 25% do valor do lance vencedor.
- **Reembolso:** O licitante anterior é reembolsado integralmente quando superado.

### 3.3. Mercado P2P (Marketplace)
- **Taxa Goblin:** 10% de taxa sobre o valor da venda, descontada do vendedor.
- **Heurística de Preço:** Itens com preço > 2x o preço base são marcados como "Overpriced".
- **Restrições:** Skills de Rank e itens de sala não podem ser vendidos no P2P.

## 4. ETE BANK (EMPRÉSTIMOS)

O sistema de crédito escolar para emergências financeiras.

- **Requisito:** Possuir um "VIP Card" (seja via Rank ou item físico).
- **Limite de Crédito:** 1/3 do `maxPcAchieved`.
- **Taxa de Juros:** 15% fixo.
- **Prazo:** 7 dias para pagamento.
- **Trava de Inadimplência:** Bloqueia novas compras na loja enquanto houver dívida ativa.

## 5. RANKS E PROGRESSÃO

Os Ranks são a prova de prestígio e desbloqueiam benefícios exclusivos.

- **Iniciante:** 0 PC$
- **Bronze:** 1.000 PC$
- **Prata:** 1.500 PC$
- **Ouro:** 2.000 PC$
- **Diamante:** 2.500 PC$
- **Épico:** 3.000 PC$
- **Épico Lendário:** 5.000 PC$
- **Épico Supremo:** 10.000 PC$
- **Épico Mitológico:** 20.000 PC$
- **Épico Soberano:** 50.000 PC$

## 6. WIKIMAP — MAPA DE FUNCIONALIDADES

O Wikimap serve como o guia de navegação para o aluno:
- **Dashboard:** Central de notificações e visão geral de ativos.
- **Mochila:** Gestão de inventário, uso de itens e transferências.
- **Taça das Casas:** Competição entre turmas baseada em HouseActions e inventário de sala.
- **Quadro de Missões:** Missões Diárias, Semanais e de Campanha (necessitam código do professor).
- **Perfil:** Personalização de avatar e visualização de badges de conquista.

## 7. REGRAS DE INTEGRIDADE DO ORÁCULO

- **Conselheiro, não Executor:** O Oráculo nunca realiza transações, apenas orienta.
- **Privacidade:** Dados de outros alunos são estritamente confidenciais.
- **Prioridade Acadêmica:** O sucesso financeiro no jogo deve ser sempre vinculado ao desempenho nos estudos.
- **Formatação Limpa:** Proibido o uso de asteriscos simples. Apenas negrito e hífens.
