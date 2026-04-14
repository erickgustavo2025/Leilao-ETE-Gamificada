import React, { useState } from 'react';
import { X } from 'lucide-react';
import { PixelCard } from '../../../components/ui/PixelCard';
import { PixelButton } from '../../../components/ui/PixelButton';
import { User } from '../types';

interface EditUserModalProps {
    user: User;
    classes: string[];
    onClose: () => void;
    onSave: (id: string, data: { nome: string; matricula: string; turma: string }) => void;
    isLoading: boolean;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({ user, classes, onClose, onSave, isLoading }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <PixelCard className="w-full max-w-md bg-slate-900 border-2 border-blue-500">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="font-vt323 text-2xl text-white">EDITAR PERFIL</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={22} /></button>
                </div>
                <form onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    onSave(user._id, {
                        nome: formData.get('nome') as string,
                        matricula: formData.get('matricula') as string,
                        turma: formData.get('turma') as string,
                    });
                }} className="space-y-4">
                    <div className="space-y-1">
                        <label className="font-press text-[8px] text-slate-500 uppercase">Nome do Aluno</label>
                        <input name="nome" defaultValue={user.nome} required className="w-full bg-black border border-slate-700 p-3 text-white font-vt323 text-xl outline-none focus:border-blue-500/50" />
                    </div>
                    <div className="space-y-1">
                        <label className="font-press text-[8px] text-slate-500 uppercase">Matrícula</label>
                        <input name="matricula" defaultValue={user.matricula} required className="w-full bg-black border border-slate-700 p-3 text-white font-vt323 text-xl outline-none focus:border-blue-500/50" />
                    </div>
                    <div className="space-y-1">
                        <label className="font-press text-[8px] text-slate-500 uppercase">Turma</label>
                        <select name="turma" defaultValue={user.turma} required className="w-full bg-black border border-slate-700 p-3 text-white font-vt323 text-xl outline-none focus:border-blue-500/50">
                            {classes.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <PixelButton type="submit" className="w-full bg-blue-600" isLoading={isLoading}>SALVAR</PixelButton>
                </form>
            </PixelCard>
        </div>
    );
}
