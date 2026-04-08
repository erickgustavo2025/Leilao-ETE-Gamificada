import React from 'react';
import { Shield, Eye, Lock, Database, Info, ArrowLeft,  } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PoliticaPrivacidade: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-cyan-500/30">
      {/* 🌌 Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12 relative z-10">
        
        {/* 🔙 Back Button */}
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors mb-8 group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          Voltar
        </button>

        {/* 🛡️ Header */}
        <header className="mb-16">
          <div className="inline-flex items-center justify-center p-3 bg-cyan-500/10 rounded-2xl mb-6 ring-1 ring-cyan-500/20">
            <Shield className="text-cyan-400" size={32} />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 mb-4">
            Política de Privacidade
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed max-w-2xl">
            Sua privacidade e segurança são nossa maior prioridade. A ETE Gamificada foi desenhada para ser um ambiente seguro, ético e divertido de aprendizado.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
             <span className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-xs text-slate-400">Versão 1.0</span>
             <span className="px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-xs text-green-400 flex items-center gap-1">
               <Lock size={12} /> ECA Digital Compliant (Lei 15.211/2025)
             </span>
          </div>
        </header>

        {/* 📄 Content Sections */}
        <div className="space-y-12">
          
          {/* Section 1 */}
          <section className="bg-slate-900/50 border border-slate-800 p-8 rounded-3xl backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                <Database size={24} />
              </div>
              <h2 className="text-2xl font-semibold text-white">Quais dados coletamos?</h2>
            </div>
            <p className="text-slate-400 leading-relaxed mb-4">
              Para o funcionamento da sua conta e da economia do jogo, precisamos guardar algumas informações:
            </p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: 'Identidade', val: 'Nome completo e Matrícula escolar.' },
                { label: 'Acadêmico', val: 'Suas notas e evolução nas matérias.' },
                { label: 'Econômico', val: 'Saldo de PC$, itens comprados e trocas.' },
                { label: 'Sessão', val: 'Último acesso e tempo de uso na plataforma.' }
              ].map((item, idx) => (
                <li key={idx} className="flex gap-3 text-sm p-3 bg-slate-950/50 rounded-xl border border-slate-800/50">
                  <span className="text-cyan-400 font-bold">•</span>
                  <div>
                    <strong className="text-slate-200 block">{item.label}</strong>
                    <span className="text-slate-500">{item.val}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Section 2 */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400">
                <Info size={24} />
              </div>
              <h2 className="text-2xl font-semibold text-white">Por que coletamos esses dados?</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-slate-900/30 border border-slate-800 rounded-2xl">
                <h3 className="text-slate-200 font-medium mb-2">Gamificação</h3>
                <p className="text-sm text-slate-500 leading-relaxed">Transformar seu esforço escolar em recompensas virtuais e motivar seus estudos.</p>
              </div>
              <div className="p-6 bg-slate-900/30 border border-slate-800 rounded-2xl">
                <h3 className="text-slate-200 font-medium mb-2">Suporte (Oráculo)</h3>
                <p className="text-sm text-slate-500 leading-relaxed">O Oráculo GIL usa suas notas para te dar conselhos de estudo personalizados e precisos.</p>
              </div>
              <div className="p-6 bg-slate-900/30 border border-slate-800 rounded-2xl">
                <h3 className="text-slate-200 font-medium mb-2">Segurança</h3>
                <p className="text-sm text-slate-500 leading-relaxed">Garantir que as trocas de itens sejam justas e que a economia da escola seja protegida.</p>
              </div>
            </div>
          </section>

          {/* Section 3 - AI specific */}
          <section className="bg-gradient-to-b from-slate-900/80 to-slate-950 border border-slate-800 p-8 rounded-3xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-400">
                <Eye size={24} />
              </div>
              <h2 className="text-2xl font-semibold text-white">Transparência Digital & IA</h2>
            </div>
            <p className="text-slate-400 leading-relaxed mb-6">
              Em conformidade com o <strong>Art. 26 da Lei 15.211/2025</strong>, declaramos que:
            </p>
            <div className="space-y-4">
              <div className="flex gap-4 p-4 bg-slate-950 border-l-4 border-l-cyan-500 rounded-r-xl">
                 <Lock className="text-cyan-500 shrink-0" size={20} />
                 <p className="text-sm text-slate-300">
                   <strong>Sem Fins Comerciais:</strong> Seus dados nunca serão passados para empresas ou usados para te mostrar anúncios. Esta plataforma é 100% educacional.
                 </p>
              </div>
              <div className="flex gap-4 p-4 bg-slate-950 border-l-4 border-l-purple-500 rounded-r-xl">
                 <Database className="text-purple-500 shrink-0" size={20} />
                 <p className="text-sm text-slate-300">
                   <strong>Registro de IA:</strong> As perguntas feitas ao Oráculo GIL são registradas para que nossos desenvolvedores possam melhorar a inteligência do tutor e garantir que ele seja sempre respeitoso.
                 </p>
              </div>
            </div>
          </section>

          {/* Section 4 - Rights */}
          <section className="text-center py-12">
            <h2 className="text-2xl font-semibold text-white mb-6">Seus Direitos</h2>
            <p className="text-slate-400 max-w-xl mx-auto mb-8">
              Você pode solicitar à administração da escola a visualização, correção ou exclusão dos seus dados a qualquer momento.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="flex items-center gap-2 text-slate-500 text-sm">
               
              </div>
            </div>
          </section>

        </div>

        {/* 📋 Footer */}
        <footer className="mt-16 pt-8 border-t border-slate-800 text-center text-slate-600 text-xs">
          <p>© 2026 ETE Gamificada. Todos os direitos reservados à instituição de ensino.</p>
        </footer>

      </div>
    </div>
  );
};

export default PoliticaPrivacidade;
