const User = require("../models/User");
const Classroom = require("../models/Classroom");

async function deliverQuestRewards(user, quest) {
  // 1. Entrega o Dinheiro (PC$)
  if (quest.rewards?.pc > 0) {
    user.saldoPc += quest.rewards.pc;
    // maxPcAchieved é atualizado no hook pre-save do User.js
  }

  // 2. Entrega a Badge (se houver)
  if (quest.rewards?.badgeId && !user.cargos.includes(quest.rewards.badgeId)) {
    user.cargos.push(quest.rewards.badgeId);
  }

  // 🎁 3. O SISTEMA DE ITENS OFICIAL (Mochila Pessoal vs Turma)
  if (quest.rewardItems && quest.rewardItems.length > 0) {
    for (const item of quest.rewardItems) {
      let expirationDate = null;
      if (item.validityDays) {
        expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + item.validityDays);
      }

      if (item.sendToClassroom) {
        const turma = await Classroom.findOne({ serie: user.turma });
        if (turma) {
          turma.roomInventory.push({
            itemId: item.itemId,
            name: item.name,
            category: item.category,
            quantity: 1,
            acquiredAt: new Date(),
            expiresAt: expirationDate,
            origin: "PREMIO", // ⚠️ REGRA DE OURO: origin DEVE ser 'PREMIO'
            acquiredBy: user._id,
          });
          await turma.save();
        }
      } else {
        if (item.category === "BUFF") {
          user.activeBuffs = user.activeBuffs || [];
          user.activeBuffs.push({
            effect: item.itemId.toString(),
            name: item.name,
            source: `Missão: ${quest.title}`,
            expiresAt: expirationDate,
          });
        } else {
          user.inventory = user.inventory || [];
          user.inventory.push({
            itemId: item.itemId,
            name: item.name,
            category: item.category,
            quantity: 1,
            acquiredAt: new Date(),
            expiresAt: expirationDate,
            origin: "Missão",
          });
        }
      }
    }
  }

}

module.exports = { deliverQuestRewards };
