// ARQUIVO: backend/src/scripts/seedBecoDiagonal.js
require('dotenv').config();
const mongoose = require('mongoose');
const StoreItem = require('../models/StoreItem');
const path = require('path');
// Sobe um nível para achar o .env se estiver rodando de dentro de src/scripts
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const BECO_ITEMS = [
    // 🧹 MASTER VASSOURAS
    {
        nome: "Nimbus 2001",
        descricao: "Concede a autorização da participação no Quadribol mesmo já tendo participado de outro desafio.",
        lojaTematica: "VASSOURAS",
        imagem: "/assets/nimbus.webp",
        preco: 5000,
        raridade: "Evento",
        isHouseItem: true
    },
    {
        nome: "Firebolt Suprema",
        descricao: "Concede o poder de substituir um jogador da equipe por qualquer outro participante.",
        lojaTematica: "VASSOURAS",
        imagem: "/assets/firebolt.webp",
        preco: 1000,
        raridade: "Evento",
        isHouseItem: true
    },
    {
        nome: "Comet 260",
        descricao: "Concede o poder de Ter um jogador reserva.",
        lojaTematica: "VASSOURAS",
        imagem: "/assets/cleansweep.webp",
        preco: 1000,
        raridade: "Evento",
        isHouseItem: true
    },

    // 🪄 OLIVARAS
    {
        nome: "Pelo de Unicórnio",
        descricao: "Confere uma ajuda Divina do mundo Bruxo.",
        lojaTematica: "VARINHAS",
        imagem: "/assets/wand_unicorn.webp",
        preco: 1000,
        raridade: "Evento",
        isHouseItem: true
    },
    {
        nome: "Fibra de Dragão",
        descricao: "Elimina um erro no desafio de desempenho.",
        lojaTematica: "VARINHAS",
        imagem: "/assets/wand_dragon.webp",
        preco: 3000,
        raridade: "Evento",
        isHouseItem: true
    },
    {
        nome: "Pena de Fênix",
        descricao: "Concede prioridade na escolha se houver empate.",
        lojaTematica: "VARINHAS",
        imagem: "/assets/wand_phoenix.webp",
        preco: 4000,
        raridade: "Evento",
        isHouseItem: true
    },
    // Varinhas de Média Global
    {
        nome: "Salgueiro Lutador",
        descricao: "Adiciona 1 décimo na disputa da maior média global.",
        lojaTematica: "VARINHAS",
        imagem: "/assets/wand_willow.webp",
        preco: 1000,
        raridade: "Evento",
        isHouseItem: true
    },
    {
        nome: "Carvalho Inglês",
        descricao: "Adiciona 3 décimos na disputa da maior média global.",
        lojaTematica: "VARINHAS",
        imagem: "/assets/wand_oak.webp",
        preco: 3000,
        raridade: "Evento",
        isHouseItem: true
    },
    {
        nome: "Vidio Ancião",
        descricao: "Adiciona 5 décimos na disputa da maior média global.",
        lojaTematica: "VARINHAS",
        imagem: "/assets/wand_elder.webp",
        preco: 5000,
        raridade: "Evento",
        isHouseItem: true
    },
    {
        nome: "Azevinho",
        descricao: "Concede prioridade na escolha se houver empate (Média Global).",
        lojaTematica: "VARINHAS",
        imagem: "/assets/wand_holly.webp",
        preco: 1000,
        raridade: "Evento",
        isHouseItem: true
    },

    // 🧪 CASA DE MAGIA (Poções)
    {
        nome: "Poção da Lógica",
        descricao: "Adiciona 1 ponto para média de Matemática no X1.",
        lojaTematica: "POCOES",
        imagem: "/assets/potion_math.webp",
        preco: 1000,
        raridade: "Evento",
        isHouseItem: true
    },
    {
        nome: "Elixir da Eloquência",
        descricao: "Adiciona 1 ponto para média de Humanas no X1.",
        lojaTematica: "POCOES",
        imagem: "/assets/potion_human.webp",
        preco: 1000,
        raridade: "Evento",
        isHouseItem: true
    },
    {
        nome: "Extrato de Herbologia",
        descricao: "Adiciona 1 ponto para média de Ciências da Natureza no X1.",
        lojaTematica: "POCOES",
        imagem: "/assets/potion_nature.webp",
        preco: 1000,
        raridade: "Evento",
        isHouseItem: true
    },
    {
        nome: "Soro da Poliglotia",
        descricao: "Adiciona 1 ponto para média de Linguagens no X1.",
        lojaTematica: "POCOES",
        imagem: "/assets/potion_lang.webp",
        preco: 1000,
        raridade: "Evento",
        isHouseItem: true
    },

    // 🗺️ MAROTO E-SPORTS
    {
        nome: "Lunetas de Luna",
        descricao: "Traduz qualquer escrita para a língua do leitor.",
        lojaTematica: "MAROTO",
        imagem: "/assets/spectrespecs.webp",
        preco: 2000,
        raridade: "Evento",
        isHouseItem: true
    },
    {
        nome: "Tênis Alado",
        descricao: "Retira 1 minuto no tempo final (Mapa ou Relíquias).",
        lojaTematica: "MAROTO",
        imagem: "/assets/sneakers.webp",
        preco: 1000,
        raridade: "Evento",
        isHouseItem: true
    },
    {
        nome: "Raquete Divina",
        descricao: "Confere uma ajuda divina em uma questão ou enigma.",
        lojaTematica: "MAROTO",
        imagem: "/assets/racket.webp",
        preco: 2000,
        raridade: "Evento",
        isHouseItem: true
    },

    // ⚖️ MINISTÉRIO (Advogados)
    {
        nome: "Arthur Weasley",
        descricao: "Diminui pela metade 1 punição LEVE.",
        lojaTematica: "MINISTERIO",
        imagem: "/assets/arthur.webp",
        preco: 1000,
        raridade: "Evento",
        isHouseItem: true
    },
    {
        nome: "Kingsley Shacklebolt",
        descricao: "Diminui pela metade 1 punição MODERADA.",
        lojaTematica: "MINISTERIO",
        imagem: "/assets/kingsley.webp",
        preco: 2000,
        raridade: "Evento",
        isHouseItem: true
    },
    {
        nome: "Barty Crouch Sr.",
        descricao: "Diminui pela metade 1 punição GRAVE.",
        lojaTematica: "MINISTERIO",
        imagem: "/assets/crouch.webp",
        preco: 3000,
        raridade: "Evento",
        isHouseItem: true
    },
    {
        nome: "Bellatrix Lestrange",
        descricao: "Diminui pela metade 1 punição GRAVÍSSIMA.",
        lojaTematica: "MINISTERIO",
        imagem: "/assets/bellatrix.webp",
        preco: 4000,
        raridade: "Evento",
        isHouseItem: true
    },

    // 📖 MAGIC BOOK
    {
        nome: "Tomo do Destino",
        descricao: "Prioridade no desempate.",
        lojaTematica: "MAGIC_BOOK",
        imagem: "/assets/book_destiny.webp",
        preco: 1000,
        raridade: "Evento",
        isHouseItem: true
    },
    {
        nome: "Manuscrito do Caos",
        descricao: "Fazer um novo sorteio para trocar o participante sorteado.",
        lojaTematica: "MAGIC_BOOK",
        imagem: "/assets/book_chaos.webp",
        preco: 1000,
        raridade: "Evento",
        isHouseItem: true
    },
    {
        nome: "Grimório da Aliança",
        descricao: "Fazer a prova em Dupla.",
        lojaTematica: "MAGIC_BOOK",
        imagem: "/assets/book_alliance.webp",
        preco: 5000,
        raridade: "Evento",
        isHouseItem: true
    }
];

const seed = async () => {
    try {
        console.log('⚡ ABRINDO O BECO DIAGONAL...');
        await mongoose.connect(process.env.MONGO_URI);

        await StoreItem.deleteMany({ isHouseItem: true });

        for (const item of BECO_ITEMS) {
            await StoreItem.create({
                ...item,
                raridade: "Evento",
                estoque: 999,
                cargoExclusivo: 'Todos',
                validadeDias: 14 
            });
            console.log(`✨ ${item.nome} criado.`);
        }

        console.log('✅ BECO DIAGONAL INAUGURADO!');
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

seed();