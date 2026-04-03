// backend/src/config/skills.js

const CATALOG = {
    // --- BRONZE ---
    'GRUPO_VIP': { 
        name: "📱 Grupo VIP Whatsapp", 
        desc: "Acesso ao grupo exclusivo.", 
        type: 'PASSIVA', 
        image: "/uploads/grupo.webp" 
    },
    'AULA_VIP': { 
        name: "🎓 Aula VIP Bimestral", 
        desc: "Aula online para revisão e bônus.", 
        type: 'PASSIVA', 
        image: "/uploads/aulavip.webp" 
    },
    'VIP_CARD': { 
        name: "💳 VIP Card", 
        desc: "Acesso a empréstimos no banco.", 
        image: "/uploads/vip card.webp", 
        type: 'ATIVA', 
        uses: 3, 
        reset: 'QUARTERLY' 
    },

    // --- PRATA ---
    'BAU_ENIGMAS': { 
        name: "🧩 Baú dos Enigmas", 
        desc: "Enigma mensal com recompensa.", 
        image: "/uploads/baudeenigmas.webp", 
        type: 'PASSIVA' 
    },
    'AVALIACOES_RANK': { 
        name: "📊 Avaliações Rankiadas", 
        desc: "Premiação para primeiros colocados.", 
        type: 'PASSIVA', 
        image: "/uploads/avaliacao.webp" 
    },
    'AJUDA_DIVINA': { 
        name: "🙌 Ajuda Divina", 
        desc: "Dica em prova ou atividade (Exceto N2).", 
        image: "/uploads/ajudadivina.webp", 
        type: 'ATIVA', 
        uses: 3, 
        reset: 'QUARTERLY' 
    },

    // --- OURO ---
    'PRESENTE_ETE': { 
        name: "🎁 Presente ETE Gamificada", 
        desc: "Brinde personalizado mensal.", 
        type: 'PASSIVA', 
        image: "/uploads/presente gamificada.webp" 
    },
    'PRESENTE_TACA': { 
        name: "🏆 Presente Taça das Casas", 
        desc: "Bônus surpresa mensal.", 
        type: 'PASSIVA', 
        image: "/uploads/presente taca.webp" 
    },
    'PRESENTE_AC': { 
        name: "🎨 Presente A&C", 
        desc: "Bônus surpresa mensal A&C.", 
        type: 'PASSIVA', 
        image: "/uploads/presenteAC.webp" 
    },
    'PC_GOLD': { 
        name: "💰 PC$ Gold", 
        desc: "Ganha 50 PC$ ao abrir presente.", 
        type: 'PASSIVA', 
        image: "/uploads/PCGold.webp" 
    },

    // --- DIAMANTE ---
    'PLANO_BRUXO': { 
        name: "🧙‍♂️ Plano Estudo Mundo Bruxo", 
        desc: "Meta da Taça com recompensa em PC$.", 
        type: 'PASSIVA', 
        image: "/uploads/plano bruxo.webp" 
    },
    'PLANO_GAMIFICADO': { 
        name: "🎮 Plano Estudo Gamificado", 
        desc: "Desafios de estudo customizados.", 
        type: 'PASSIVA', 
        image: "/uploads/plano gamificado.webp" 
    },
    'MINA_DIAMANTE': { 
        name: "⛏️ Mina de Diamantes", 
        desc: "Ganha 1 cristal de mana por bimestre.", 
        image: "/uploads/Mina.webp", 
        type: 'PASSIVA' 
    },
    'SORTEIO_DIAMANTE': { 
        name: "💎 Sorteio Diamante", 
        desc: "Sorteios esporádicos de livros.", 
        image: "/uploads/sorteio.webp", 
        type: 'ATIVA', 
        uses: 3, 
        reset: 'QUARTERLY' 
    },

    // --- ÉPICO ---
    'TREINAMENTO': { 
        name: "⚔️ Treinamento Épico", 
        desc: "Mentoria de 30 min.", 
        image: "/uploads/Treinamentoepico.webp", 
        type: 'ATIVA', 
        uses: 3, 
        reset: 'QUARTERLY' 
    },
    'REDUCAO_DANO': { name: "🛡️ Redução de dano", desc: "Descarta erro na N1 (máx 1 ponto).", image: "/uploads/Reducao de dano.webp", type: 'ATIVA', uses: 3, reset: 'QUARTERLY' },
   'AUREA_SABER': { name: "✨ Áurea do saber", desc: "Arredondamento de 1 ponto na N1.", image: "/uploads/aureadosaber.webp", type: 'ATIVA', uses: 3, reset: 'QUARTERLY' },
    'BRINDE_EPICO': { 
        name: "🎁 Brinde Épico", 
        desc: "Brinde personalizado (Março 2026).", 
        image: "/uploads/brindepico.webp", 
         type: 'ATIVA' ,
        uses: 3,
        reset: 'QUARTERLY'
    },
    'INVISIBILIDADE_1': { 
        name: "👻 Invisibilidade (1 Sem)", 
        desc: "Estende prazo de entrega por 1 semana.", 
        image: "/uploads/Invisibilidade.webp", 
        type: 'ATIVA', 
        uses: 3, 
        reset: 'QUARTERLY' 
    },

    // --- LENDÁRIO ---
    'CONVERTER_PC': { 
        name: "📝 Converter PC$ em Nota", 
        desc: "Compra pontos na N1/N2.", 
        image: "/uploads/PCSNota.webp", 
        type: 'ATIVA', 
        uses: 3, 
        reset: 'QUARTERLY' 
    },
    'IMUNIDADE_ATRASO': { 
        name: "⏰ Imunidade Atraso", 
        desc: "Sem penalidade por atraso.", 
        image: "/uploads/Imunidade.webp", 
        type: 'PASSIVA' 
    },
    'REDUCAO_DANO_2': { name: "🛡️ Redução de dano aprimorado", desc: "Descarta 1 questão na N2.", image: "/uploads/redcdedanoapri.webp", type: 'ATIVA', uses: 3, reset: 'QUARTERLY' },

    'GIL_HONORARIO': { 
        name: "🎖️ Gil Rodriguense Honorário", 
        desc: "Benefícios por 1 ano após sair.", 
        type: 'PASSIVA', 
        image: "/uploads/honorario.webp" 
    },
    'INVISIBILIDADE_2': { 
        name: "👻 Invisibilidade Aprimorada", 
        desc: "Prazo estendido até o conselho.", 
        image: "/uploads/Invisibilidade Aprimorada.webp", 
        type: 'ATIVA', 
        uses: 3, 
        reset: 'QUARTERLY' 
    },
    'ESSENCIA_SABER': { name: "Essência do saber", desc: "Arredondamento de 1 ponto na N2.", image: "/uploads/essencia.webp", type: 'ATIVA', uses: 3, reset: 'QUARTERLY' },
   'TREINAMENTO_2': { name: "⚔️ Treinamento épico avançado", desc: "Mentoria de 60 min.", image: "/uploads/treinamentoepicoanvanc.webp", type: 'ATIVA', uses: 3, reset: 'QUARTERLY' },

    // --- SUPREMO ---
    'AJUDA_SUPREMA': { 
        name: "🔥 Ajuda Suprema", 
        desc: "Auxílio na N1 ou N2.", 
        image: "/uploads/Ajuda Suprema.webp", 
        type: 'ATIVA', 
        uses: 3, 
        reset: 'QUARTERLY' 
    },
    'IMORTAL': { 
        name: "🗿 Imortal do Classcraft", 
        desc: "Não cai em batalha.", 
        image: "/uploads/Imortal do Classcraft.webp", 
        type: 'PASSIVA' 
    },
    'RENOMADO': { 
        name: "🌟 Renomado A&C", 
        desc: "Celebridade no RPG.", 
        type: 'PASSIVA', 
        image: "/uploads/Renomado A&C.webp" 
    },
    'RESSUSCITAR': { 
        name: "💖 Ressuscitar", 
        desc: "Nova chance em avaliação ou Classcraft.", 
        image: "/uploads/Ressuscitar.webp", 
        type: 'ATIVA', 
        uses: 3, 
        reset: 'QUARTERLY' 
    },
    'ARREMATADOR': { 
        name: "🔨 Arrematador de Leilões", 
        desc: "Paga 50% do lance.", 
        image: "/uploads/arrematadordeleiloes.webp", 
        type: 'ATIVA',
        uses: 3,
        reset: 'QUARTERLY'

    },

    // --- MITOLÓGICO ---
    'AJUDA_ILIMITADA': { 
        name: "⚡ Ajuda Divina Ilimitada", 
        desc: "Perguntas Sim/Não na prova.", 
        image: "/uploads/Ajuda Divina Ilimitada.webp", 
        type: 'ATIVA', 
        uses: 3, 
        reset: 'QUARTERLY' 
    },
    'CAMPEAO': { 
        name: "Campeão(ã) Mithológico", 
        desc: "Desafios valendo até 8000 PC$.", 
        image: "/uploads/campeao.webp", 
        type: 'PASSIVA' 
    },
    'REDUCAO_ABSOLUTA': { name: "🛡️ Redução de dano Absoluta", desc: "Exime de qualquer erro na N1.", image: "/uploads/reducaodedanoabsoluta.webp", type: 'ATIVA', uses: 3, reset: 'QUARTERLY' },
    'DOBRADOR': { 
        name: "💰 Dobrador de PC$", 
        desc: "Ganha 2x PC$ em atividades.", 
        image: "/uploads/dobrador de pc.webp", 
        type: 'PASSIVA' 
    },
    'CONCEDER_RESSUSCITAR': { 
        name: "💖 Conceder Ressuscitar", 
        desc: "Dá ressuscitar para colega.", 
        image: "/uploads/conceder.webp", 
        type: 'ATIVA', 
        uses: 3, 
        reset: 'QUARTERLY' 
    },
    'PRESENTE_DEUSES': { 
        name: "🎁 Presente dos Deuses", 
        desc: "Pode doar benefício.", 
        image: "/uploads/presentedosdeuses.webp", 
        type: 'ATIVA', 
        uses: 3, 
        reset: 'QUARTERLY' 
    },
    'TRANSF_CONHECIMENTO': { 
        name: "🧠 Transf. Conhecimento", 
        desc: "Transfere pontos para colega.", 
        image: "/uploads/saber.webp", 
        type: 'ATIVA', 
        uses: 3, 
        reset: 'QUARTERLY' 
    },
    'CIRCULO_CURA': { 
        name: "🏥 Círculo de Cura", 
        desc: "Cura em área no RPG.", 
        image: "/uploads/circulodecura.webp", 
        type: 'ATIVA', 
        uses: 3, 
        reset: 'QUARTERLY' 
    },

    // --- SOBERANO ---
    'AJUDA_SOBERANA': { 
        name: "👑 Ajuda Soberana", 
        desc: "Super ajuda N1/N2.", 
        image: "/uploads/ajuda soberana.webp", 
        type: 'ATIVA', 
        uses: 3, 
        reset: 'QUARTERLY' 
    },
    'ARREMATADOR_75': { 
        name: "🔨 Arrematador Aprimorado (75%)", 
        desc: "Paga 25% do lance.", 
        image: "/uploads/ArrematadordeLeiloesAprimorado.webp", 
        type: 'ATIVA',
        uses: 3,
        reset: 'QUARTERLY'
    },
    'TRIPLICADOR': { 
        name: "✖️3️⃣ Triplicador de PC$", 
        desc: "Ganha 3x PC$ em atividades.", 
        image: "/uploads/Triplicador.webp", 
        type: 'PASSIVA' 
    },
    'PODER_FENIX': { 
        name: "🦅 Poder da Fênix", 
        desc: "Ressuscita a casa toda.", 
        image: "/uploads/poderdafenix.webp", 
        type: 'ATIVA', 
        uses: 3, 
        reset: 'QUARTERLY' 
    },
    'ROLETADA_GRATIS': { 
        name: "🎡 Roletada Grátis", 
        desc: "Giro especial na roleta.", 
        image: "/uploads/roletada.webp", 
        type: 'ATIVA', 
        uses: 3, 
        reset: 'QUARTERLY' 
    }, 
    'ESSENCIA_FENIX': { 
        name: "🪶 Essência da Fênix", 
        desc: "Ganha 1 ponto na N2.", 
        image: "/uploads/Penadefenix.webp", 
        type: 'PASSIVA' 
    },
    'CANALIZADOR_MANA': { 
        name: "🔮 Canalizador de Mana", 
        desc: "Restaura cristais.", 
        image: "/uploads/canalisador.webp", 
        type: 'ATIVA', 
        uses: 3, 
        reset: 'QUARTERLY' 
    },
    'PEDRA_FENIX': { 
        name: "💎 Pedra da Fênix", 
        desc: "Restaura pedras do conhecimento.", 
        image: "/uploads/pedra.webp", 
        type: 'ATIVA', 
        uses: 3, 
        reset: 'QUARTERLY' 
    }
};

module.exports = CATALOG;