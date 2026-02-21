// backend/src/scripts/createIndexes.js
// Execute com: node src/scripts/createIndexes.js
// Ou via npm: npm run indexes

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

async function createIndexes() {
    try {
        console.log('🔌 Conectando ao banco...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Conectado!\n');

        const db = mongoose.connection.db;

        // ════════════════════════════════════════════
        // 👤 COLLECTION: alunos (Users)
        // ════════════════════════════════════════════
        const alunos = db.collection('alunos');

        // Login — busca por matrícula em todo login
        await alunos.createIndex({ matricula: 1 }, { unique: true, name: 'idx_matricula_unique' });
        console.log('✅ alunos.matricula (unique)');

        // Painel do monitor e getStudentsByClass — busca frequente por turma
        await alunos.createIndex({ turma: 1 }, { name: 'idx_turma' });
        console.log('✅ alunos.turma');

        // Ranking — ordenação por maxPcAchieved
        await alunos.createIndex({ maxPcAchieved: -1 }, { name: 'idx_maxPcAchieved_desc' });
        console.log('✅ alunos.maxPcAchieved (desc)');

        // Filtros de role (getStudents, getClasses etc.)
        await alunos.createIndex({ role: 1 }, { name: 'idx_role' });
        console.log('✅ alunos.role');

        // ════════════════════════════════════════════
        // 🎫 COLLECTION: tickets
        // ════════════════════════════════════════════
        const tickets = db.collection('tickets');

        // Scanner — busca pelo hash toda vez que um ticket é escaneado
        await tickets.createIndex({ hash: 1 }, { unique: true, name: 'idx_hash_unique' });
        console.log('✅ tickets.hash (unique)');

        // Listagem de tickets do usuário
        await tickets.createIndex({ user: 1, createdAt: -1 }, { name: 'idx_user_date' });
        console.log('✅ tickets.user + createdAt');

        // ════════════════════════════════════════════
        // 🏺 COLLECTION: items (Leilões)
        // ════════════════════════════════════════════
        const items = db.collection('items');

        // CRON roda a cada 1 minuto buscando leilões ativos expirados — índice crítico
        await items.createIndex({ status: 1, dataFim: 1 }, { name: 'idx_status_datafim' });
        console.log('✅ items.status + dataFim (CRON)');

        // ════════════════════════════════════════════
        // 📋 COLLECTION: logs
        // ════════════════════════════════════════════
        const logs = db.collection('logs');

        // Painel admin — logs filtrados por action e ordenados por data
        await logs.createIndex({ action: 1, createdAt: -1 }, { name: 'idx_action_date' });
        console.log('✅ logs.action + createdAt');

        // Logs por usuário (monitor history)
        await logs.createIndex({ user: 1, createdAt: -1 }, { name: 'idx_user_date' });
        console.log('✅ logs.user + createdAt');

        // ════════════════════════════════════════════
        // 🛒 COLLECTION: storeitems
        // ════════════════════════════════════════════
        const storeitems = db.collection('storeitems');

        // Listagem da loja filtrando por ativo e estoque
        await storeitems.createIndex({ ativo: 1, estoque: 1 }, { name: 'idx_ativo_estoque' });
        console.log('✅ storeitems.ativo + estoque');

        // ════════════════════════════════════════════
        // 🏠 COLLECTION: classrooms
        // ════════════════════════════════════════════
        const classrooms = db.collection('classrooms');

        // Busca de sala por série (usado em compras, gifts, roleta, etc.)
        await classrooms.createIndex({ serie: 1 }, { name: 'idx_serie' });
        console.log('✅ classrooms.serie');

        // ════════════════════════════════════════════
        // 🔔 COLLECTION: notifications
        // ════════════════════════════════════════════
        const notifications = db.collection('notifications');

        await notifications.createIndex({ user: 1, createdAt: -1 }, { name: 'idx_user_date' });
        console.log('✅ notifications.user + createdAt');

        // ════════════════════════════════════════════
        // 📦 COLLECTION: marketlistings
        // ════════════════════════════════════════════
        const marketlistings = db.collection('marketlistings');

        await marketlistings.createIndex({ status: 1, createdAt: -1 }, { name: 'idx_status_date' });
        console.log('✅ marketlistings.status + createdAt');

        await marketlistings.createIndex({ seller: 1, status: 1 }, { name: 'idx_seller_status' });
        console.log('✅ marketlistings.seller + status');

        console.log('\n🎉 Todos os índices criados com sucesso!');
        console.log('💡 Dica: MongoDB ignora silenciosamente se o índice já existir.');

    } catch (error) {
        console.error('❌ Erro ao criar índices:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Conexão encerrada.');
        process.exit(0);
    }
}

createIndexes();
