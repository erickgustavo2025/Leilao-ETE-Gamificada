// frontend/src/pages/admin/AdminScanner.tsx
import { useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { QrCode, CheckCircle, XCircle, Camera, CameraOff } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { PixelCard } from '../../components/ui/PixelCard';
import { PixelButton } from '../../components/ui/PixelButton';
import { api } from '../../api/axios-config';
import { useGameSound } from '../../hooks/useGameSound';
import { PageTransition } from '../../components/layout/PageTransition';

interface ValidationResult {
    success: boolean;
    data?: {
        user: { nome: string };
        itemNome: string;
    };
    message?: string;
}

export function AdminScanner() {
    const { playSuccess, playError } = useGameSound();
    const [hash, setHash] = useState('');
    const [result, setResult] = useState<ValidationResult | null>(null);
    const [isCamOpen, setIsCamOpen] = useState(false);

    // ✅ Mutation para validar ticket
    const validateMutation = useMutation({
        mutationFn: async (code: string) => {
            const res = await api.post('/tickets/validate', { hash: code });
            return res.data;
        },
        onSuccess: (data) => {
            setResult({ success: true, data: data.ticket });
            playSuccess();
            toast.success("TICKET VÁLIDO!");
            setHash('');
            setIsCamOpen(false);
        },
        onError: (error: any) => {
            playError();
            setResult({ 
                success: false, 
                message: error.response?.data?.message || "Erro." 
            });
            toast.error("ERRO NA VALIDAÇÃO");
            setIsCamOpen(false);
        }
    });

    const handleValidate = (code: string) => {
        if (!code || code.length < 6) return;
        validateMutation.mutate(code);
    };

    return (
        <AdminLayout>
            <PageTransition>
                <div className="max-w-md mx-auto mt-6">
                    <div className="text-center mb-6 flex flex-col items-center">
                        <div className="p-4 bg-yellow-500/10 rounded-full border-2 border-yellow-500 mb-2">
                            <QrCode size={40} className="text-yellow-500" />
                        </div>
                        <h1 className="font-vt323 text-4xl text-white">VALIDADOR</h1>
                        <p className="font-mono text-xs text-slate-500">Manual ou via Câmera</p>
                    </div>

                    {/* ÁREA DA CÂMERA */}
                    <div className="mb-6 flex justify-center">
                        {isCamOpen ? (
                            <div className="w-full aspect-square max-w-[300px] bg-black border-4 border-yellow-500 rounded-lg overflow-hidden relative shadow-[0_0_20px_rgba(234,179,8,0.3)]">
                                <Scanner
                                    onScan={(result) => {
                                        if (result && result[0]) {
                                            handleValidate(result[0].rawValue);
                                        }
                                    }}
                                    onError={(error) => console.log(error)}
                                    components={{ finder: false }}
                                    styles={{ container: { width: '100%', height: '100%' } }}
                                />
                                
                                <div className="absolute inset-0 border-2 border-red-500/50 animate-pulse pointer-events-none z-10"></div>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-white/30 rounded-lg pointer-events-none z-10"></div>
                                
                                <button onClick={() => setIsCamOpen(false)} className="absolute bottom-2 right-2 bg-red-600 p-2 rounded text-white z-20 hover:bg-red-500 transition-colors">
                                    <CameraOff size={20}/>
                                </button>
                            </div>
                        ) : (
                            <PixelButton onClick={() => setIsCamOpen(true)} className="w-full py-8 bg-slate-800 border-dashed border-2 border-slate-600 text-slate-400 hover:text-white flex flex-col items-center gap-2 group transition-all hover:border-yellow-500 hover:bg-slate-700">
                                <Camera size={32} className="group-hover:scale-110 transition-transform"/>
                                <span className="font-press text-xs">ABRIR CÂMERA</span>
                            </PixelButton>
                        )}
                    </div>

                    <PixelCard className="bg-slate-900 border-2 border-slate-600 p-6">
                        <form onSubmit={(e) => { e.preventDefault(); handleValidate(hash); }} className="space-y-4">
                            <input 
                                type="text" 
                                value={hash}
                                onChange={e => setHash(e.target.value.toUpperCase())}
                                placeholder="DIGITE O CÓDIGO (EX: A7X9B2)"
                                className="w-full bg-black border-2 border-slate-500 p-4 text-center font-mono text-xl text-white uppercase focus:border-yellow-500 outline-none transition-colors placeholder:text-slate-700"
                            />
                            <PixelButton 
                                type="submit" 
                                isLoading={validateMutation.isPending}
                                className="w-full h-12 text-black bg-yellow-500 hover:bg-yellow-400 border-yellow-700"
                            >
                                VALIDAR MANUALMENTE
                            </PixelButton>
                        </form>
                    </PixelCard>

                    {/* RESULTADO */}
                    {result && (
                        <PixelCard className={`mt-6 border-l-8 ${result.success ? 'border-l-green-500' : 'border-l-red-500'} bg-slate-900 animate-in slide-in-from-bottom-4 shadow-xl`}>
                            <div className="flex items-start gap-4">
                                {result.success ? <CheckCircle className="text-green-500 w-12 h-12 shrink-0" /> : <XCircle className="text-red-500 w-12 h-12 shrink-0" />}
                                <div>
                                    <h3 className={`font-vt323 text-3xl ${result.success ? 'text-green-400' : 'text-red-400'}`}>
                                        {result.success ? 'APROVADO' : 'RECUSADO'}
                                    </h3>
                                    {result.success ? (
                                        <div className="text-sm font-mono text-slate-300 mt-2 space-y-1">
                                            <p>ALUNO: <span className="text-white font-bold">{result.data?.user.nome}</span></p>
                                            <p>ITEM: <span className="text-yellow-400 font-bold">{result.data?.itemNome}</span></p>
                                            <p className="text-[10px] text-slate-500 mt-2">Ticket queimado com sucesso.</p>
                                        </div>
                                    ) : (
                                        <p className="text-sm font-mono text-slate-400 mt-2">{result.message}</p>
                                    )}
                                </div>
                            </div>
                        </PixelCard>
                    )}
                </div>
            </PageTransition>
        </AdminLayout>
    );
}