const cron = require('node-cron');
const axios = require('axios');

// 👇 FIX DEFINITIVO (Puxa a classe em default e depois instancia)
const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();

const Item = require('../models/Item');
const User = require('../models/User');
const PriceCache = require('../models/PriceCache');
const GilEmpresa = require('../models/GilEmpresa');
const Transaction = require('../models/Transaction');
const AIInteraction = require('../models/AIInteraction');
const auctionController = require('../controllers/auctionController');

const STOCKS = ['PETR4', 'ITUB4', 'VALE3', 'MGLU3', 'BBAS3', 'BBDC4', 'ITSA4', 'ABEV3', 'WEGE3', 'PRIO3', 'GGBR4', 'CSNA3', 'GOAU4', 'SUZB3', 'ENEV3', 'EQTL3', 'FLRY3', 'HAPV3', 'IRBR3', 'JBSS3', 'KLBN11', 'LREN3', 'LWSA3', 'MDIA3', 'MRFG3', 'NTCO3', 'PCAR3', 'PETR3', 'RADL3', 'RAIL3', 'RDOR3', 'RENT3', 'SANB11', 'SBSP3', 'SLCE3', 'SMTO3', 'SOMA3', 'TAEE11', 'TOTS3', 'UGPA3', 'VIVT3', 'YDUQ3'];
const CRYPTOS = ['BTC', 'ETH', 'ADA', 'SOL', 'XRP', 'DOGE', 'LTC', 'BCH', 'DOT', 'LINK', 'UNI', 'AVAX', 'MATIC', 'TRX', 'ETC', 'XLM', 'VET', 'FIL', 'ICP', 'EOS', 'AAVE', 'GRT', 'XTZ', 'ATOM', 'ALGO', 'EGLD', 'SAND', 'MANA', 'AXS', 'THETA', 'FTM', 'KSM', 'NEAR', 'CHZ', 'ENJ', 'ZEC', 'DASH', 'NEO', 'QTUM', 'OMG', 'BAT', 'COMP', 'SNX', 'MKR', 'DAI', 'USDC', 'USDT'];

const distributeDividends = async () => {
    try {
        console.log('💰 [CRON-DIVIDENDOS] Iniciando distribuição mensal...');
        const empresas = await GilEmpresa.find({ status: 'LISTADA' });
        if (empresas.length === 0) return;

        const systemUser = await User.findOne({ role: 'admin' });
        const adminId = systemUser ? systemUser._id : null;

        for (const empresa of empresas) {
            const dividendPerShare = (empresa.performanceAcademica / 10) * 0.05;
            if (dividendPerShare <= 0) continue;

            const acionistas = await User.find({
                'investments.symbol': empresa.tag,
                'investments.quantity': { $gt: 0 }
            });

            for (const acionista of acionistas) {
                const investment = acionista.investments.find(inv => inv.symbol === empresa.tag);
                const totalDividend = Number((investment.quantity * dividendPerShare).toFixed(2));
                if (totalDividend <= 0) continue;

                await User.updateOne({ _id: acionista._id }, { $inc: { saldoPc: totalDividend } });
                await Transaction.create({
                    remetente: adminId || acionista._id,
                    destinatario: acionista._id,
                    valorBruto: totalDividend,
                    taxa: 0,
                    valorLiquido: totalDividend,
                    tipo: 'DIVIDENDO',
                    assetSymbol: empresa.tag,
                    assetType: 'STARTUP',
                    quantity: investment.quantity,
                    priceAtTime: dividendPerShare
                });
            }
        }
        console.log('✅ [CRON-DIVIDENDOS] Distribuição concluída.');
    } catch (error) {
        console.error('❌ [CRON-DIVIDENDOS] Erro crítico:', error);
    }
};

