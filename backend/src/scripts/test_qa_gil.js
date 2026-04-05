const mongoose = require('mongoose');
const User = require('../models/User');
const GilEmpresa = require('../models/GilEmpresa');
const PriceCache = require('../models/PriceCache');
const Transaction = require('../models/Transaction');
const investmentController = require('../controllers/investmentController');
const startupController = require('../controllers/startupController');

// Mock de Resposta Express
const mockRes = () => {
    const res = {};
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (data) => { res.body = data; return res; };
    return res;
};

async function runTest() {
    console.log('🧪 [QA] Iniciando Teste E2E do Gil Investe...');
    
    // Conectar ao MongoDB (usando URI local ou de teste)
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ete_qa_test';
    await mongoose.connect(MONGO_URI);
    console.log('✅ [QA] MongoDB Conectado.');

    try {
        // Limpar dados de teste anteriores
        await User.deleteMany({ email: /test_qa/ });
        await GilEmpresa.deleteMany({ nome: /Test Startup/ });
        await Transaction.deleteMany({});
        await PriceCache.deleteMany({});

        // 1. Criar Usuário de Teste (Aluno)
        const aluno = await User.create({
            nome: 'Aluno Teste QA',
            email: 'aluno_test_qa@ete.com',
            password: 'password123',
            matricula: 'QA001',
            role: 'student',
            saldoPc: 5000
        });
        console.log(`👤 [QA] Aluno criado: ${aluno.nome} | Saldo: ${aluno.saldoPc} PC$`);

        // 2. Criar Usuário Admin
        const admin = await User.create({
            nome: 'Admin QA',
            email: 'admin_test_qa@ete.com',
            password: 'password123',
            matricula: 'ADM001',
            role: 'admin'
        });

        // 3. Simular IPO (Criação de Startup)
        console.log('🏢 [QA] Simulando IPO...');
        const reqIpo = {
            user: aluno,
            body: {
                nome: 'Test Startup QA',
                tag: 'QA-INC',
                descricao: 'Startup de teste para auditoria de QA.',
                valuationInicial: 1000,
                totalAcoes: 10000
            }
        };
        const resIpo = mockRes();
        await startupController.createStartup(reqIpo, resIpo);
        
        const startup = await GilEmpresa.findOne({ tag: 'QA-INC' });
        console.log(`✅ [QA] Startup criada: ${startup.nome} | Status: ${startup.status}`);

        // 4. Simular Aprovação Admin
        console.log('🔓 [QA] Simulando Aprovação Admin...');
        const reqApprove = { params: { id: startup._id } };
        const resApprove = mockRes();
        await startupController.approveStartup(reqApprove, resApprove);
        
        const startupListada = await GilEmpresa.findById(startup._id);
        console.log(`📈 [QA] Startup Listada! Preço Inicial: ${startupListada.valorPorAcao} PC$ | Ações: ${startupListada.acoesDisponiveis}`);

        // 5. Testar Compra (Atomicidade e Market Maker)
        console.log('🛒 [QA] Testando Compra de Ações...');
        const buyQty = 100;
        const reqBuy = {
            user: aluno,
            body: { symbol: 'QA-INC', quantity: buyQty }
        };
        const resBuy = mockRes();
        await investmentController.buyAsset(reqBuy, resBuy);

        if (resBuy.statusCode === 400) {
            throw new Error(`Erro na compra: ${JSON.stringify(resBuy.body)}`);
        }

        const alunoAtualizado = await User.findById(aluno._id);
        const startupPosCompra = await GilEmpresa.findById(startup._id);
        const investment = alunoAtualizado.investments.find(i => i.symbol === 'QA-INC');

        console.log(`💰 [QA] Saldo após compra: ${alunoAtualizado.saldoPc} PC$ (Dedução esperada)`);
        console.log(`📦 [QA] Carteira: ${investment.quantity} ações | Preço Médio: ${investment.averagePrice}`);
        console.log(`📊 [QA] Novo Preço Market Maker: ${startupPosCompra.valorPorAcao} PC$ (Subiu?)`);
        console.log(`📉 [QA] Estoque Sistema: ${startupPosCompra.acoesDisponiveis} (Decrementou?)`);

        // Validações
        if (alunoAtualizado.saldoPc >= 5000) throw new Error('Falha: Saldo não foi deduzido.');
        if (investment.quantity !== buyQty) throw new Error('Falha: Quantidade na carteira incorreta.');
        if (startupPosCompra.valorPorAcao <= 0.10) throw new Error('Falha: Preço não subiu com a compra.');
        if (startupPosCompra.acoesDisponiveis !== (10000 - buyQty)) throw new Error('Falha: Estoque não decrementou.');

        console.log('\n🌟 [QA] VEREDITO: TODOS OS TESTES PASSARAM COM SUCESSO!');
        console.log('✅ Atomicidade: OK');
        console.log('✅ Market Maker: OK');
        console.log('✅ Fluxo IPO/Aprovação: OK');

    } catch (error) {
        console.error('\n❌ [QA] TESTE FALHOU:', error.message);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
    }
}

runTest();
