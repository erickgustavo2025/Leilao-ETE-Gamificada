// ARQUIVO: backend/src/scripts/seedHistory.js
// Execução: node src/scripts/seedHistory.js
// Popula o Hall da Fama com as casas lendárias da ETE Gil Rodrigues

require('dotenv').config();
const mongoose = require('mongoose');
const HouseHistory = require('../models/HouseHistory');

const HISTORICO = [
    // --- 7 VITÓRIAS ---
    { nome: "ALPHA LUPI",      anoEntrada: 2021, anoSaida: 2023, vitorias: 7, imagemUrl: "/uploads/3badm.2021.png",  ordem: 1 },
    // --- 5 VITÓRIAS ---
    { nome: "INFINITY JEWELS", anoEntrada: 2020, anoSaida: 2022, vitorias: 5, imagemUrl: "/uploads/3aadm.2020.png",  ordem: 2 },
    { nome: "ALATARES",        anoEntrada: 2023, anoSaida: 2025, vitorias: 5, imagemUrl: "/uploads/3bds.2023.png",   ordem: 3 },
    // --- 4 VITÓRIAS ---
    { nome: "ETERNIA",         anoEntrada: 2022, anoSaida: 2024, vitorias: 4, imagemUrl: "/uploads/3bds.2022.png",   ordem: 4 },
    { nome: "NEVERLAND",       anoEntrada: 2022, anoSaida: 2024, vitorias: 4, imagemUrl: "/uploads/3a.adm2022.png",  ordem: 5 },
    { nome: "BLUE STORM",      anoEntrada: 2022, anoSaida: 2024, vitorias: 4, imagemUrl: "/uploads/3badm.2022.png",  ordem: 6 },
    // --- 3 VITÓRIAS ---
    { nome: "IGNIS",           anoEntrada: 2019, anoSaida: 2021, vitorias: 3, imagemUrl: "/uploads/3aadm.2019.png",  ordem: 7 },
    { nome: "INFERNAIS",       anoEntrada: 2021, anoSaida: 2023, vitorias: 3, imagemUrl: "/uploads/3ads.2021.png",   ordem: 8 },
    { nome: "HUNTERS",         anoEntrada: 2023, anoSaida: 2025, vitorias: 3, imagemUrl: "/uploads/3aadm.2023.png",  ordem: 9 },
    { nome: "MIDGARD",         anoEntrada: 2024, anoSaida: 2026, vitorias: 3, imagemUrl: "/uploads/midgard.png",     ordem: 10 },
    { nome: "MONARCAS",        anoEntrada: 2024, anoSaida: 2026, vitorias: 3, imagemUrl: "/uploads/monarcas.png",    ordem: 11 },
    { nome: "VALHALLA",        anoEntrada: 2025, anoSaida: 2027, vitorias: 3, imagemUrl: "/uploads/valhalla.png",    ordem: 12 },
    // --- 2 VITÓRIAS ---
    { nome: "JAGUARES",        anoEntrada: 2020, anoSaida: 2022, vitorias: 2, imagemUrl: "/uploads/3ads.2020.png",   ordem: 13 },
    { nome: "GUARDIANS",       anoEntrada: 2021, anoSaida: 2023, vitorias: 2, imagemUrl: "/uploads/3aadm.2021.png",  ordem: 14 },
    { nome: "EXTREMES",        anoEntrada: 2023, anoSaida: 2025, vitorias: 2, imagemUrl: "/uploads/3badm.2023.png",  ordem: 15 },
    // --- 1 VITÓRIA ---
    { nome: "FAWKES",          anoEntrada: 2019, anoSaida: 2021, vitorias: 1, imagemUrl: "/uploads/3badm.2019.png",  ordem: 16 },
    { nome: "MAJINKS",         anoEntrada: 2020, anoSaida: 2022, vitorias: 1, imagemUrl: "/uploads/3badm.2020.png",  ordem: 17 },
    { nome: "THE MASK",        anoEntrada: 2022, anoSaida: 2024, vitorias: 1, imagemUrl: "/uploads/3ads.2022.png",   ordem: 18 },
    { nome: "IMPERIAIS",       anoEntrada: 2023, anoSaida: 2025, vitorias: 1, imagemUrl: "/uploads/3ads.2023.png",   ordem: 19 },
    { nome: "ATLANTIS",        anoEntrada: 2024, anoSaida: 2026, vitorias: 1, imagemUrl: "/uploads/atlantis.png",    ordem: 20 },
].map(h => ({
    ...h,
    anosAtivos: `${h.anoEntrada} - ${h.anoSaida}`
}));

async function seed() {
    try {
        await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
        console.log('🔗 Conectado ao MongoDB...');

        console.log('🔥 Limpando histórico antigo...');
        await HouseHistory.deleteMany({});

        console.log('⏳ Inserindo as Lendas da ETE Gil Rodrigues...');
        const inserted = await HouseHistory.insertMany(HISTORICO);

        console.log(`✅ Hall da Fama populado com ${inserted.length} casas!`);
        console.log('🏆 Casas inseridas por vitórias:');
        const sorted = inserted.sort((a, b) => b.vitorias - a.vitorias);
        sorted.forEach(h => console.log(`   ${h.vitorias}x 🏆 ${h.nome} (${h.anosAtivos})`));

        process.exit(0);
    } catch (error) {
        console.error('❌ Erro:', error);
        process.exit(1);
    }
}

seed();