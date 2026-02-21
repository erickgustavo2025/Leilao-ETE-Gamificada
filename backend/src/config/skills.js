// backend/src/config/skills.js

const CATALOG = {
    // --- BRONZE ---
    'GRUPO_VIP': { 
        name: "📱 Grupo VIP Whatsapp", 
        desc: "Acesso ao grupo exclusivo.", 
        type: 'PASSIVA', 
        image: "/uploads/grupo.png" 
    },
    'AULA_VIP': { 
        name: "🎓 Aula VIP Bimestral", 
        desc: "Aula online para revisão e bônus.", 
        type: 'PASSIVA', 
        image: "/uploads/aulavip.png" 
    },
    'VIP_CARD': { 
        name: "💳 VIP Card", 
        desc: "Acesso a empréstimos no banco.", 
        image: "/uploads/vip card.png", 
        type: 'ATIVA', 
        uses: 3, 
        reset: 'QUARTERLY' 
    },

    // --- PRATA ---
    'BAU_ENIGMAS': { 
        name: "🧩 Baú dos Enigmas", 
        desc: "Enigma mensal com recompensa.", 
        image: "/uploads/baudeenigmas.png", 
        type: 'PASSIVA' 
    },
    'AVALIACOES_RANK': { 
        name: "📊 Avaliações Rankiadas", 
        desc: "Premiação para primeiros colocados.", 
        type: 'PASSIVA', 
        image: "/uploads/avaliacao.png" 
    },
    'AJUDA_DIVINA': { 
        name: "🙌 Ajuda Divina", 
        desc: "Dica em prova ou atividade (Exceto N2).", 
        image: "/uploads/ajudadivina.png", 
        type: 'ATIVA', 
        uses: 3, 
        reset: 'QUARTERLY' 
    },

    // --- OURO ---
    'PRESENTE_ETE': { 
        name: "🎁 Presente ETE Gamificada", 
        desc: "Brinde personalizado mensal.", 
        type: 'PASSIVA', 
        image: "/uploads/presente gamificada.png" 
    },
    'PRESENTE_TACA': { 
        name: "🏆 Presente Taça das Casas", 
        desc: "Bônus surpresa mensal.", 
        type: 'PASSIVA', 
        image: "/uploads/presente taca.png" 
    },
    'PRESENTE_AC': { 
        name: "🎨 Presente A&C", 
        desc: "Bônus surpresa mensal A&C.", 
        type: 'PASSIVA', 
        image: "/uploads/presenteAC.png" 
    },
    'PC_GOLD': { 
        name: "💰 PC$ Gold", 
        desc: "Ganha 50 PC$ ao abrir presente.", 
        type: 'PASSIVA', 
        image: "/uploads/PCGold.png" 
    },

    // --- DIAMANTE ---
    'PLANO_BRUXO': { 
        name: "🧙‍♂️ Plano Estudo Mundo Bruxo", 
        desc: "Meta da Taça com recompensa em PC$.", 
        type: 'PASSIVA', 
        image: "/uploads/plano bruxo.png" 
    },
    'PLANO_GAMIFICADO': { 
        name: "🎮 Plano Estudo Gamificado", 
        desc: "Desafios de estudo customizados.", 
        type: 'PASSIVA', 
        image: "/uploads/plano gamificado.png" 
    },
    'MINA_DIAMANTE': { 
        name: "⛏️ Mina de Diamantes", 
        desc: "Ganha 1 cristal de mana por bimestre.", 
        image: "/uploads/Mina.png", 
        type: 'PASSIVA' 
    },
    'SORTEIO_DIAMANTE': { 
        name: "💎 Sorteio Diamante", 
        desc: "Sorteios esporádicos de livros.", 
        image: "/uploads/sorteio.png", 
        type: 'ATIVA', 
        uses: 3, 
        reset: 'QUARTERLY' 
    },

    // --- ÉPICO ---
    'TREINAMENTO': { 
        name: "⚔️ Treinamento Épico", 
        desc: "Mentoria de 30 min.", 
        image: "/uploads/Treinamentoepico.png", 
        type: 'ATIVA', 
        uses: 3, 
        reset: 'QUARTERLY' 
    },
    'REDUCAO_DANO': { name: "🛡️ Redução de dano", desc: "Descarta erro na N1 (máx 1 ponto).", image: "/uploads/Reducao de dano.png", type: 'ATIVA', uses: 3, reset: 'QUARTERLY' },
   'AUREA_SABER': { name: "✨ Áurea do saber", desc: "Arredondamento de 1 ponto na N1.", image: "/uploads/aureadosaber.png", type: 'ATIVA', uses: 3, reset: 'QUARTERLY' },
    'BRINDE_EPICO': { 
        name: "🎁 Brinde Épico", 
        desc: "Brinde personalizado (Março 2026).", 
        image: "/uploads/brindepico.png", 
         type: 'ATIVA' ,
        uses: 3,
        reset: 'QUARTERLY'
    },
    'INVISIBILIDADE_1': { 
        name: "👻 Invisibilidade (1 Sem)", 
        desc: "Estende prazo de entrega por 1 semana.", 
        image: "/uploads/Invisibilidade.png", 
        type: 'ATIVA', 
        uses: 3, 
        reset: 'QUARTERLY' 
    },

    // --- LENDÁRIO ---
    'CONVERTER_PC': { 
        name: "📝 Converter PC$ em Nota", 
        desc: "Compra pontos na N1/N2.", 
        image: "/uploads/PCSNota.png", 
        type: 'ATIVA', 
        uses: 3, 
        reset: 'QUARTERLY' 
    },
    'IMUNIDADE_ATRASO': { 
        name: "⏰ Imunidade Atraso", 
        desc: "Sem penalidade por atraso.", 
        image: "/uploads/Imunidade.png", 
        type: 'PASSIVA' 
    },
    'REDUCAO_DANO_2': { name: "🛡️ Redução de dano aprimorado", desc: "Descarta 1 questão na N2.", image: "/uploads/redcdedanoapri.png", type: 'ATIVA', uses: 3, reset: 'QUARTERLY' },

    'GIL_HONORARIO': { 
        name: "🎖️ Gil Rodriguense Honorário", 
        desc: "Benefícios por 1 ano após sair.", 
        type: 'PASSIVA', 
        image: "/uploads/honorario.png" 
    },
    'INVISIBILIDADE_2': { 
        name: "👻 Invisibilidade Aprimorada", 
        desc: "Prazo estendido até o conselho.", 
        image: "/uploads/Invisibilidade Aprimorada.png", 
        type: 'ATIVA', 
        uses: 3, 
        reset: 'QUARTERLY' 
    },
    'ESSENCIA_SABER': { name: "Essência do saber", desc: "Arredondamento de 1 ponto na N2.", image: "/uploads/essencia.png", type: 'ATIVA', uses: 3, reset: 'QUARTERLY' },
   'TREINAMENTO_2': { name: "⚔️ Treinamento épico avançado", desc: "Mentoria de 60 min.", image: "/uploads/treinamentoepicoanvanc.png", type: 'ATIVA', uses: 3, reset: 'QUARTERLY' },

    // --- SUPREMO ---
    'AJUDA_SUPREMA': { 
        name: "🔥 Ajuda Suprema", 
        desc: "Auxílio na N1 ou N2.", 
        image: "/uploads/Ajuda Suprema.png", 
        type: 'ATIVA', 
        uses: 3, 
        reset: 'QUARTERLY' 
    },
    'SORTUDO': {
        name: "Sortudo (2x Chance)", 
        desc: "Dobra a chance na roleta (3 usos/trimestre).",
        image: "/uploads/Sortudo.png",
        type: 'ATIVA',
        uses: 3, 
        reset: 'QUARTERLY'
    },
    'IMORTAL': { 
        name: "🗿 Imortal do Classcraft", 
        desc: "Não cai em batalha.", 
        image: "/uploads/Imortal do Classcraft.png", 
        type: 'PASSIVA' 
    },
    'RENOMADO': { 
        name: "🌟 Renomado A&C", 
        desc: "Celebridade no RPG.", 
        type: 'PASSIVA', 
        image: "/uploads/Renomado A&C.png" 
    },
    'RESSUSCITAR': { 
        name: "💖 Ressuscitar", 
        desc: "Nova chance em avaliação ou Classcraft.", 
        image: "/uploads/Ressuscitar.png", 
        type: 'ATIVA', 
        uses: 3, 
        reset: 'QUARTERLY' 
    },
    'ARREMATADOR': { 
        name: "🔨 Arrematador de Leilões", 
        desc: "Paga 50% do lance.", 
        image: "/uploads/arrematadordeleiloes.png", 
        type: 'ATIVA',
        uses: 3,
        reset: 'QUARTERLY'

    },

    // --- MITOLÓGICO ---
    'AJUDA_ILIMITADA': { 
        name: "⚡ Ajuda Divina Ilimitada", 
        desc: "Perguntas Sim/Não na prova.", 
        image: "/uploads/Ajuda Divina Ilimitada.png", 
        type: 'ATIVA', 
        uses: 3, 
        reset: 'QUARTERLY' 
    },
    'CAMPEAO': { 
        name: "Campeão(ã) Mithológico", 
        desc: "Desafios valendo até 8000 PC$.", 
        image: "/uploads/campeao.png", 
        type: 'PASSIVA' 
    },
    'REDUCAO_ABSOLUTA': { name: "🛡️ Redução de dano Absoluta", desc: "Exime de qualquer erro na N1.", image: "/uploads/reducaodedanoabsoluta.png", type: 'ATIVA', uses: 3, reset: 'QUARTERLY' },
    'DOBRADOR': { 
        name: "💰 Dobrador de PC$", 
        desc: "Ganha 2x PC$ em atividades.", 
        image: "/uploads/dobrador de pc.png", 
        type: 'PASSIVA' 
    },
    'CONCEDER_RESSUSCITAR': { 
        name: "💖 Conceder Ressuscitar", 
        desc: "Dá ressuscitar para colega.", 
        image: "/uploads/conceder.png", 
        type: 'ATIVA', 
        uses: 3, 
        reset: 'QUARTERLY' 
    },
    'PRESENTE_DEUSES': { 
        name: "🎁 Presente dos Deuses", 
        desc: "Pode doar benefício.", 
        image: "/uploads/presentedosdeuses.png", 
        type: 'ATIVA', 
        uses: 3, 
        reset: 'QUARTERLY' 
    },
    'TRANSF_CONHECIMENTO': { 
        name: "🧠 Transf. Conhecimento", 
        desc: "Transfere pontos para colega.", 
        image: "/uploads/saber.png", 
        type: 'ATIVA', 
        uses: 3, 
        reset: 'QUARTERLY' 
    },
    'CIRCULO_CURA': { 
        name: "🏥 Círculo de Cura", 
        desc: "Cura em área no RPG.", 
        image: "/uploads/circulodecura.png", 
        type: 'ATIVA', 
        uses: 3, 
        reset: 'QUARTERLY' 
    },

    // --- SOBERANO ---
    'AJUDA_SOBERANA': { 
        name: "👑 Ajuda Soberana", 
        desc: "Super ajuda N1/N2.", 
        image: "/uploads/ajuda soberana.png", 
        type: 'ATIVA', 
        uses: 3, 
        reset: 'QUARTERLY' 
    },
    'ARREMATADOR_75': { 
        name: "🔨 Arrematador Aprimorado (75%)", 
        desc: "Paga 25% do lance.", 
        image: "/uploads/ArrematadordeLeiloesAprimorado.png", 
        type: 'ATIVA',
        uses: 3,
        reset: 'QUARTERLY'
    },
    'GILBET_PREMIUM': { 
        name: "🎰 Gilbet Premium", 
        desc: "Dobra limite de ganhos.", 
        image: "/uploads/ticket.png", // Ticket padrão se não tiver imagem específica
        type: 'PASSIVA' 
    },
    'TRIPLICADOR': { 
        name: "✖️3️⃣ Triplicador de PC$", 
        desc: "Ganha 3x PC$ em atividades.", 
        image: "/uploads/Triplicador.png", 
        type: 'PASSIVA' 
    },
    'PODER_FENIX': { 
        name: "🦅 Poder da Fênix", 
        desc: "Ressuscita a casa toda.", 
        image: "/uploads/poderdafenix.png", 
        type: 'ATIVA', 
        uses: 3, 
        reset: 'QUARTERLY' 
    },
    'ROLETADA_GRATIS': { 
        name: "🎡 Roletada Grátis", 
        desc: "Giro especial na roleta.", 
        image: "/uploads/roletada.png", 
        type: 'ATIVA', 
        uses: 3, 
        reset: 'QUARTERLY' 
    }, 
    'ESSENCIA_FENIX': { 
        name: "🪶 Essência da Fênix", 
        desc: "Ganha 1 ponto na N2.", 
        image: "/uploads/Penadefenix.png", 
        type: 'PASSIVA' 
    },
    'CANALIZADOR_MANA': { 
        name: "🔮 Canalizador de Mana", 
        desc: "Restaura cristais.", 
        image: "/uploads/canalisador.png", 
        type: 'ATIVA', 
        uses: 3, 
        reset: 'QUARTERLY' 
    },
    'PEDRA_FENIX': { 
        name: "💎 Pedra da Fênix", 
        desc: "Restaura pedras do conhecimento.", 
        image: "/uploads/pedra.png", 
        type: 'ATIVA', 
        uses: 3, 
        reset: 'QUARTERLY' 
    }
};

module.exports = CATALOG;