import { useState, useEffect } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { QrCode, CheckCircle, XCircle, Camera, CameraOff, Wand2, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { PixelCard } from '../../components/ui/PixelCard';
import { PixelButton } from '../../components/ui/PixelButton';
import { api } from '../../api/axios-config';
import { useGameSound } from '../../hooks/useGameSound';
import { PageTransition } from '../../components/layout/PageTransition';
import { useAuth } from '../../contexts/AuthContext';

export function ArmadaScanner() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { playSuccess, playError } = useGameSound();
    
    const [hash, setHash] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [isCamOpen, setIsCamOpen] = useState(false);

    // 🔒 Segurança: Só Armada ou Admin entra aqui
    useEffect(() => {
        if (user && !user.cargos?.includes('armada_dumbledore') && user.role !== 'admin') {
            toast.error("Acesso negado.");
            navigate('/dashboard');
        }
    }, [user, navigate]);

    async function validateTicket(code: string) {
        if (!code || code.length < 3) return;
        if (loading) return;

        setLoading(true);
        setResult(null);
        setIsCamOpen(false); 

        try {
            // .trim() remove espaços que podem causar erro 404
            const cleanCode = code.trim();
            const res = await api.post('/tickets/validate', { hash: cleanCode });
            
            setResult({ success: true, data: res.data.ticket });
            playSuccess();
            toast.success("ITEM VALIDADO E ENTREGUE!");
            setHash('');
        } catch (error: any) {
            playError();
            setResult({ success: false, message: error.response?.data?.message || "Ticket inválido ou não encontrado." });
            toast.error("ERRO NA VALIDAÇÃO");
        } finally {
            setLoading(false);
        }
    }

    return (
        // 🔥 ADICIONADO pt-24 PARA NÃO FICAR ATRÁS DO LUCKY BLOCK
        <PageTransition className="min-h-screen bg-[#050505] p-4 pt-24 flex flex-col relative overflow-hidden">
            
            {/* Background Místico */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-purple-900/20 blur-[100px] animate-pulse" />
                <div className="absolute bottom-[-20%] right-[-20%] w-[500px] h-[500px] bg-blue-900/20 blur-[100px] animate-pulse" />
            </div>

            {/* Header */}
            <div className="relative z-10 max-w-md mx-auto w-full mb-8 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-900/30 rounded-xl border border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                        <Wand2 size={24} className="text-purple-400" />
                    </div>
                    <div>
                        <h1 className="font-vt323 text-3xl text-white leading-none">ARMADA</h1>
                        <p className="font-mono text-[10px] text-purple-400 tracking-widest">SCANNER DE ITENS</p>
                    </div>
                </div>
                <button 
                    onClick={() => navigate('/taca-das-casas')}
                    className="text-xs font-mono text-slate-500 hover:text-red-400 transition-colors flex items-center gap-1"
                >
                    <LogOut size={14} /> SAIR
                </button>
            </div>

            <div className="relative z-10 max-w-md mx-auto w-full flex-1 flex flex-col">
                
                {/* ÁREA DA CÂMERA */}
                <div className="mb-6 flex justify-center w-full">
                    {isCamOpen ? (
                        <div className="w-full aspect-square bg-black border-4 border-purple-500 rounded-2xl overflow-hidden relative shadow-[0_0_30px_rgba(168,85,247,0.4)] animate-in zoom-in-95 duration-300">
                            <Scanner
                                onScan={(result) => {
                                    if (result && result[0]) validateTicket(result[0].rawValue);
                                }}
                                onError={(error) => console.log(error)}
                                components={{ finder: false }} 
                                styles={{ container: { width: '100%', height: '100%' } }}
                            />
                            
                            {/* Overlay e Mira */}
                            <div className="absolute inset-0 border-2 border-purple-500/30 pointer-events-none z-10"></div>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-white/50 rounded-xl pointer-events-none z-10 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                                <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-purple-400 -mt-1 -ml-1"/>
                                <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-purple-400 -mt-1 -mr-1"/>
                                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-purple-400 -mb-1 -ml-1"/>
                                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-purple-400 -mb-1 -mr-1"/>
                            </div>
                            
                            <button onClick={() => setIsCamOpen(false)} className="absolute bottom-4 right-4 bg-red-600/80 p-3 rounded-xl text-white z-20 hover:bg-red-500 transition-all backdrop-blur-sm">
                                <CameraOff size={20}/>
                            </button>
                        </div>
                    ) : (
                        <PixelButton 
                            onClick={() => setIsCamOpen(true)} 
                            className="w-full py-10 bg-slate-900/50 border-dashed border-2 border-purple-900/50 text-purple-300 hover:text-white flex flex-col items-center gap-3 group transition-all hover:border-purple-500 hover:bg-purple-900/20 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]"
                        >
                            <Camera size={40} className="group-hover:scale-110 transition-transform"/>
                            <span className="font-press text-xs tracking-widest">ATIVAR CÂMERA MÁGICA</span>
                        </PixelButton>
                    )}
                </div>

                {/* INPUT MANUAL */}
                <PixelCard className="bg-slate-900/80 border-2 border-slate-700 p-6 backdrop-blur-md">
                    <form onSubmit={(e) => { e.preventDefault(); validateTicket(hash); }} className="space-y-4">
                        <div className="relative">
                            <QrCode className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                            <input 
                                type="text" 
                                value={hash}
                                onChange={e => setHash(e.target.value.toUpperCase())}
                                placeholder="CÓDIGO MANUAL"
                                className="w-full bg-black/50 border-2 border-slate-600 rounded-xl py-4 pl-12 pr-4 font-mono text-lg text-white uppercase focus:border-purple-500 focus:shadow-[0_0_15px_rgba(168,85,247,0.3)] outline-none transition-all placeholder:text-slate-700"
                            />
                        </div>
                        <PixelButton type="submit" isLoading={loading} className="w-full h-14 text-white bg-gradient-to-r from-purple-700 to-blue-700 hover:from-purple-600 hover:to-blue-600 border-purple-500 shadow-lg">
                            VALIDAR TICKET
                        </PixelButton>
                    </form>
                </PixelCard>

                {/* RESULTADO DA VALIDAÇÃO */}
                {result && (
                    <PixelCard className={`mt-6 border-l-8 ${result.success ? 'border-l-green-500 border-green-900/30' : 'border-l-red-500 border-red-900/30'} bg-slate-900 animate-in slide-in-from-bottom-4 shadow-2xl`}>
                        <div className="flex items-start gap-4 p-2">
                            {result.success ? (
                                <div className="p-3 bg-green-500/20 rounded-full border border-green-500/50">
                                    <CheckCircle className="text-green-400 w-8 h-8 shrink-0" />
                                </div>
                            ) : (
                                <div className="p-3 bg-red-500/20 rounded-full border border-red-500/50">
                                    <XCircle className="text-red-400 w-8 h-8 shrink-0" />
                                </div>
                            )}
                            
                            <div className="flex-1">
                                <h3 className={`font-vt323 text-3xl leading-none mb-1 ${result.success ? 'text-green-400' : 'text-red-400'}`}>
                                    {result.success ? 'ITEM VALIDADO!' : 'FALHA MÁGICA'}
                                </h3>
                                
                                {result.success ? (
                                    <div className="bg-black/40 rounded-lg p-3 mt-2 border border-white/5 space-y-2">
                                        <div className="flex justify-between items-center border-b border-white/10 pb-2">
                                            <span className="text-[10px] font-mono text-slate-500 uppercase">Aluno</span>
                                            <span className="text-sm font-bold text-white">{result.data.user.nome}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-mono text-slate-500 uppercase">Item</span>
                                            <span className="text-sm font-bold text-yellow-400">{result.data.itemNome}</span>
                                        </div>
                                        <div className="pt-2 text-center">
                                            <span className="text-[10px] px-2 py-1 rounded bg-green-900/30 text-green-400 border border-green-500/30 font-mono">
                                                ENTREGUE AGORA
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm font-mono text-slate-400 mt-2 bg-red-900/10 p-2 rounded border border-red-900/30">
                                        {result.message}
                                    </p>
                                )}
                            </div>
                        </div>
                    </PixelCard>
                )}
            </div>
        </PageTransition>
    );
}