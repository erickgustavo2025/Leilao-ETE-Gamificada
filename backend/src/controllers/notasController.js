const User = require('../models/User');
const Disciplina = require('../models/Disciplina');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');

const notasController = {
    // Listar matérias disponíveis para o aluno (baseado em ano/curso)
    async getAvailableDisciplinas(req, res) {
        try {
            const user = await User.findById(req.user.id);
            if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

            // Lógica de filtro por turma/curso (ex: 3DS -> Ano 3, Curso DS)
            let ano = '1';
            let curso = 'COMUM';

            if (user.turma) {
                const matchAno = user.turma.match(/[1-3]/);
                if (matchAno) ano = matchAno[0];

                if (user.turma.toUpperCase().includes('DS')) curso = 'DS';
                else if (user.turma.toUpperCase().includes('ADM')) curso = 'ADM';
            }

            const disciplinas = await Disciplina.find({
                ano,
                curso: { $in: [curso, 'COMUM'] },
                ativa: true
            }).sort({ nome: 1 });

            // Adicionar info de compras realizadas para o frontend saber o limite
            const disciplinasComInfo = disciplinas.map(d => {
                const dObj = d.toObject();
                const keyN1 = `${d._id}_n1`;
                const keyN2 = `${d._id}_n2`;
                dObj.comprasN1 = user.notas?.comprasPorDisciplina?.get(keyN1) || 0;
                dObj.comprasN2 = user.notas?.comprasPorDisciplina?.get(keyN2) || 0;
                return dObj;
            });

            res.json(disciplinasComInfo);
        } catch (error) {
            console.error("Erro ao buscar disciplinas:", error);
            res.status(500).json({ error: 'Erro ao buscar disciplinas.' });
        }
    },

    async comprarPonto(req, res) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const { disciplinaId, tipo } = req.body; // tipo: 'n1' ou 'n2'
            
            const user = await User.findById(req.user.id).session(session);
            const disciplina = await Disciplina.findById(disciplinaId).session(session);

            if (!disciplina) throw new Error('Disciplina não encontrada.');
            if (!['n1', 'n2'].includes(tipo)) throw new Error('Tipo de nota inválido.');
            
            // Validação de Badge
            if (!user.cargos || !user.cargos.includes('PODE_COMPRAR_NOTAS')) {
                throw new Error('Você não possui a badge PODE_COMPRAR_NOTAS.');
            }

            const preco = tipo === 'n1' ? disciplina.precoN1 : disciplina.precoN2;

            if (user.saldoPc < preco) {
                throw new Error(`Saldo insuficiente. Você precisa de ${preco} PC$.`);
            }

            // Inicializar notas se não existir
            if (!user.notas) {
                user.notas = { n1: [], n2: [], redacoes: [], simulados: [], comprasPorDisciplina: {} };
            }
            if (!user.notas.comprasPorDisciplina) {
                user.notas.comprasPorDisciplina = new Map();
            }

            const compraKey = `${disciplinaId}_${tipo}`;
            const totalComprado = user.notas.comprasPorDisciplina.get(compraKey) || 0;

            if (totalComprado >= 2) {
                throw new Error(`Limite atingido! Você só pode comprar no máximo 2 pontos de ${tipo.toUpperCase()} por matéria.`);
            }

            // Aplicar as mudanças (Segurança garantida pela Session/WriteConflict do MongoDB)
            user.saldoPc -= preco;
            
            // Adicionar +1 no limite da disciplina
            user.notas.comprasPorDisciplina.set(compraKey, totalComprado + 1);

            // Adicionar +1 como "nota" no array principal para histórico caso necessário
            user.notas[tipo].push(1);

            // Atualiza maxPcAchieved indiretamente e outros hooks se aplicável (o saldo diminuiu, não max)
            
            await user.save({ session });

            // Registrar Transação
            await Transaction.create([{
                remetente: user._id,
                destinatario: user._id,
                tipo: 'COMPRA_NOTA',
                valorBruto: preco,
                valorLiquido: preco,
                taxa: 0,
                assetSymbol: disciplina.nome,
                assetType: 'STOCK',
                quantity: 1,
                priceAtTime: preco
            }], { session });

            await session.commitTransaction();

            res.json({ 
                message: `Sucesso! 1 ponto de ${tipo.toUpperCase()} adicionado em ${disciplina.nome}.`, 
                saldo: user.saldoPc,
                comprasRestantes: 2 - (totalComprado + 1)
            });

        } catch (error) {
            await session.abortTransaction();
            // Retornar 400 em logica limpa, se for WriteConflict também bloqueia
            res.status(400).json({ error: error.message });
        } finally {
            session.endSession();
        }
    }
};

module.exports = notasController;
