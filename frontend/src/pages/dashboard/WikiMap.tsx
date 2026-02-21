import { useState, useMemo, memo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Coins, Trophy, ShoppingBag, Gavel, Landmark, Gift, Shield,
  User, Search, ChevronDown, BookOpen, Compass,
  Star, Zap, RefreshCw, Key, Flame, Ghost, Lock, AlertTriangle,
  Ticket, Sparkles, Crown, Package, TrendingUp, Users, Scroll,
  ChevronRight, Info, ExternalLink, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { PageTransition } from '../../components/layout/PageTransition';

// ========================
// HOOK: Mobile (otimizado)
// ========================
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() => 
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    const handler = () => { clearTimeout((window as any)._wikiResizeTimer); (window as any)._wikiResizeTimer = setTimeout(check, 150); };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
};

// ========================
// TIPOS
// ========================
interface WikiItem {
  title: string;
  icon: React.ElementType;
  desc: string;
  detail: string;
  link?: string;
  badge?: string;
  badgeColor?: string;
}
interface WikiSection {
  id: string;
  title: string;
  subtitle: string;
  color: string;
  borderColor: string;
  bg: string;
  iconBg: string;
  icon: React.ElementType;
  items: WikiItem[];
}

// ========================
// CONTEÚDO COMPLETO DA WIKI
// ========================
const WIKI_DATA: WikiSection[] = [
  // ——————————————————————————————
  // 1. ECONOMIA & BANCO
  // ——————————————————————————————
  {
    id: 'economia',
    title: 'ECONOMIA & BANCO',
    subtitle: 'A espinha dorsal do sistema',
    color: 'text-yellow-400',
    borderColor: 'border-yellow-500/30',
    bg: 'bg-yellow-900/10',
    iconBg: 'bg-yellow-900/30',
    icon: Coins,
    items: [
      {
        title: 'PC$ — Pontos de Conhecimento',
        icon: Coins,
        desc: 'A moeda oficial. Ganhe pelo mérito, gaste com sabedoria.',
        detail: 'PC$ é a moeda de toda a economia do sistema. Você ganha pontos quando um professor ou monitor registra sua participação, notas ou conquistas. Cada ponto tem valor real dentro do sistema: dá pra comprar itens, dar lances em leilões, fazer empréstimos e até transferir para colegas. Gastar PC$ NÃO baixa o seu Rank — o Rank é calculado com base no maior saldo que você já teve, não no saldo atual.',
        badge: 'MOEDA OFICIAL',
        badgeColor: 'text-yellow-400 border-yellow-800/50 bg-yellow-900/20',
      },
      {
        title: 'Como Ganhar PC$',
        icon: TrendingUp,
        desc: 'Notas, participação, eventos e bônus de Rank.',
        detail: 'Existem várias formas de ganhar PC$:\n\n• Desempenho acadêmico — professores adicionam pontos manualmente conforme suas notas.\n• Participação ativa — engajamento em aulas e projetos.\n• Eventos especiais — gincanas, desafios e atividades extracurriculares.\n• Roleta — cada jogada pode render prêmios aleatórios.\n• Buff ativo — com um Dobrador(2x) ou Triplicador(3x) ativo, você recebe multiplicado automaticamente.\n• Bênção de Merlin — cargo secreto que soma +0.5x em qualquer ganho.',
      },
      {
        title: 'ETE Bank — Empréstimos',
        icon: Landmark,
        desc: 'Crédito para alunos. Requer VIP Card.',
        detail: 'O Banco Central da escola oferece empréstimos para alunos que precisam de PC$ urgente.\n\n• Limite: até 1/3 do maior saldo que você já teve (maxPcAchieved).\n• Requisito: ter o VIP Card no inventário ou ser VIP.\n• Juros: 15% ao final de 7 dias corridos.\n• Consequência de atraso: o saldo devedor é automaticamente descontado do saldo e a compra de novos itens na loja pode ser bloqueada enquanto houver dívida.\n\nUse o banco com responsabilidade — dívidas acumulam.',
        link: '/banco',
      },
      {
        title: 'Transferências (PIX Escolar)',
        icon: RefreshCw,
        desc: 'Envie PC$ para qualquer colega instantaneamente.',
        detail: 'Você pode transferir PC$ para qualquer outro aluno do sistema usando a opção de transferência na Mochila (usando o item de transferência) ou no menu.\n\n• Basta ter a matrícula do destinatário.\n• O valor é debitado do seu saldo e creditado no saldo do colega em tempo real.\n• Todas as transferências são registradas nos logs do sistema — admins e monitores podem ver o histórico.\n• Ideal para reembolsar apostas, dividir custos de itens ou simplesmente ajudar um colega.',
      },
      {
        title: 'Dívidas & Multas',
        icon: AlertTriangle,
        desc: 'Saldo negativo bloqueia compras e gera penalidades.',
        detail: 'Se você ficou devendo ao banco ou recebeu uma multa de um monitor/professor:\n\n• Seu saldo pode ficar negativo.\n• Enquanto endividado, a loja bloqueia novas compras.\n• Monitores podem aplicar multas diretamente (remoção de PC$) como penalidade por comportamento.\n• Para sair do negativo, você precisa ganhar PC$ suficiente para cobrir a dívida.\n\nEvite dívidas — elas trancam o acesso a toda a economia.',
        badge: 'ATENÇÃO',
        badgeColor: 'text-red-400 border-red-800/50 bg-red-900/20',
      },
      {
        title: 'Código VIP',
        icon: Key,
        desc: 'Código secreto que concede status VIP especial.',
        detail: 'Existe um código VIP secreto distribuído pelo Admin para alunos merecedores. Ao resgatar o código no sistema:\n\n• Você ganha o status VIP permanente no perfil.\n• VIP desbloqueia acesso a empréstimos maiores no banco.\n• O código muda periodicamente — se alguém te passar, use logo.\n• Só é possível ativar o VIP uma vez por conta.\n\nO código pode ser inserido na seção de configurações do perfil.',
        badge: 'EXCLUSIVO',
        badgeColor: 'text-purple-400 border-purple-800/50 bg-purple-900/20',
      },
    ]
  },

  // ——————————————————————————————
  // 2. LOJAS & MERCADO
  // ——————————————————————————————
  {
    id: 'comercio',
    title: 'LOJAS & MERCADO',
    subtitle: 'Onde os PC$ viram poder real',
    color: 'text-green-400',
    borderColor: 'border-green-500/30',
    bg: 'bg-green-900/10',
    iconBg: 'bg-green-900/30',
    icon: ShoppingBag,
    items: [
      {
        title: 'Loja Oficial',
        icon: ShoppingBag,
        desc: 'Itens individuais: consumíveis, permanentes e buffs.',
        detail: 'A Loja Oficial é o principal ponto de compra do sistema. Cada item tem:\n\n• Raridade (Comum → Bronze → Prata → Ouro → Diamante → Épico → Lendário → Supremo → Mitológico → Soberano).\n• Preço em PC$.\n• Estoque limitado — quando acaba, acabou.\n• Categoria: Consumível (uso único), Permanente, Buff (ativa aura passiva) ou Skill.\n\nItens comprados aqui vão direto para sua Mochila pessoal. Alguns itens têm validade (ex: 90 dias) — fique de olho no prazo.',
        link: '/loja',
      },
      {
        title: 'Beco Diagonal',
        icon: Ghost,
        desc: 'Loja especial para itens que beneficiam a turma toda.',
        detail: 'O Beco Diagonal é uma seção exclusiva da loja (ativada pelo Admin) onde você encontra itens de sala — eles vão para o Baú da Turma, não para sua mochila pessoal.\n\n• Beneficia a turma toda na Taça das Casas.\n• Itens comprados aqui ficam no Inventário da Sala e são compartilhados.\n• Apenas o aluno que comprou o item pode descartá-lo.\n• Pode ser desativado a qualquer momento pelo Admin (sem aviso prévio).\n\nInvestir no Beco é investir na sua turma.',
        link: '/loja',
        badge: 'TURMA',
        badgeColor: 'text-purple-400 border-purple-800/50 bg-purple-900/20',
      },
      {
        title: 'Casa de Leilões',
        icon: Gavel,
        desc: 'Dispute itens raros e exclusivos com lances em tempo real.',
        detail: 'A Casa de Leilões hospeda itens que NÃO existem na loja comum — relíquias únicas e lotes exclusivos.\n\n• Funcionamento: cada leilão tem prazo definido. O maior lance ao final leva o item.\n• Lances mínimos: definidos pelo Admin por lote.\n• Restrições: alguns lotes são exclusivos por Rank (ex: só Ouro+) ou por ano escolar (3º ano).\n• Cancelamento: o Admin pode cancelar um leilão antes do prazo.\n• Se você vencer, o item vai direto para a Mochila e o PC$ é debitado.\n\nAcesse /leilao para ver os lotes ativos.',
        link: '/leilao',
      },
      {
        title: 'Mercado P2P',
        icon: RefreshCw,
        desc: 'Venda seus itens para outros alunos pelo preço que quiser.',
        detail: 'O Mercado Público permite que alunos negociem entre si diretamente:\n\n• Você anuncia um item da sua mochila com o preço desejado.\n• Outro aluno pode comprar instantaneamente pelo preço anunciado.\n• O PC$ vai para você, o item vai para o comprador.\n• Skills de Rank NÃO podem ser vendidas — são pessoais e intransferíveis.\n• Itens do Beco (sala) também não são negociáveis no P2P.\n\nÓtima forma de lucrar com itens que você não vai usar.',
        link: '/marketplace',
      },
    ]
  },

  // ——————————————————————————————
  // 3. MOCHILA & INVENTÁRIO
  // ——————————————————————————————
  {
    id: 'mochila',
    title: 'MOCHILA & INVENTÁRIO',
    subtitle: 'Tudo que é seu, guardado aqui',
    color: 'text-blue-400',
    borderColor: 'border-blue-500/30',
    bg: 'bg-blue-900/10',
    iconBg: 'bg-blue-900/30',
    icon: BookOpen,
    items: [
      {
        title: 'Aba ITENS — Consumíveis',
        icon: Package,
        desc: 'Itens de uso único. Use e apareça o QR Code.',
        detail: 'A aba Itens mostra tudo que você comprou e ainda não usou:\n\n• Consumíveis: ao clicar em "USAR ITEM", o sistema gera um Ticket com QR Code. Mostre ao professor/monitor para validar.\n• Permanentes: ficam na mochila sem expirar (salvo se tiverem data de validade definida).\n• Itens de Sala: aparecem aqui se você tiver comprado do Beco Diagonal — com a tag "SALA".\n• Você pode descartar um item clicando em "LIXO" no modal — ação irreversível.\n\nO item de Transferência redireciona para a tela de PIX ao ser usado.',
        link: '/mochila',
      },
      {
        title: 'Aba SKILLS — Habilidades de Rank',
        icon: Zap,
        desc: 'Habilidades passivas desbloqueadas ao subir de Rank.',
        detail: 'Skills são habilidades especiais concedidas automaticamente quando você atinge certos Ranks:\n\n• Aparecem na aba "SKILLS" com barra de usos restantes.\n• Cada skill tem um número de usos por período (ex: 3 usos por trimestre).\n• Ao usar uma skill, ela gera um Ticket para validação — como qualquer item consumível.\n• Skills NÃO podem ser vendidas, trocadas ou transferidas — são pessoais.\n• Se o período resetar (trimestral), os usos voltam ao máximo.\n\nExemplo: a skill "Arrematador" pode dar desconto em leilões para alunos de rank Diamante+.',
        link: '/mochila',
      },
      {
        title: 'Aba BUFFS — Auras Passivas',
        icon: Flame,
        desc: 'Multiplicadores ativos. Funcionam sozinhos, sem ação.',
        detail: 'Buffs são efeitos passivos ativados quando você usa um item do tipo Buff (como o Dobrador ou Triplicador) na aba Itens:\n\n• Ficam ativos por 90 dias após ativação.\n• Funcionam automaticamente — quando um monitor adicionar pontos, o multiplicador aplica sozinho.\n• Tipos disponíveis: DUPLICADOR (2x) e TRIPLICADOR (3x).\n• Só pode ter 1 buff de cada tipo ativo por vez — ativar um novo Dobrador substitui o anterior.\n• A contagem regressiva aparece no card. Quando chegar a 0, o buff expira e some.\n• Buffs NÃO têm botão de ação — você não clica neles, eles trabalham por você.',
        link: '/mochila',
        badge: 'PASSIVO',
        badgeColor: 'text-orange-400 border-orange-800/50 bg-orange-900/20',
      },
      {
        title: 'Aba TICKETS — QR Codes',
        icon: Ticket,
        desc: 'Seus comprovantes de uso. Mostre ao professor.',
        detail: 'Cada vez que você usa um item (consumível ou skill), um Ticket é gerado com:\n\n• QR Code exclusivo com hash de 6 caracteres.\n• Nome e descrição do item usado.\n• Status: PENDENTE (esperando validação) ou USADO (já validado).\n\nComo funciona na prática:\n1. Você usa o item na mochila.\n2. O QR Code aparece na tela.\n3. Você mostra para o professor/monitor.\n4. Ele escaneia ou insere o hash no painel admin.\n5. O ticket muda para USADO.\n\nVocê pode cancelar um ticket PENDENTE para devolver o item à mochila — útil se usou sem querer.',
        link: '/mochila',
      },
    ]
  },

  // ——————————————————————————————
  // 4. RANKS & PROGRESSÃO
  // ——————————————————————————————
  {
    id: 'ranks',
    title: 'RANKS & PROGRESSÃO',
    subtitle: 'Quanto mais você evolui, mais poder tem',
    color: 'text-cyan-400',
    borderColor: 'border-cyan-500/30',
    bg: 'bg-cyan-900/10',
    iconBg: 'bg-cyan-900/30',
    icon: Crown,
    items: [
      {
        title: 'Como Funciona o Rank',
        icon: TrendingUp,
        desc: 'Baseado no maior saldo já alcançado. Gastar não te faz perder.',
        detail: 'O sistema de Rank é calculado com base no maxPcAchieved — o maior saldo que você já teve na vida.\n\n• Gastar PC$ NÃO te faz perder Rank. Se você chegou a 5.000 PC$ e gastou tudo, continua no mesmo Rank.\n• Cada Rank desbloqueia vantagens e Skills automáticas.\n• O Rank aparece no seu Perfil e na Mochila, com a cor e nome correspondente.\n• Admins e monitores veem seu Rank no painel deles.\n\nEssa mecânica incentiva você a ganhar o máximo possível sem medo de gastar.',
      },
      {
        title: 'Tabela de Ranks',
        icon: Star,
        desc: 'Do Comum ao Soberano — 10 níveis de prestígio.',
        detail: 'Os Ranks em ordem crescente de prestígio:\n\n🔸 COMUM — Nível inicial\n🥉 BRONZE — Primeiros passos\n🥈 PRATA — Aluno mediano\n🥇 OURO — Destaque da sala\n💎 DIAMANTE — Elite estudantil\n⚡ ÉPICO — Raro e impressionante\n🌟 LENDÁRIO — Lenda da escola\n🔥 SUPREMO — Quase invencível\n🌹 MITOLÓGICO — Além do humano\n👑 SOBERANO — O ápice absoluto\n\nCada Rank tem uma cor diferente no sistema e pode desbloquear Skills e acessos exclusivos.',
        badge: '10 NÍVEIS',
        badgeColor: 'text-cyan-400 border-cyan-800/50 bg-cyan-900/20',
      },
      {
        title: 'Skills de Rank Automáticas',
        icon: Sparkles,
        desc: 'Habilidades que aparecem na mochila ao subir de nível.',
        detail: 'Ao atingir certos Ranks, o sistema automaticamente adiciona Skills na sua Mochila:\n\n• As Skills aparecem na aba SKILLS com nome, ícone e número de usos.\n• Exemplos: descontos em leilões, acesso prioritário a itens, bônus em eventos.\n• Quando o trimestre vira, Skills com resetPeriod TRIMESTRAL voltam com usos cheios.\n• Skills com resetPeriod NEVER não se resetam — use bem.\n\nFique de olho na sua Mochila ao subir de Rank — pode ter surpresa esperando.',
      },
      {
        title: 'XP & Nível',
        icon: Zap,
        desc: 'XP é separado do PC$. Representa sua experiência total.',
        detail: 'Além do PC$, você também acumula XP (Pontos de Experiência):\n\n• XP não é gasto na loja — é apenas um indicador de quanto você já evoluiu no sistema.\n• Pode ser usado para classificações especiais e eventos que pedem XP mínimo.\n• O nível baseado em XP aparece no Perfil junto ao Rank de PC$.\n\nPense no XP como o seu "nível de jogador" geral, enquanto o PC$ é sua riqueza atual.',
      },
      {
        title: 'Bênção de Merlin',
        icon: Sparkles,
        desc: 'Cargo secreto: +0.5x permanente em todos os ganhos.',
        detail: 'A Bênção de Merlin é um cargo especial secreto concedido pelo Admin a alunos muito especiais.\n\n• Efeito: +0.5x FIXO sobre qualquer multiplicador ativo.\n• Exemplos:\n  — Sem buff + Merlin = 1.5x em cada ganho\n  — Dobrador(2x) + Merlin = 2.5x\n  — Triplicador(3x) + Merlin = 3.5x\n• O bônus é aplicado automaticamente pelo sistema no momento do lançamento de pontos.\n• Não aparece como item na mochila — é um cargo silencioso mas poderoso.\n\nPouquíssimos alunos têm esse cargo. É o maior bônus passivo do jogo.',
        badge: 'LENDÁRIO',
        badgeColor: 'text-fuchsia-400 border-fuchsia-800/50 bg-fuchsia-900/20',
      },
    ]
  },

  // ——————————————————————————————
  // 5. COMPETIÇÃO & GLÓRIA
  // ——————————————————————————————
  {
    id: 'competicao',
    title: 'COMPETIÇÃO & GLÓRIA',
    subtitle: 'A guerra entre turmas começa aqui',
    color: 'text-purple-400',
    borderColor: 'border-purple-500/30',
    bg: 'bg-purple-900/10',
    iconBg: 'bg-purple-900/30',
    icon: Trophy,
    items: [
      {
        title: 'Taça das Casas',
        icon: Trophy,
        desc: 'Batalha trimestral entre turmas. Cada PC$ seu conta.',
        detail: 'A Taça das Casas é a competição principal do sistema:\n\n• Cada turma é uma "Casa". \n• Itens comprados no Beco Diagonal adicionam pontos extras ao baú da sala.\n• O placar pode ser ocultado pelo Admin nas semanas finais do trimestre para gerar suspense.\n• A turma vencedora recebe recompensas épicas: itens exclusivos, PC$ bônus e glória eterna.\n• Faltas, pontos negativos e multas também afetam o placar coletivo.\n\nNão deixe sua turma na mão — cada desafio ganho é um passo mais próximo do triunfo.',
        link: '/taca-das-casas',
        badge: 'TRIMESTRAL',
        badgeColor: 'text-purple-400 border-purple-800/50 bg-purple-900/20',
      },
      {
        title: 'Ranking Global',
        icon: Shield,
        desc: 'Os maiores heróis de toda a escola, rankeados.',
        detail: 'O Ranking Global mostra os alunos com maior saldo e maiores conquistas em toda a escola:\n\n• Ordenado por saldo atual ou por maxPcAchieved (configurável pelo Admin).\n• Mostra Rank, nome, turma e saldo.\n• Você pode filtrar por turma para ver o ranking interno da sua sala.\n• Os primeiros colocados são exibidos com destaque especial no topo.\n\nEstar no topo do ranking é o símbolo máximo de prestígio do sistema. Vai que é você.',
        link: '/ranking',
      },
      {
        title: 'Roleta Mística',
        icon: Gift,
        desc: 'Chance de ganhar prêmios aleatórios. Sorte, quem te tem.',
        detail: 'A Roleta é um sistema de sorteio que dá prêmios aleatórios:\n\n• Para girar, você usa um item de Roleta da sua Mochila (comprado na loja ou ganho em eventos).\n• Os prêmios possíveis incluem PC$, itens exclusivos, e até raridades que não existem na loja.\n• O resultado é registrado no histórico de roleta do seu perfil.\n• Não existe "garantia" de prêmio raro — é pura sorte.\n• Em eventos especiais, o Admin pode liberar giros gratuitos para todos.\n\nUse seus tickets de roleta em momentos estratégicos.',
        link: '/roleta',
      },
      {
        title: 'Eventos Especiais',
        icon: Star,
        desc: 'Gincanas e desafios sazonais com recompensas únicas.',
        detail: 'O Admin pode criar eventos especiais que ficam disponíveis por tempo limitado:\n\ \n• Leilões temáticos: lotes especiais liberados apenas durante o evento.\n• Roletas especiais: com tabelas de prêmios diferentes do normal.\n• Itens de Evento: vendidos na loja com raridade EVENTO — raros e colecionáveis.\n• Pontuações duplas: o Admin pode ativar períodos onde os pontos dados valem em dobro.\n\nFique de olho nos avisos do sistema — os melhores prêmios aparecem em eventos.',
        badge: 'SAZONAL',
        badgeColor: 'text-green-400 border-green-800/50 bg-green-900/20',
      },
    ]
  },

  // ——————————————————————————————
  // 6. PERFIL & CARGOS
  // ——————————————————————————————
  {
    id: 'perfil',
    title: 'PERFIL & CARGOS',
    subtitle: 'Sua identidade no sistema',
    color: 'text-rose-400',
    borderColor: 'border-rose-500/30',
    bg: 'bg-rose-900/10',
    iconBg: 'bg-rose-900/30',
    icon: User,
    items: [
      {
        title: 'Seu Perfil',
        icon: User,
        desc: 'Rank, saldo, XP, avatar e conquistas pessoais.',
        detail: 'O Perfil é sua identidade pública no sistema:\n\n• Mostra seu Rank atual, saldo de PC$, XP e nível.\n• Você pode personalizar com um avatar (envio de foto).\n• Aparece no ranking global para os outros alunos verem.\n• Exibe os cargos especiais que você possui (Representante, Monitor, etc.).\n• Histórico de compras e pontuações fica registrado aqui.\n\nAcesse /perfil para editar e visualizar suas estatísticas.',
        link: '/perfil',
      },
      {
        title: 'Tipos de Usuário',
        icon: Users,
        desc: 'Student, Monitor, Admin e Dev — cada um com poderes.',
        detail: 'Existem 4 tipos de usuário no sistema:\n\n• STUDENT (Aluno): acesso padrão — loja, mochila, leilão, perfil.\n• MONITOR: adiciona e remove pontos dos alunos da própria turma. Vê logs de suas ações.\n• ADMIN: controle total — gerencia todos os alunos, loja, leilões e configurações do sistema.\n• DEV: acesso máximo ao sistema, inclui manutenção e configurações técnicas.\n\nMonitores são alunos promovidos pelo Admin. Não tente fazer o que não é da sua função — o sistema registra tudo.',
      },
      {
        title: 'Cargos Especiais',
        icon: Crown,
        desc: 'Cargos que dão identidade e bônus únicos.',
        detail: 'Além do tipo de usuário, você pode ter Cargos Especiais:\n\n🤓 Monitor de Disciplina\n🏫 Monitor da Escola\n🧙 Armada de Dumbledore\n📚 Monitor de Biblioteca\n⚽ Monitor de Quadra\n🎼 Banda\n🫡 Representante\n🎮 Colaborador (dado a todos os monitores)\n😎 Estudante Honorário\n✨ Bênção de Merlin (segredo)\n\nCargos são atribuídos e removidos pelo Admin. Eles podem aparecer no seu perfil e alguns concedem bônus passivos (como Merlin).',
      },
      {
        title: 'Bloqueio de Conta',
        icon: Lock,
        desc: 'Contas bloqueadas perdem acesso ao sistema.',
        detail: 'O Admin pode bloquear uma conta de aluno:\n\n• Motivos: comportamento inadequado, trapaça, fraude ou regras específicas da escola.\n• Efeito: o aluno não consegue mais fazer login no sistema.\n• Desbloqueio: feito manualmente pelo Admin quando a situação for resolvida.\n• Admins e Devs nunca podem ser bloqueados pelo sistema.\n\nTodas as ações do sistema são registradas em logs — não existe trapaça invisível.',
        badge: 'REGRA',
        badgeColor: 'text-red-400 border-red-800/50 bg-red-900/20',
      },
      {
        title: 'Modo Manutenção',
        icon: AlertTriangle,
        desc: 'Quando ativado, apenas Admins conseguem entrar.',
        detail: 'O sistema pode entrar em Modo Manutenção:\n\n• Ativado pelo Admin no Painel de Controle.\n• Quando ativo, alunos e monitores não conseguem fazer login.\n• Admins e Devs continuam com acesso normalmente.\n• Geralmente acontece antes de atualizações importantes ou ao final do trimestre.\n• A mensagem de manutenção aparece na tela de login enquanto estiver ativo.\n\nQuando o modo manutenção estiver ativo, aguarde — o sistema voltará em breve.',
      },
    ]
  },

  // ——————————————————————————————
  // 7. ADMINISTRAÇÃO & REGRAS
  // ——————————————————————————————
  {
    id: 'regras',
    title: 'REGRAS & TRIBUNAL',
    subtitle: 'O sistema vê tudo. Tudo é registrado.',
    color: 'text-slate-400',
    borderColor: 'border-slate-500/30',
    bg: 'bg-slate-900/10',
    iconBg: 'bg-slate-800/50',
    icon: Scroll,
    items: [
      {
        title: 'Logs do Sistema',
        icon: Scroll,
        desc: 'Cada ação deixa um rastro. Admins veem tudo.',
        detail: 'O sistema registra automaticamente todas as ações importantes:\n\n• Compras na loja e leilão\n• Transferências de PC$ entre alunos\n• Tickets criados, validados e cancelados\n• Pontos adicionados ou removidos por monitores\n• Bloqueios, promoções e alterações de perfil\n• Ativações de buff e resgates de VIP\n\nNenhuma ação fica sem registro. Admins podem filtrar e auditar qualquer movimentação do sistema a qualquer momento.',
      },
      {
        title: 'Validação de Tickets',
        icon: Key,
        desc: 'Professors validam com o hash ou QR Code do ticket.',
        detail: 'O fluxo completo de validação de um item:\n\n1. Aluno usa o item na Mochila → Ticket gerado com QR Code.\n2. Aluno mostra o QR Code ou informa o hash (6 letras) ao professor/monitor.\n3. O professor acessa o painel e valida o ticket pelo hash.\n4. O ticket muda de PENDENTE para USADO.\n5. O item consumido não volta para a mochila após validação.\n\nSe o ticket for CANCELADO antes da validação, o item volta para a mochila do aluno. Tickets USADOS não podem ser cancelados.',
      },
      {
        title: 'Limite Financeiro Anual',
        icon: TrendingUp,
        desc: 'Existe um teto de recebimento por ano para cada aluno.',
        detail: 'O sistema possui um controle de limite financeiro anual (Regra do Oloko):\n\n• Cada aluno tem um limite máximo de PC$ que pode receber por ano letivo.\n• O contador é resetado automaticamente em virada de ano.\n• Isso impede que monitores sobrecarreguem um aluno específico com pontos infinitos.\n• O limite pode ser ajustado pelo Admin conforme necessidade pedagógica.\n\nÉ uma medida de equilíbrio para manter a economia saudável.',
      },
      {
        title: 'Boas Práticas',
        icon: Info,
        desc: 'Como usar o sistema de forma correta e honesta.',
        detail: 'Para manter o sistema funcionando bem para todos:\n\n✅ Use seus itens com propósito — tickets são rastreados.\n✅ Não empreste sua conta para ninguém.\n✅ Se encontrar um bug, reporte ao Admin — não abuse.\n✅ Transferências são rastreadas — não tente lavar PC$.\n✅ Respeite os limites dos empréstimos — dívidas prejudicam você.\n✅ Cuidado com quem te vende código VIP — pode ser falso.\n\nO sistema foi feito para ser divertido e justo. Respeite as regras e aproveite ao máximo.',
        badge: 'LEIA',
        badgeColor: 'text-blue-400 border-blue-800/50 bg-blue-900/20',
      },
    ]
  },
];

