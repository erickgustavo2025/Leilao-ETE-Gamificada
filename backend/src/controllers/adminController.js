const User = require('../models/User');
const Log = require('../models/Log');
const SystemConfig = require('../models/SystemConfig');
const path = require('path');
const fs = require('fs');

// Ações que o professor/gestor precisa monitorar
const BUSINESS_ACTIONS = [
    'LOGIN', 'BID', 'BUY_ITEM', 'POINTS_CHANGE', 
    'ADMIN_ACTION', 'ACTIVATE_ACCOUNT', 'AUCTION_CLOSED'
];

module.exports = {
    // 👥 LISTAR ALUNOS (Para o Professor ver a turma)
    async getStudents(req, res) {
        try {
            // Retorna lista ordenada por nome, sem mostrar dados sensíveis de sistema
            const students = await User.find({ role: 'student' })
                .select('nome matricula turma saldoPc xp')
                .sort({ nome: 1 });
            
            return res.json(students);
        } catch (error) {
            return res.status(500).json({ error: 'Erro ao buscar alunos' });
        }
    },

   async updateBalance(req, res) {
        try {
            const { id } = req.params; // ID do aluno
            const { amount, reason } = req.body; // Valor e Motivo
            const baseValue = Number(amount);

            const user = await User.findById(id);
            if (!user) return res.status(404).json({ message: 'Aluno não encontrado' });

            let finalValue = baseValue;
            let bonusTag = '';

            // Lógica de Multiplicador (Apenas para ADIÇÃO de pontos)
            if (baseValue > 0) {
                let multiplier = 1;

                // 1. Verifica Triplicador
                const hasTriple = user.inventory.find(i => 
                    i.name && (i.name.includes("Triplicador de PC$") || i.name.includes("Triplicador")) && 
                    (i.category === 'RANK_SKILL' || i.category === 'PERMANENTE')
                );

                // 2. Verifica Dobrador
                const hasDouble = !hasTriple && user.inventory.find(i => 
                    i.name && (i.name.includes("Dobrador de PC$") || i.name.includes("Dobrador")) && 
                    (i.category === 'RANK_SKILL' || i.category === 'PERMANENTE')
                );

                if (hasTriple) multiplier = 3;
                else if (hasDouble) multiplier = 2;

                // 🔥 A BÊNÇÃO DE MERLIN (SOMA +0.5 NO MULTIPLICADOR) 🔥
                if (user.cargos && user.cargos.includes('bencao_de_merlin')) {
                    multiplier += 0.5; // 1 vira 1.5 | 2 vira 2.5 | 3 vira 3.5
                }

                if (multiplier > 1) {
                    finalValue = Math.floor(baseValue * multiplier);
                    bonusTag = ` [Bônus ${multiplier}x 🔥]`;
                }
            }

            // Atualiza saldo
            user.saldoPc += finalValue;
            
            // Se for ganho positivo, atualiza o Rank histórico também
            if (finalValue > 0) {
                user.maxPcAchieved = (user.maxPcAchieved || 0) + finalValue;
            }

            await user.save();

            // Log de Auditoria
            await Log.create({
                user: req.user._id, // Professor que deu o ponto
                target: user._id,   // Aluno que recebeu
                action: baseValue > 0 ? 'ADMIN_GIVE_POINTS' : 'ADMIN_REMOVE_POINTS',
                details: `${baseValue > 0 ? 'Deu' : 'Removeu'} ${Math.abs(finalValue)} PC$${bonusTag} (Base: ${Math.abs(baseValue)}). Motivo: ${reason}`,
                ip: req.ip
            });

            res.json({ message: `Saldo atualizado! ${bonusTag}`, novoSaldo: user.saldoPc });

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao atualizar saldo', error: error.message });
        }
    },
    
    // 🔄 RESETAR ALUNO (Para quando o aluno esquece a senha ou cadastra errado)
    async resetStudent(req, res) {
        try {
            const { id } = req.params;
            
            // "Apaga" o aluno mantendo o histórico básico (Nome/Turma)
            // Mas zera o acesso para ele poder cadastrar de novo (Primeiro Acesso)
            await User.findByIdAndUpdate(id, {
                email: null,
                senha: null,
                isFirstAccess: true, // Libera o cadastro novamente
                resetPasswordToken: null,
                resetPasswordExpires: null
            });

            // Log de auditoria
            await Log.create({
                user: req.user._id,
                action: 'ADMIN_ACTION',
                details: `Resetou o cadastro do aluno ID: ${id}`,
                ip: req.ip
            });

            return res.json({ message: 'Cadastro do aluno resetado com sucesso!' });
        } catch (error) {
            return res.status(500).json({ error: 'Erro ao resetar aluno' });
        }
    },

    async getBusinessLogs(req, res) {
        try {
            // Busca os últimos 200 logs, do mais novo para o mais velho
            const logs = await Log.find()
                .populate('user', 'nome role turma')   // <--- O PULO DO GATO: Traz o nome de quem fez
                .populate('target', 'nome turma')      // <--- Traz o nome do alvo (quem recebeu PIX)
                .sort({ createdAt: -1 })
                .limit(200);

            return res.json(logs);
        } catch (error) {
            console.error('Erro ao buscar logs:', error);
            return res.status(500).json({ error: 'Erro interno ao buscar logs' });
        }
    },

    // GET: Buscar Configurações
   async getConfig(req, res) {
        try {
            // Busca a config 'general'. Se não existir, cria uma padrão.
            let config = await SystemConfig.findOne({ key: 'general' });
            
            if (!config) {
                config = await SystemConfig.create({
                    key: 'general',
                    siteName: 'ETE GAMIFICADA',
                    logoUrl: '/assets/etegamificada.png',
                    maintenanceMode: false,
                    vipCode: 'VIP-ETE-2026',
                    landingMessage: 'Bem-vindo ao sistema de gamificação escolar.'
                });
            }
            res.json(config);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erro ao buscar configurações.' });
        }
    },

    // ⚙️ ATUALIZAR CONFIGURAÇÕES
   async updateConfig(req, res) {
        try {
            // Adicione houseCupVisible e becoDiagonalOpen na leitura
            const { 
                siteName, vipCode, maintenanceMode, landingMessage,
                houseCupVisible, becoDiagonalOpen // <--- ADICIONE ISTO
            } = req.body;
            
            let config = await SystemConfig.findOne({ key: 'general' });
            if (!config) {
                config = new SystemConfig({ key: 'general' });
            }

            if (siteName) config.siteName = siteName;
            if (vipCode) config.vipCode = vipCode;
            if (landingMessage) config.landingMessage = landingMessage;
            
            // Atualiza Manutenção
            if (maintenanceMode !== undefined) {
                config.maintenanceMode = String(maintenanceMode) === 'true';
            }

            // 👇👇👇 ADICIONE ESTE BLOCO AQUI 👇👇👇
            // Atualiza Beco e Ranking
            if (houseCupVisible !== undefined) {
                config.houseCupVisible = String(houseCupVisible) === 'true';
            }
            if (becoDiagonalOpen !== undefined) {
                config.becoDiagonalOpen = String(becoDiagonalOpen) === 'true';
            }
            // 👆👆👆 FIM DO BLOCO 👆👆👆

            if (req.file) {
                config.logoUrl = `/uploads/${req.file.filename}`;
            }

            await config.save();

            res.json({ message: 'Configurações atualizadas!', config });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erro ao atualizar configurações.' });
        }
    },
    
    // 🖼️ LISTAR IMAGENS DA PASTA UPLOADS
    async getImages(req, res) {
        try {
            const directoryPath = path.join(__dirname, '../../public/uploads');
            
            // Cria a pasta se não existir
            if (!fs.existsSync(directoryPath)) {
                fs.mkdirSync(directoryPath, { recursive: true });
            }

            fs.readdir(directoryPath, (err, files) => {
                if (err) {
                    return res.status(500).json({ message: "Erro ao ler diretório de imagens." });
                }

                // Filtra apenas imagens e cria array com dados
                const fileInfos = files
                    .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
                    .map(file => {
                        const stats = fs.statSync(path.join(directoryPath, file));
                        return {
                            name: file,
                            url: `/uploads/${file}`,
                            size: (stats.size / 1024).toFixed(2) + ' KB',
                            createdAt: stats.birthtime
                        };
                    })
                    // Ordena das mais novas para as mais antigas
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

                res.json(fileInfos);
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erro interno ao listar imagens." });
        }
    },
    // 🗑️ DELETAR IMAGEM
    async deleteImage(req, res) {
        try {
            const { filename } = req.params;
            const filePath = path.join(__dirname, '../../public/uploads', filename);

            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                
                // LOG DE SEGURANÇA
                // (Opcional: Adicione um Log.create aqui se quiser registrar quem apagou)
                
                res.json({ message: "Imagem deletada com sucesso!" });
            } else {
                res.status(404).json({ message: "Imagem não encontrada." });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erro ao deletar imagem." });
        }
    },
    
    async getAllUsers(req, res) {
        try {
            console.log("📥 [DEV] Buscando todos os usuários...");
            
            const users = await User.find()
                .select('nome matricula turma role saldoPc isFirstAccess') 
                .sort({ nome: 1 });

            console.log(`✅ [DEV] Encontrados ${users.length} usuários.`);
            return res.json(users);
            
        } catch (error) {
            console.error("❌ Erro ao buscar usuários:", error);
            return res.status(500).json({ message: 'Erro ao buscar lista de usuários' });
        }
    }, 

    // ⬆️ UPLOAD RÁPIDO DE IMAGEM
    async uploadImage(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ message: "Nenhum arquivo enviado." });
            }
            // Retorna o caminho para o front já usar
            res.json({ 
                message: "Upload realizado!", 
                url: `/uploads/${req.file.filename}`,
                name: req.file.filename
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erro no upload." });
        }
    },
    
};