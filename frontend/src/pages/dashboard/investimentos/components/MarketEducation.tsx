import { BookOpen, TrendingUp, ShieldCheck, Zap, Info, Rocket } from 'lucide-react';


export function MarketEducation() {
    return (
        <div className="space-y-6">
            <div className="p-6 bg-gradient-to-br from-emerald-600/20 to-blue-600/20 border border-emerald-500/30 rounded-[2rem] backdrop-blur-md">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-emerald-500/20 rounded-xl border border-emerald-500/30">
                        <BookOpen size={20} className="text-emerald-400" />
                    </div>
                    <h3 className="font-vt323 text-3xl text-white uppercase leading-none">Escola de Investidores GIL</h3>
                </div>
                <p className="font-mono text-[11px] text-slate-400 leading-relaxed uppercase tracking-wider">
                    "O conhecimento é o melhor dividendo." - Oráculo GIL. <br />
                    Entenda como funciona o mercado da ETE Gamificada antes de operar seu capital.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Dica 1: Startups */}
                <div className="p-5 bg-black/40 border border-slate-800 rounded-3xl hover:border-emerald-500/40 transition-all">
                    <div className="flex items-center gap-3 mb-3">
                        <Rocket className="text-emerald-400" size={18} />
                        <h4 className="font-press text-[9px] text-white uppercase">Análise de Startups</h4>
                    </div>
                    <p className="font-mono text-[10px] text-slate-500 leading-relaxed">
                        DIFERENTEMENTE das ações reais, o valor de uma Startup no site depende da <span className="text-emerald-400">PERFORMANCE ACADÊMICA e AVALIAÇÃO DOS PROFESSORES</span> Se eles tirarem notas boas (N1/N2) e tiverem uma boa avaliação dos professores, o valor da empresa sobe!
                    </p>
                </div>

                {/* Dica 2: Vesting */}
                <div className="p-5 bg-black/40 border border-slate-800 rounded-3xl hover:border-blue-500/40 transition-all">
                    <div className="flex items-center gap-3 mb-3">
                        <ShieldCheck className="text-blue-400" size={18} />
                        <h4 className="font-press text-[9px] text-white uppercase">Regra de Vesting</h4>
                    </div>
                    <p className="font-mono text-[10px] text-slate-500 leading-relaxed">
                        Todo ativo comprado tem uma <span className="text-blue-400">CARÊNCIA DE 2 SEMANAS</span> para venda. Isso protege a economia contra fraudes durante o reset trimestral. Pense a longo prazo!
                    </p>
                </div>

                {/* Dica 3: Volatilidade */}
                <div className="p-5 bg-black/40 border border-slate-800 rounded-3xl hover:border-purple-500/40 transition-all">
                    <div className="flex items-center gap-3 mb-3">
                        <TrendingUp className="text-purple-400" size={18} />
                        <h4 className="font-press text-[9px] text-white uppercase">Ações & Cripto</h4>
                    </div>
                    <p className="font-mono text-[10px] text-slate-500 leading-relaxed">
                        As cotações do mercado real oscilam conforme o mundo exterior. <span className="text-purple-400">DIVERSIFIQUE!</span> Não coloque todos os seus PC$ em um único ativo.
                    </p>
                </div>

                {/* Dica 4: Dividendos */}
                <div className="p-5 bg-black/40 border border-slate-800 rounded-3xl hover:border-yellow-500/40 transition-all">
                    <div className="flex items-center gap-3 mb-3">
                        <Zap className="text-yellow-400" size={18} />
                        <h4 className="font-press text-[9px] text-white uppercase">Dividendos Diários</h4>
                    </div>
                    <p className="font-mono text-[10px] text-slate-500 leading-relaxed">
                        Manter certos ativos em carteira pode gerar <span className="text-yellow-400">RENDA PASSIVA</span> diária. É o seu dinheiro trabalhando enquanto as aulas acontecem.
                    </p>
                </div>
            </div>

            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-start gap-3">
                <Info size={16} className="text-blue-400 flex-shrink-0 mt-1" />
                <p className="text-[9px] font-mono text-slate-500 uppercase italic">
                    Nota: O Gil Investe simula o mercado real para fins educacionais. Todas as transações usam exclusivamente a moeda virtual PC$.
                </p>
            </div>
        </div>
    );
}
