const Professor = require('../models/Professor');
const Disciplina = require('../models/Disciplina');
const Log = require('../models/Log');
const bcrypt = require('bcryptjs');

module.exports = {
    // 📋 LISTAR PROFESSORES
    async index(req, res) {
        try {
            const professors = await Professor.find()
                .populate('disciplinas.disciplinaId', 'nome')
                .sort({ nome: 1 });
            res.json(professors);
        } catch (error) {
            res.status(500).json({ error: 'Erro ao listar professores.' });
        }
    },

    // ➕ CRIAR PROFESSOR (Com Vínculos)
    async create(req, res) {
        try {
            const { nome, usuario, senha, disciplinas } = req.body;

            // 1. Verifica se usuário já existe
            const userExists = await Professor.findOne({ usuario: usuario.toLowerCase() });
            if (userExists) {
                return res.status(400).json({ message: 'Este nome de usuário já está em uso.' });
            }

            // 2. Criptografa a senha definida pelo Admin
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(senha, salt);

            // 3. Cria o Professor
            const professor = await Professor.create({
                nome: nome.toUpperCase(),
                usuario: usuario.toLowerCase(),
                senha: hashedPassword,
                disciplinas: disciplinas || []
            });

            // 4. Sincroniza o professorId nas Disciplinas oficiais (Se houver vínculo)
            if (disciplinas && disciplinas.length > 0) {
                const discIds = disciplinas.map(d => d.disciplinaId);
                await Disciplina.updateMany(
                    { _id: { $in: discIds } },
                    { $set: { professorId: professor._id, professor: professor.nome } }
                );
            }

            // 5. Log de Auditoria
            await Log.create({
                user: req.user._id,
                action: 'CREATE_PROFESSOR',
                details: `Cadastrou o professor: ${professor.nome} (${professor.usuario})`,
                ip: req.ip
            });

            const profResponse = professor.toObject();
            delete profResponse.senha;

            res.status(201).json({ message: 'Professor cadastrado com sucesso!', professor: profResponse });

        } catch (error) {
            console.error("Erro ao criar professor:", error);
            res.status(500).json({ message: 'Erro ao cadastrar professor.' });
        }
    },

    // 🔄 ATUALIZAR VÍNCULOS
    async update(req, res) {
        try {
            const { id } = req.params;
            const { nome, usuario, senha, disciplinas, ativo } = req.body;

            const professor = await Professor.findById(id);
            if (!professor) return res.status(404).json({ message: 'Professor não encontrado.' });

            const updateData = {};
            if (nome) updateData.nome = nome.toUpperCase();
            if (usuario) updateData.usuario = usuario.toLowerCase();
            if (ativo !== undefined) updateData.ativo = ativo;
            if (disciplinas) updateData.disciplinas = disciplinas;

            if (senha) {
                const salt = await bcrypt.genSalt(10);
                updateData.senha = await bcrypt.hash(senha, salt);
            }

            const updatedProfessor = await Professor.findByIdAndUpdate(id, updateData, { new: true });

            // Sincroniza vínculos nas disciplinas caso tenham mudado
            if (disciplinas) {
                // Remove o ID do professor de todas as disciplinas antigas dele primeiro (opcional, mas seguro)
                await Disciplina.updateMany({ professorId: professor._id }, { $unset: { professorId: "" } });
                
                // Adiciona nas novas
                const discIds = disciplinas.map(d => d.disciplinaId);
                await Disciplina.updateMany(
                    { _id: { $in: discIds } },
                    { $set: { professorId: updatedProfessor._id, professor: updatedProfessor.nome } }
                );
            }

            await Log.create({
                user: req.user._id,
                target: professor._id,
                action: 'UPDATE_PROFESSOR',
                details: `Atualizou dados/vínculos do professor: ${professor.nome}`,
                ip: req.ip
            });

            res.json({ message: 'Dados atualizados!', professor: updatedProfessor });

        } catch (error) {
            res.status(500).json({ message: 'Erro ao atualizar professor.' });
        }
    },

    // 🗑️ DELETAR 
    async delete(req, res) {
        try {
            const { id } = req.params;
            const professor = await Professor.findById(id);
            if (!professor) return res.status(404).json({ message: 'Professor não encontrado.' });

            // Desvincula as disciplinas antes de apagar
            await Disciplina.updateMany({ professorId: professor._id }, { $unset: { professorId: "" } });
            
            await Professor.findByIdAndDelete(id);

            await Log.create({
                user: req.user._id,
                action: 'DELETE_PROFESSOR',
                details: `Removeu o professor: ${professor.nome}`,
                ip: req.ip
            });

            res.json({ message: 'Professor removido com sucesso.' });
        } catch (error) {
            res.status(500).json({ message: 'Erro ao remover professor.' });
        }
    }
};
