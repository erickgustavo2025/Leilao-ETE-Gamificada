const Classroom = require("../models/Classroom");
const User = require("../models/User");
const { normalizeInventoryItem } = require("./itemHelper");

/**
 * Prepara as operações atômicas para entrega de loot.
 * Nota: Esta função agora retorna as operações em vez de salvar o objeto, 
 * permitindo que o controller execute uma transação atômica única.
 */
async function deliverQuestRewards(user, quest) {
  const userId = user._id;
  const updateOps = {
    $inc: {},
    $addToSet: {},
    $push: {}
  };

  // 1. Dinheiro (PC$)
  if (quest.rewards?.pc > 0) {
    updateOps.$inc.saldoPc = quest.rewards.pc;
  }

  // 2. Badge/Cargo
  if (quest.rewards?.badgeId) {
    updateOps.$addToSet.cargos = quest.rewards.badgeId;
  }

  // 🎁 3. Itens e Buffs
  if (quest.rewardItems && quest.rewardItems.length > 0) {
    for (const item of quest.rewardItems) {
      let expirationDate = null;
      if (item.validityDays) {
        expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + item.validityDays);
      }

      const normalizedItem = normalizeInventoryItem(item, {
        origin: "PREMIO_MISSAO",
        acquiredBy: userId,
        expiresAt: expirationDate,
        category: item.category || "CONSUMIVEL"
      });

      if (item.sendToClassroom) {
        // Atualização de Turma continua sendo uma chamada separada (escopo diferente)
        await Classroom.findOneAndUpdate(
          { serie: user.turma },
          { $push: { roomInventory: normalizedItem } }
        );
      } else {
        if (item.category === "BUFF") {
          updateOps.$push.activeBuffs = {
            effect: item.itemId.toString(),
            name: item.name,
            source: `Missão: ${quest.title}`,
            expiresAt: expirationDate,
          };
        } else {
          updateOps.$push.inventory = normalizedItem;
        }
      }
    }
  }

  // Remove campos vazios
  if (updateOps.$inc && Object.keys(updateOps.$inc).length === 0) delete updateOps.$inc;
  if (updateOps.$addToSet && Object.keys(updateOps.$addToSet).length === 0) delete updateOps.$addToSet;
  if (updateOps.$push && Object.keys(updateOps.$push).length === 0) delete updateOps.$push;

  return updateOps;
}

module.exports = { deliverQuestRewards };

