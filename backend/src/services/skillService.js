const { RANKS, RANK_SKILLS } = require('../config/gameRules');
const SKILLS_CATALOG = require('../config/skills');
const GameSkill = require('../models/GameSkill');

module.exports = {
    async syncRankSkills(user) {
        if (!user.maxPcAchieved) return false;

        // 1. Busca skills do banco (Fonte da verdade das imagens)
        const allDbSkills = await GameSkill.find({});
        const dbSkillMapByName = {};
        allDbSkills.forEach(s => dbSkillMapByName[s.name] = s);

        // 2. Ranks do usuário
        const userRanks = RANKS.filter(r => user.maxPcAchieved >= r.min);
        
        // 3. Lista de Skills Permitidas
        const allowedSkills = {};
        userRanks.forEach(rank => {
            const codes = RANK_SKILLS[rank.id] || [];
            codes.forEach(code => {
                allowedSkills[code] = rank.name; 
            });
        });

        let hasChanges = false;

        // 4. Sincronia
        for (const [code, rankName] of Object.entries(allowedSkills)) {
            const catalogDef = SKILLS_CATALOG[code];
            if (!catalogDef) continue;

            // Prioridade: Banco > Catálogo
            const dbDef = dbSkillMapByName[catalogDef.name];

            const finalName = dbDef?.name || catalogDef.name;
            const finalImage = dbDef?.image || catalogDef.image; // 🔥 A IMAGEM VIVA
            const finalDesc = dbDef?.description || catalogDef.desc;
            const finalType = dbDef?.type || catalogDef.type;
            const finalRarity = rankName;

            const maxUses = dbDef?.usesMax || catalogDef.uses || 3;
            const resetPeriod = dbDef?.resetPeriod || catalogDef.reset || 'QUARTERLY';

            // === TIPO 1: PASSIVAS (BUFFS) ===
            if (finalType === 'PASSIVA' || finalType === 'PASSIVE') {
                const buffIndex = user.activeBuffs.findIndex(b => b.effect === code || b.name === finalName);
                
                if (buffIndex === -1) {
                    // CENA 1: Adiciona Novo (COM IMAGEM AGORA!)
                    user.activeBuffs.push({
                        effect: code,
                        name: finalName,
                        image: finalImage, // ✅ SALVANDO A IMAGEM
                        expiresAt: null,
                        source: 'RANK'
                    });
                    hasChanges = true;
                } else {
                    // CENA 2: Conserta Buff Existente (Se estiver sem imagem)
                    const buff = user.activeBuffs[buffIndex];
                    if (buff.image !== finalImage) {
                        buff.image = finalImage; // ✅ PREENCHE O QUE FALTAVA
                        user.activeBuffs[buffIndex] = buff;
                        hasChanges = true;
                    }
                }
            } 
            
            // === TIPO 2: ATIVAS (INVENTÁRIO) ===
            else {
                const invIndex = user.inventory.findIndex(i => i.name === finalName && i.category === 'RANK_SKILL');

                if (invIndex === -1) {
                    user.inventory.push({
                        name: finalName,
                        descricao: finalDesc,
                        image: finalImage,
                        rarity: finalRarity,
                        category: 'RANK_SKILL',
                        usesMax: maxUses,
                        usesLeft: maxUses,
                        resetPeriod: resetPeriod,
                        quantity: 1,
                        acquiredAt: new Date(),
                        origin: 'RANK'
                    });
                    hasChanges = true;
                } else {
                    const item = user.inventory[invIndex];
                    let itemChanged = false;

                    if (item.image !== finalImage) {
                        item.image = finalImage;
                        itemChanged = true;
                    }
                    if (item.rarity !== finalRarity) {
                        item.rarity = finalRarity;
                        itemChanged = true;
                    }
                    if (item.descricao !== finalDesc) {
                        item.descricao = finalDesc;
                        itemChanged = true;
                    }
                    if (item.usesMax !== maxUses) {
                        item.usesMax = maxUses;
                        itemChanged = true;
                    }

                    if (itemChanged) {
                        user.inventory[invIndex] = item;
                        hasChanges = true;
                    }
                }
            }
        }

        return hasChanges;
    }
};