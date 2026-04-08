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

    // Comprar ponto em uma disciplina
    async comprarPonto(req, res) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const { disciplinaId, tipo } = req.body; // tipo: 'n1' ou 'n2'
            
            // 1. Validações Iniciais (Leitura fora do update para mensagens de erro amigáveis)
            const user = await User.findById(req.user.id).session(session);
            const disciplina = await Disciplina.findById(disciplinaId).session(session);

            if (!disciplina) throw new Error('Disciplina não encontrada.');
            if (!['n1', 'n2'].includes(tipo)) throw new Error('Tipo de nota inválido.');
            
            // Validação de Badge
            if (!user.cargos || !user.cargos.includes('PODE_COMPRAR_NOTAS')) {
                throw new Error('Você não possui a badge PODE_COMPRAR_NOTAS.');
            }

            // 2. Validação de Limite (2 pontos por tipo por disciplina)
            const compraKey = `${disciplinaId}_${tipo}`;
            const totalComprado = user.notas?.comprasPorDisciplina?.get(compraKey) || 0;
            if (totalComprado >= 2) {
                throw new Error(`Limite atingido! Você só pode comprar no máximo 2 pontos de ${tipo.toUpperCase()} por matéria.`);
            }

            const preco = tipo === 'n1' ? disciplina.precoN1 : disciplina.precoN2;

            // 3. ✅ ATÔMICO: Verificação de saldo e débito em uma única operação para evitar Race Condition
            // Usamos $inc para saldo e para o contador de compras, e $push para o array de notas
            const updateResult = await User.updateOne(
                { 
                    _id: req.user.id, 
                    saldoPc: { $gte: preco },
                    // Re-verificamos o limite no critério de busca para segurança total contra race conditions
                    [`notas.comprasPorDisciplina.${compraKey}`]: { $lt: 2 } 
                },
                { 
                    $inc: { 
                        saldoPc: -preco,
                        [`notas.comprasPorDisciplina.${compraKey}`]: 1 
                    },
                    $push: { [`notas.${tipo}`]: 1 }
                },
                { session }
            );

            // Se o matchedCount for 0, ou o saldo era insuficiente ou o limite foi atingido entre a leitura e o update
            if (updateResult.matchedCount === 0) {
                // Verificamos o motivo real para dar o erro correto
                const userCheck = await User.findById(req.user.id).session(session);
                if (userCheck.saldoPc < preco) throw new Error(`Saldo insuficiente. Você precisa de ${preco} PC$.`);
                if ((userCheck.notas?.comprasPorDisciplina?.get(compraKey) || 0) >= 2) {
                    throw new Error(`Limite atingido! Alguém (ou você em outra aba) já comprou os pontos permitidos.`);
                }
                throw new Error('Não foi possível processar a compra. Tente novamente.');
            }

            // 4. Registrar Transação
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
            
            // Buscamos o usuário atualizado para retornar o saldo correto
            const updatedUser = await User.findById(req.user.id);

            res.json({ 
                message: `Sucesso! 1 ponto de ${tipo.toUpperCase()} adicionado em ${disciplina.nome}.`, 
                saldo: updatedUser.saldoPc,
                comprasRestantes: 2 - (updatedUser.notas?.comprasPorDisciplina?.get(compraKey) || 0)
            });

        } catch (error) {
            await session.abortTransaction();
            res.status(400).json({ error: error.message });
        } finally {
            session.endSession();
        }
    }
};

module.exports = notasController;