// ========================
// COMPONENTE: Item expandível
// ========================
interface WikiCardProps {
  item: WikiItem;
  section: WikiSection;
  onNavigate: (link: string) => void;
  isMobile: boolean;
}

const WikiCard = memo(({ item, section, onNavigate, isMobile }: WikiCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const Icon = item.icon;

  return (
    <div
      className={cn(
        "rounded-xl border border-white/5 overflow-hidden transition-colors",
        isMobile ? "bg-black/40" : "bg-black/30 hover:bg-black/50"
      )}
    >
      {/* Header do card */}
      <button
        className="w-full text-left p-4 flex items-start gap-3"
        onClick={() => setExpanded(v => !v)}
      >
        <div className={cn(
          "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border mt-0.5",
          section.borderColor,
          section.color,
          "bg-black/50"
        )}>
          <Icon size={16} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <h3 className="font-vt323 text-[18px] text-white leading-tight">{item.title}</h3>
            {item.badge && (
              <span className={cn("text-[8px] font-mono px-1.5 py-0.5 rounded border uppercase tracking-wider", item.badgeColor)}>
                {item.badge}
              </span>
            )}
          </div>
          <p className="font-mono text-[10px] text-slate-500 leading-relaxed">{item.desc}</p>
        </div>

        <div className={cn(
          "shrink-0 p-1 rounded transition-transform mt-0.5",
          expanded && "rotate-90"
        )}>
          <ChevronRight size={14} className="text-slate-600" />
        </div>
      </button>

      {/* Detalhe expansível */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className={cn("mx-4 mb-4 p-4 rounded-lg border", section.borderColor, section.bg)}>
              {/* Texto com quebras de linha */}
              <p className="font-mono text-[11px] text-slate-300 leading-relaxed whitespace-pre-line">
                {item.detail}
              </p>

              {/* Botão de navegação */}
              {item.link && (
                <button
                  onClick={() => onNavigate(item.link!)}
                  className={cn(
                    "mt-3 flex items-center gap-2 font-press text-[9px] px-3 py-2 rounded-lg transition-colors",
                    "bg-black/40 border",
                    section.borderColor,
                    section.color,
                    "hover:bg-black/60"
                  )}
                >
                  <ExternalLink size={12} />
                  ACESSAR AGORA
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
WikiCard.displayName = 'WikiCard';

// ========================
// COMPONENTE: Seção Accordion
// ========================
interface SectionProps {
  section: WikiSection;
  isOpen: boolean;
  onToggle: () => void;
  onNavigate: (link: string) => void;
  isMobile: boolean;
  searchTerm: string;
  sectionIndex: number;
}

const WikiSection = memo(({
  section, isOpen, onToggle, onNavigate, isMobile, searchTerm, sectionIndex
}: SectionProps) => {
  const SectionIcon = section.icon;
  const forceOpen = !!searchTerm;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: sectionIndex * 0.06, duration: 0.3 }}
      className={cn("rounded-2xl border-2 overflow-hidden", section.borderColor, "bg-slate-950")}
    >
      {/* Cabeçalho da seção */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 md:p-5 hover:bg-white/5 transition-colors active:bg-white/10"
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center border",
            section.borderColor, section.bg, section.color
          )}>
            <SectionIcon size={20} />
          </div>
          <div className="text-left">
            <p className={cn("font-press text-[10px] md:text-xs uppercase leading-none", section.color)}>
              {section.title}
            </p>
            <p className="font-mono text-[9px] text-slate-600 mt-0.5">{section.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] text-slate-700 hidden sm:block">
            {section.items.length} tópicos
          </span>
          <div className={cn(
            "p-1.5 rounded-lg transition-all duration-200",
            (isOpen || forceOpen) && section.bg
          )}>
            <ChevronDown
              size={16}
              className={cn(
                "transition-transform duration-200 text-slate-600",
                (isOpen || forceOpen) && "rotate-180 " + section.color
              )}
            />
          </div>
        </div>
      </button>

      {/* Itens da seção */}
      <AnimatePresence initial={false}>
        {(isOpen || forceOpen) && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="p-3 md:p-4 pt-0 border-t border-white/5 space-y-2">
              {section.items.map((item) => (
                <WikiCard
                  key={item.title}
                  item={item}
                  section={section}
                  onNavigate={onNavigate}
                  isMobile={isMobile}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});
WikiSection.displayName = 'WikiSection';

// ========================
// COMPONENTE PRINCIPAL
// ========================
export function WikiMap() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [searchTerm, setSearchTerm] = useState('');
  const [openSectionId, setOpenSectionId] = useState<string | null>('economia');

  const onNavigate = useCallback((link: string) => navigate(link), [navigate]);

  const toggleSection = useCallback((id: string) => {
    setOpenSectionId(prev => prev === id ? null : id);
  }, []);

  // Filtro com busca em título + desc + detail
  const filteredSections = useMemo(() => {
    if (!searchTerm.trim()) return WIKI_DATA;
    const q = searchTerm.toLowerCase();
    return WIKI_DATA.map(section => ({
      ...section,
      items: section.items.filter(item =>
        item.title.toLowerCase().includes(q) ||
        item.desc.toLowerCase().includes(q) ||
        item.detail.toLowerCase().includes(q)
      )
    })).filter(s => s.items.length > 0);
  }, [searchTerm]);

  // Contagem total
  const totalTopics = WIKI_DATA.reduce((acc, s) => acc + s.items.length, 0);

  return (
    <PageTransition className="min-h-screen bg-[#080810] overflow-x-hidden">

      {/* BG estático — sem blur pesado */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px]" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 rounded-full blur-[80px]" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 pt-20 pb-32 md:pt-10 md:pl-32">

        {/* ===== HEADER ===== */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-full mb-4">
            <Compass size={12} className="text-slate-500" />
            <span className="font-mono text-[10px] text-slate-500 uppercase tracking-widest">MANUAL DO ESTUDANTE</span>
          </div>

          <h1 className="font-vt323 text-5xl sm:text-6xl text-white leading-none uppercase mb-2">
            MAPA DO{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-cyan-400">
              SISTEMA
            </span>
          </h1>

          <p className="font-mono text-xs text-slate-500 leading-relaxed max-w-md">
            Guia completo da ETE Gil Rodrigues Gamificada.{' '}
            <span className="text-slate-400">{totalTopics} tópicos</span>{' '}
            cobrindo economia, regras, poderes e muito mais.
          </p>

          {/* Chips de seções como acesso rápido */}
          <div className="flex flex-wrap gap-2 mt-5">
            {WIKI_DATA.map(s => {
              const SIcon = s.icon;
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    setOpenSectionId(s.id);
                    setSearchTerm('');
                    setTimeout(() => {
                      document.getElementById(`wiki-${s.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 80);
                  }}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-mono transition-colors",
                    s.borderColor, s.bg, s.color,
                    "hover:brightness-125 active:scale-95"
                  )}
                >
                  <SIcon size={11} />
                  {s.title.split(' ')[0]}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* ===== BUSCA ===== */}
        <div className="relative mb-6">
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Buscar: banco, leilão, buffs, Merlin..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border-2 border-slate-800 focus:border-blue-500/60 rounded-xl py-3.5 pl-11 pr-10 text-white font-vt323 text-xl outline-none transition-colors placeholder:text-slate-700"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-600 hover:text-slate-400"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Resultado de busca */}
        {searchTerm && (
          <p className="font-mono text-[10px] text-slate-600 mb-4">
            {filteredSections.reduce((a, s) => a + s.items.length, 0)} resultado(s) para "{searchTerm}"
          </p>
        )}

        {/* ===== LISTA DE SEÇÕES ===== */}
        <div className="space-y-3">
          {filteredSections.length > 0 ? (
            filteredSections.map((section, idx) => (
              <div key={section.id} id={`wiki-${section.id}`}>
                <WikiSection
                  section={section}
                  isOpen={openSectionId === section.id}
                  onToggle={() => toggleSection(section.id)}
                  onNavigate={onNavigate}
                  isMobile={isMobile}
                  searchTerm={searchTerm}
                  sectionIndex={idx}
                />
              </div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <Search className="w-10 h-10 text-slate-800 mx-auto mb-3" />
              <p className="font-vt323 text-2xl text-slate-700">NADA ENCONTRADO</p>
              <p className="font-mono text-xs text-slate-700 mt-1">
                Tente "banco", "leilão" ou "buff"
              </p>
            </motion.div>
          )}
        </div>

        {/* ===== RODAPÉ ===== */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-10 p-4 rounded-xl border border-slate-800 bg-slate-900/50"
        >
          <div className="flex items-start gap-3">
            <Info size={14} className="text-slate-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-mono text-[10px] text-slate-500 leading-relaxed">
                Esta wiki é atualizada conforme o sistema evolui.
                Dúvidas não respondidas aqui? Fale com o monitor da sua sala ou com o Admin.
              </p>
              <p className="font-press text-[8px] text-slate-700 mt-2 uppercase tracking-widest">
                ETE Gil Rodrigues — Sistema Gamificado
              </p>
            </div>
          </div>
        </motion.div>

      </div>
    </PageTransition>
  );
}
