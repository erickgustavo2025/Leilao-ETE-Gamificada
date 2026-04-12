// backend/src/utils/itemHelper.js

/**
 * Normaliza um objeto de item para inserção nos inventários (Pessoal ou Sala).
 * Garante que ambos os campos em PT e EN existam para compatibilidade total.
 */
function normalizeInventoryItem(item, options = {}) {
    const {
        origin = 'SISTEMA',
        quantity = 1,
        acquiredBy = null,
        expiresAt = null,
        category = 'CONSUMIVEL'
    } = options;

    return {
        itemId: item._id,
        // Nomes
        name: item.nome || item.name,
        nome: item.nome || item.name,
        
        // Descrições
        description: item.descricao || item.description || '',
        descricao: item.descricao || item.description || '',
        
        // Imagens
        image: item.imagem || item.image || '',
        imagem: item.imagem || item.image || '',
        
        // Raridade
        rarity: item.raridade || item.rarity || 'Comum',
        raridade: item.raridade || item.rarity || 'Comum',
        
        // Metadados
        category: item.category || item.tipo || category,
        quantity: Number(quantity) || 1,
        quantidade: Number(quantity) || 1,
        origin: origin,
        acquiredAt: new Date(),
        expiresAt: expiresAt,
        acquiredBy: acquiredBy, // ID do aluno que conquistou (para roomInventory)
        
        // Flags
        isHouseItem: item.isHouseItem || false,
        isSkill: item.isSkill || false
    };
}

module.exports = { normalizeInventoryItem };
