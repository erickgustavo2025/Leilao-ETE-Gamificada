import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wand2, Loader2, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { PageTransition } from '../../components/layout/PageTransition';

export function ArmadaLogin() {
  const navigate = useNavigate();
  const { signIn, user } = useAuth();
  
  const [matricula, setMatricula] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // 🔥 CORREÇÃO: Verificação movida para useEffect
  useEffect(() => {
    if (user) {
      if (user.cargos?.includes('armada_dumbledore') || user.role === 'admin') {
        navigate('/armada/scanner');
      } else {
        toast.error("Acesso restrito à Armada de Dumbledore.");
        navigate('/taca-das-casas'); // Ou dashboard
      }
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matricula || !senha) return toast.warning("Preencha os campos mágicos.");

    setLoading(true);
    try {
      await signIn(matricula, senha);
      // O useEffect acima vai capturar a mudança do 'user' e redirecionar
    } catch (error: any) {
      console.error(error);
      // O AuthContext já deve soltar toast, mas por garantia:
      // toast.error("Credenciais inválidas.");
    } finally {
      setLoading(false);
    }
  };

  // Se o usuário estiver logado, não renderiza o form enquanto redireciona
  if (user) return null;

  return (
    <PageTransition className="min-h-screen bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Místico */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] bg-purple-900/10 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[600px] h-[600px] bg-blue-900/10 blur-[150px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md bg-black/60 backdrop-blur-xl border-2 border-purple-900/50 rounded-2xl p-8 relative z-10 shadow-[0_0_50px_rgba(88,28,135,0.2)]"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-800 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-white/10 shadow-lg shadow-purple-500/20">
            <Wand2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-press text-xl text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 mb-2">
            ARMADA DE DUMBLEDORE
          </h1>
          <p className="font-mono text-xs text-slate-500 uppercase tracking-widest">
            Acesso Restrito - Validação de Itens
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="font-mono text-[10px] text-slate-400 uppercase ml-1">Matrícula</label>
            <div className="relative group">
              <input 
                type="text" 
                value={matricula}
                onChange={e => setMatricula(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white font-mono focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 outline-none transition-all group-hover:border-slate-600"
                placeholder="0000000"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-mono text-[10px] text-slate-400 uppercase ml-1">Senha Mágica</label>
            <div className="relative group">
              <input 
                type={showPassword ? "text" : "password"}
                value={senha}
                onChange={e => setSenha(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white font-mono focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 outline-none transition-all group-hover:border-slate-600"
                placeholder="••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-700 to-blue-700 hover:from-purple-600 hover:to-blue-600 text-white font-press text-xs py-4 rounded-xl shadow-lg shadow-purple-900/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            {loading ? "CONJURANDO..." : "ACESSAR SISTEMA"}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-white/5 text-center">
          <p className="text-[10px] text-slate-600 font-mono">
            "A felicidade pode ser encontrada mesmo nas horas mais difíceis..."
          </p>
        </div>
      </motion.div>
    </PageTransition>
  );
}