const updatePriceCache = async () => {
    try {
        console.log('📈 [CRON-GIL] Iniciando atualização de preços (APIs Gratuitas)...');

        // 1. ATUALIZAR AÇÕES (Yahoo Finance)
        const stockSymbols = STOCKS.map(s => `${s}.SA`);
        try {
            const results = await yahooFinance.quote(stockSymbols);
            for (const quote of results) {
                const symbol = quote.symbol.replace('.SA', '');
                await PriceCache.findOneAndUpdate(
                    { symbol },
                    {
                        symbol,
                        shortName: symbol,
                        longName: quote.longName || symbol,
                        currency: 'BRL',
                        assetType: 'STOCK', // 👇 FIX 2: Mantendo o assetType correto para o React!
                        regularMarketPrice: quote.regularMarketPrice,
                        regularMarketChangePercent: quote.regularMarketChangePercent,
                        regularMarketTime: new Date(),
                        logourl: `https://icons.brapi.dev/logos/${symbol}.png`, // 👇 FIX 3: Logos blindadas!
                        updatedAt: new Date()
                    },
                    { upsert: true }
                );
            }
            console.log(`✅ [CRON-GIL] ${results.length} Ações atualizadas via Yahoo Finance.`);
        } catch (err) {
            console.error('❌ [CRON-GIL] Erro no Yahoo Finance:', err.message);
        }

        // 2. ATUALIZAR CRIPTOS (Binance API Pública)
        try {
            const response = await axios.get('https://api.binance.com/api/v3/ticker/24hr');
            const tickers = response.data;
            let cryptoCount = 0;

            for (const crypto of CRYPTOS) {
                const pair = `${crypto}USDT`;
                const ticker = tickers.find(t => t.symbol === pair);

                if (ticker) {
                    await PriceCache.findOneAndUpdate(
                        { symbol: crypto },
                        {
                            symbol: crypto,
                            shortName: crypto,
                            longName: crypto,
                            currency: 'BRL',
                            assetType: 'CRYPTO', // 👇 FIX 2: Mantendo o assetType correto!
                            regularMarketPrice: parseFloat(ticker.lastPrice),
                            regularMarketChangePercent: parseFloat(ticker.priceChangePercent),
                            regularMarketTime: new Date(),
                            logourl: `https://cryptologos.cc/logos/${crypto.toLowerCase()}-${crypto.toLowerCase()}-logo.png?v=024`,
                            updatedAt: new Date()
                        },
                        { upsert: true }
                    );
                    cryptoCount++;
                }
            }
            console.log(`✅ [CRON-GIL] ${cryptoCount} Criptos atualizadas via Binance.`);
        } catch (err) {
            console.error('❌ [CRON-GIL] Erro na Binance:', err.message);
        }

    } catch (error) {
        console.error('❌ [CRON-GIL] Erro crítico na atualização:', error);
    }
};

const updateAIPerformanceMetrics = async () => {
    try {
        console.log('🔬 [CRON-IA] Coletando métricas longitudinais...');

        // Busca interações de 30+ dias atrás sem rendimentoDepois preenchido
        const trintaDiasAtras = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const pendentes = await AIInteraction.find({
            createdAt: { $lte: trintaDiasAtras },
            'rendimentoDepois.coletadoEm': null
        }).limit(500); // Processa em lotes

        for (const interaction of pendentes) {
            const user = await User.findById(interaction.userId).select('notas saldoPc maxPcAchieved');
            if (!user) continue;

            const notas = user.notas || {};
            await AIInteraction.findByIdAndUpdate(interaction._id, {
                'rendimentoDepois.n1_media': notas.n1?.length
                    ? notas.n1.reduce((a, b) => a + b, 0) / notas.n1.length : null,
                'rendimentoDepois.n2_media': notas.n2?.length
                    ? notas.n2.reduce((a, b) => a + b, 0) / notas.n2.length : null,
                'rendimentoDepois.simulado_enem_score': notas.simulados?.length
                    ? notas.simulados[notas.simulados.length - 1] : null,
                'rendimentoDepois.saldoPc': user.saldoPc,
                'rendimentoDepois.coletadoEm': new Date(),
            });
        }
        console.log(`✅ [CRON-IA] ${pendentes.length} interações atualizadas.`);
    } catch (error) {
        console.error('❌ [CRON-IA] Erro:', error);
    }
};

const initCron = () => {
    // 5. COLETA DE MÉTRICAS LONGITUDINAIS DA IA (Todo dia 5 de cada mês às 02:00)
    cron.schedule('0 2 5 * *', updateAIPerformanceMetrics);

    cron.schedule('0 0 * * *', async () => {
        try {
            await Item.updateMany({ expirationDate: { $lte: new Date() } }, { status: 'expired' });
        } catch (error) {
            console.error('❌ Erro no Cron de Itens:', error);
        }
    });

    cron.schedule('0 */1 * * *', async () => {
        try {
            await auctionController.checkAndCloseAuctions();
        } catch (error) {
            console.error('❌ Erro no Cron de Leilões:', error);
        }
    });

    cron.schedule('*/5 * * * *', updatePriceCache);
    cron.schedule('0 1 1 * *', distributeDividends);

    updatePriceCache();
    console.log('✅ Serviço de Cron Iniciado (Fontes Gratuitas)');
};

module.exports = { initCron };