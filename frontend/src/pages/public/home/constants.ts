import { Gavel, Trophy, Zap, Sparkles, Globe, Shield, Crown, Gamepad2, Award, type LucideIcon } from 'lucide-react';

export interface EventItem {
    id?: string; // Opcional, caso usemos depois
    title: string;
    subtitle: string;
    desc: string;
    icon: LucideIcon;
    color: string;
    glowColor: string;
    borderColor: string;
    textColor: string;
    link: string;
    external: boolean;
    btnText: string; 
    stats?: { label: string; value: string }[];
}

export const EVENTS = [
     {
        id: 'taca',
        title: 'TAÇA DAS CASAS',
        subtitle: 'THE ULTIMATE BATTLE',
        desc: 'A competição suprema entre as Casas. Cada ação conta pontos. Cada vitória ecoa na eternidade. A glória espera os dignos.',
        color: 'from-yellow-500 via-amber-500 to-orange-600',
        borderColor: 'border-yellow-500',
        textColor: 'text-yellow-400',
        glowColor: 'rgba(234, 179, 8, 0.6)',
        icon: Trophy,
        external: false,
        btnText: "ENTRAR NO SISTEMA",
        link: '/login',
        stats: [
            { label: 'Casas Ativas', value: '12' },
            { label: 'Taças/Ano', value: '3' },
            { label: 'Prêmio Final', value: '1000 PC$ + PLAQUINHA + SESSÃO CINEMA' }
        ]
    },
    {
        id: 'intergil',
        title: 'INTERGIL',
        subtitle: 'SPORTS CHAMPIONSHIP',
        desc: 'O maior evento esportivo do sistema. Placares em tempo real. Estatísticas avançadas. Arena digital.',
        color: 'from-blue-500 via-cyan-500 to-teal-500',
        borderColor: 'border-blue-500',
        textColor: 'text-blue-400',
        glowColor: 'rgba(59, 130, 246, 0.6)',
        icon: Zap,
        external: true,
        btnText: "ACESSAR ARENA",
        link: 'http://89.116.73.177:3000',
        stats: [
            { label: 'Modalidades', value: '74' },
            { label: 'Salas', value: '12' },
            { label: 'Status', value: 'AO VIVO' }
        ]
    },
    {
        id: 'leiturarte',
        title: 'LEITURARTE',
        subtitle: 'CREATIVE REALM',
        desc: 'Onde palavras viram poder. Literatura gamificada. Cada página lida, XP acumulado. Arte que pontua.',
        color: 'from-pink-500 via-rose-500 to-red-500',
        borderColor: 'border-pink-500',
        textColor: 'text-pink-400',
        glowColor: 'rgba(236, 72, 153, 0.6)',
        icon: Sparkles,
        external: false,
        btnText: "EM BREVE",
        link: '/coming-soon?module=LEITURARTE',
        stats: [
           { label: 'Obras', value: '12' },
            { label: 'Apresentações', value: '12' },
            { label: 'Conhecimento', value: '∞ ' }
        ]
    },
    {
        id: 'gincana',
        title: 'GINCANA ECOLÓGICA',
        subtitle: 'SAVE THE WORLD',
        desc: 'Missões reais com impacto real. Sustentabilidade gamificada. O planeta agradece, sua casa também.',
        color: 'from-green-500 via-emerald-500 to-lime-500',
        borderColor: 'border-green-500',
        textColor: 'text-green-400',
        glowColor: 'rgba(34, 197, 94, 0.6)',
        icon: Globe,
        external: false,
        btnText: "EM BREVE",
        link: '/coming-soon?module=GINCANA ECOLÓGICA',
        stats: [
            { label: 'Meta', value: 'GLOBAL' },
            { label: 'Impacto', value: 'ALTO' }
        ]
    }
];


export const FEATURES = [
    {
        icon: Gamepad2,
        title: 'GAMIFICAÇÃO TOTAL',
        desc: 'Notas viram PC$. Presença vira pontuação. Tudo que você faz na escola te evolui no sistema.',
        color: 'purple',
        gradient: 'from-purple-500 to-violet-600'
    },
    {
        icon: Trophy,
        title: 'RANKING GLOBAL',
        desc: 'Compita com toda a escola. Leaderboards em tempo real. Seja o número 1.',
        color: 'yellow',
        gradient: 'from-yellow-500 to-amber-600'
    },
    {
        icon: Shield,
        title: 'SISTEMA DE CASAS',
        desc: 'Junte-se à sua Casa. Lute pelos seus. Cada ponto individual soma pro coletivo.',
        color: 'blue',
        gradient: 'from-blue-500 to-cyan-600'
    },
    {
        icon: Award,
        title: 'LOJA EXCLUSIVA',
        desc: 'Troque PC$ por itens reais. Benefícios escolares. Prêmios épicos.',
        color: 'pink',
        gradient: 'from-pink-500 to-rose-600'
    },
    {
        icon: Gavel, // Ícone de Martelo
        title: 'CASA DE LEILÕES',
        desc: 'Dê lances em itens raros em tempo real. Quem dá mais, leva a glória.',
        color: 'green',
        gradient: 'from-green-500 to-emerald-600'
    },
    {
        icon: Crown,
        title: 'TÍTULOS & BADGES',
        desc: 'Conquiste títulos lendários. Exiba suas badges. Prove seu valor.',
        color: 'orange',
        gradient: 'from-orange-500 to-red-600'
    }
];
