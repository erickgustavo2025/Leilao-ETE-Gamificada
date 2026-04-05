# REGRAS COMPLETAS — ETE GAMIFICADA 2K26

## ECONOMIA
- Moeda: PC$ (Pontos de Conhecimento). É a única moeda do sistema.
- XP não existe como métrica. Ranks são definidos por maxPcAchieved (pico histórico de PC$).
- O PC$ é volátil (pode ser gasto). O maxPcAchieved NUNCA diminui.
- Reset trimestral: saldoPc vai a zero todo trimestre. maxPcAchieved permanece intacto.

## RANKS (em ordem crescente)
Iniciante (0 PC$) → Bronze (1.000) → Prata (1.500) → Ouro (2.000) → Diamante (2.500) →
Épico (3.000) → Épico Lendário (5.000) → Épico Supremo (10.000) → Épico Mitológico (20.000) → Épico Soberano (50.000)

## FUNCIONALIDADES DO SITE
- **Dashboard:** Visão geral do saldo, rank e notificações.
- **Loja:** Compra de itens com PC$. Alguns itens exigem badge de rank.
- **Leilão (Casa de Leilões):** Lances em tempo real via Socket.io.
- **Beco Diagonal:** Compras coletivas da turma. Limite: 10.000 PC$ por compra. Rateio proporcional ao saldo de cada aluno.
- **Taça das Casas:** Competição entre turmas. Pontuação via HouseAction.
- **Mochila:** Inventário pessoal de itens.
- **Banco:** Empréstimos de PC$ com limite de 1/3 do saldo atual.
- **Mercado Público:** Alunos vendem itens entre si (P2P).
- **Quadro de Missões:** Missões Diárias, Semanais, Eventos e Campanha (Ranks).
- **Regulamentos:** Lista de poderes autorizados por professor e disciplina.
- **Gil Investe:** Home Broker. Compra/venda de Ações B3, Criptomoedas e Startups de alunos.
- **Startups:** Alunos criam empresas. Admin aprova o IPO. Dividendos mensais baseados em performanceAcademica.
- **Perfil:** Avatar, rank, badges, benefícios passivos e ativos.

## MISSÕES E BADGES
- Missões de Campanha: uma por Rank. Exigem código secreto do professor. Concedem badge e desbloqueiam poderes.
- Missões Secundárias: Diárias/Semanais/Eventos. Validação por código ou manual pelo admin.
- Para usar benefícios de rank, o aluno precisa ter a badge correspondente em user.cargos.

## GIL INVESTE — REGRAS
- PC$ é o capital para investir. 
- Taxa de corretagem: 1 PC$ por operação.
- Startup: fundadores não podem comprar/vender ações da própria empresa (Insider Trading bloqueado).
- Dividendos: pagos mensalmente. Calculados por (performanceAcademica / 10) * 0.05 por ação.
- Preço de ação de Startup flutua ±0.1% por transação (Market Maker).

## BECO DIAGONAL — RATEIO PROPORCIONAL
- Quem tem mais PC$ paga mais (proporcional ao saldo).
- Fórmula: cota_aluno = (saldo_aluno / soma_total_turma) * preco_item.
- Resíduo de arredondamento distribuído pelo Método do Maior Resto.
