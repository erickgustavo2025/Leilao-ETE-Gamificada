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
        console.log('📈 [CRON-GIL] Iniciando atualização de preços (Fontes Blindadas)...');

        // 1. ATUALIZAR AÇÕES (Yahoo Finance)
        const stockSymbols = STOCKS.map(s => `${s}.SA`);
        try {
            // Tenta buscar com timeout e tratando possíveis erros de rede
            const results = await yahooFinance.quote(stockSymbols).catch(err => {
                if (err.message.includes('fetch failed')) {
                    throw new Error('Falha de conexão com os servidores do Yahoo Finance (Posível bloqueio de rede)');
                }
                throw err;
            });

            const stockOps = results.map(quote => {
                const symbol = quote.symbol.replace('.SA', '');
                return {
                    updateOne: {
                        filter: { symbol },
                        update: {
                            symbol,
                            shortName: symbol,
                            longName: quote.longName || symbol,
                            currency: 'BRL',
                            assetType: 'STOCK',
                            regularMarketPrice: quote.regularMarketPrice,
                            regularMarketChangePercent: quote.regularMarketChangePercent,
                            regularMarketTime: new Date(),
                            logourl: `https://icons.brapi.dev/logos/${symbol}.png`,
                            updatedAt: new Date()
                        },
                        upsert: true
                    }
                };
            });

            if (stockOps.length > 0) {
                await PriceCache.bulkWrite(stockOps, { ordered: false });
            }
            console.log(`✅ [CRON-GIL] ${results.length} Ações atualizadas.`);
        } catch (err) {
            console.error('⚠️ [CRON-GIL] Falha no Yahoo Finance (Ações):', err.message);
        }

        // 2. ATUALIZAR CRIPTOS (Binance com FALLBACK de DNS)
        const binanceUrls = [
            'https://api.binance.com/api/v3/ticker/24hr',
            'https://api1.binance.com/api/v3/ticker/24hr',
            'https://api2.binance.com/api/v3/ticker/24hr',
            'https://api3.binance.com/api/v3/ticker/24hr'
        ];

        let tickers = null;
        for (const url of binanceUrls) {
            try {
                const response = await axios.get(url, { timeout: 10000 });
                tickers = response.data;
                if (tickers) break;
            } catch (err) {
                console.warn(`⚠️ [CRON-GIL] Falha na URL Binance (${url}): ${err.code || err.message}`);
                continue;
            }
        }

        if (tickers) {
            const cryptoOps = [];
            for (const crypto of CRYPTOS) {
                const pair = `${crypto}USDT`;
                const ticker = tickers.find(t => t.symbol === pair);

                if (ticker) {
                    cryptoOps.push({
                        updateOne: {
                            filter: { symbol: crypto },
                            update: {
                                symbol: crypto,
                                shortName: crypto,
                                longName: crypto,
                                currency: 'BRL',
                                assetType: 'CRYPTO',
                                regularMarketPrice: parseFloat(ticker.lastPrice),
                                regularMarketChangePercent: parseFloat(ticker.priceChangePercent),
                                regularMarketTime: new Date(),
                                logourl: `https://cryptologos.cc/logos/${crypto.toLowerCase()}-${crypto.toLowerCase()}-logo.png?v=024`,
                                updatedAt: new Date()
                            },
                            upsert: true
                        }
                    });
                }
            }

            if (cryptoOps.length > 0) {
                await PriceCache.bulkWrite(cryptoOps, { ordered: false });
                console.log(`✅ [CRON-GIL] ${cryptoOps.length} Criptos atualizadas via Binance.`);
            }
        } else {
            console.error('❌ [CRON-GIL] Todas as APIs da Binance falharam. Verifique sua conexão com a internet.');
        }

    } catch (error) {
        console.error('❌ [CRON-GIL] Erro inesperado na atualização:', error);
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
            console.log('🕒 [Cron Meia-Noite] Iniciando rotinas de manutenção...');
            
            // 1. Manutenção de Itens (Expiração de vantagens temporárias)
            const expired = await Item.updateMany(
                { expirationDate: { $lte: new Date() }, status: { $ne: 'expired' } }, 
                { status: 'expired' }
            );
            if (expired.modifiedCount > 0) {
                console.log(`📦 [Maintenance] ${expired.modifiedCount} itens temporários expiraram.`);
            }
            
            // 2. Oráculo GIL: Re-aprendizado Total (RAG)
            console.log('🤖 [RAG-Sync] Atualizando base de conhecimento da IA...');
            const { cleanAndReindex } = require('../scripts/cleanAndReindex');
            await cleanAndReindex();

            // 3. Análise de Gaps (PJC) - Agora isolada para clareza
            console.log('📊 [PJC-Analysis] Analisando gaps das disciplinas...');
            const Disciplina = require('../models/Disciplina');
            const PJCDataService = require('../services/PJCDataService');
            const disciplinas = await Disciplina.find();
            for (const disc of disciplinas) {
                await PJCDataService.generateGapAnalysis(disc._id).catch(() => {});
            }

            console.log('✅ [Cron Meia-Noite] Todas as rotinas concluídas com sucesso.');
        } catch (error) {
            console.error('❌ [Cron Meia-Noite] Erro crítico nas rotinas:', error);
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