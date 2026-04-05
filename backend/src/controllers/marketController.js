const User = require('../models/User');
const Item = require('../models/Item');
const StoreItem = require('../models/StoreItem');
const MarketListing = require('../models/MarketListing');
const Classroom = require('../models/Classroom');
const Log = require('../models/Log');
const mongoose = require('mongoose');

const GOBLIN_TAX_RATE = 0.10;
const LIMITS = { '1': 400, '2': 800, '3': 1200 };

module.exports = {
    // 📢 1. ANUNCIAR (Busca Universal Super Inteligente)
    async createListing(req, res) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            // Ignoramos a flag isHouseItem do Frontend porque ela pode estar corrompida.
            const { itemId, price } = req.body; 
            const userId = req.user.id;

            const user = await User.findById(userId).session(session);
            let slot = null;
            let ownerContainer = null;
            let isItemFromHouse = false; // Descobriremos a verdade aqui

            // 1. TENTA ACHAR NA MOCHILA PESSOAL PRIMEIRO
            let itemIndex = user.inventory.findIndex(s => 
                (s._id && s._id.toString() === itemId) || 
                (s.itemId && s.itemId.toString() === itemId)
            );

            if (itemIndex !== -1) {
                // Achou na mochila pessoal!
                slot = user.inventory[itemIndex];
                ownerContainer = user;
                isItemFromHouse = false;
                
                if (slot.quantity > 1) {
                    slot.quantity -= 1;
                } else {
                    user.inventory.splice(itemIndex, 1);
                }
            } 
            else {
                // 2. NÃO ACHOU NA PESSOAL? PROCURA NO BECO DIAGONAL (SALA)!
                const classroom = await Classroom.findOne({ serie: user.turma }).session(session);
                
                if (classroom && classroom.roomInventory) {
                    itemIndex = classroom.roomInventory.findIndex(i => {
                        const slotId = i._id ? i._id.toString() : '';
                        const baseId = i.itemId ? i.itemId.toString() : '';
                        
                        // Verifica os dois nomes possíveis de dono no banco
                        const ownerIdStr = (i.acquiredBy?.toString()) || (i.adquiridoPor?.toString()) || '';
                        
                        return (slotId === itemId || baseId === itemId) && (ownerIdStr === userId.toString());
                    });

                    if (itemIndex !== -1) {
                        // Achou na Sala e ele é o dono!
                        slot = classroom.roomInventory[itemIndex];
                        ownerContainer = classroom;
                        isItemFromHouse = true; // Confirma que é da Casa
                        
                        // Trata os dois nomes de quantidade pra não dar BO
                        if (slot.quantidade > 1) {
                            slot.quantidade -= 1;
                        } else if (slot.quantity > 1) {
                            slot.quantity -= 1;
                        } else {
                            classroom.roomInventory.splice(itemIndex, 1);
                        }
                    }
                }
            }

            // 3. SE NÃO ACHOU EM LUGAR NENHUM, ESTOURA O ERRO
            if (!slot) {
                throw new Error("Item não encontrado. Ou ele não está na mochila/sala, ou você não é o dono dele.");
            }

            // Pega o ID Real do Produto para buscar o Preço Base original
            const refId = slot.itemId?._id || slot.itemId || slot._id; 
            let originalItem = null;
            if (refId) {
                originalItem = await StoreItem.findById(refId).session(session);
                if (!originalItem) originalItem = await Item.findById(refId).session(session);
            }

            const basePrice = originalItem?.preco || originalItem?.lanceMinimo || slot.basePrice || slot.preco || 0;
            const isOverpriced = basePrice > 0 && price > (basePrice * 2);

            // Cria anúncio com as informações perfeitas
            const listing = await MarketListing.create([{
                seller: userId,
                itemData: {
                    itemId: refId,
                    name: slot.name || slot.nome,
                    descricao: slot.description || slot.descricao || "",
                    imagem: slot.image || slot.imagem,
                    raridade: slot.raridade || slot.rarity || "Comum",
                    isHouseItem: isItemFromHouse, // 🔥 SALVAMOS A ORIGEM REAL DESCOBERTA PELO BACKEND
                    basePrice: basePrice,
                    expiresAt: slot.expiresAt,
                    category: slot.category || 'CONSUMIVEL' 
                },
                price: parseInt(price),
                isOverpriced,
                status: 'ACTIVE'
            }], { session });

            // Salva a mochila ou a sala (quem for o dono)
            await ownerContainer.save({ session }); 

            await session.commitTransaction();
            res.status(201).json({ message: "Anunciado com sucesso!", listing: listing[0] });

        } catch (error) {
            await session.abortTransaction();
            console.error("[Market Error]", error.message);
            res.status(400).json({ message: error.message });
        } finally {
            session.endSession();
        }
    },

   // 🛍️ 2. COMPRAR (Sem bloqueio de limite de transferência)
    async buyItem(req, res) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const { listingId } = req.body;
            const buyerId = req.user.id;

            const listing = await MarketListing.findById(listingId).session(session);
            if (!listing || listing.status !== 'ACTIVE') throw new Error("Anúncio indisponível.");
            if (listing.seller.toString() === buyerId) throw new Error("Você não pode comprar seu item.");

            const buyer = await User.findById(buyerId).session(session);
            const seller = await User.findById(listing.seller).session(session);

            if (buyer.saldoPc < listing.price) throw new Error("Saldo insuficiente.");

            const tax = Math.floor(listing.price * GOBLIN_TAX_RATE);
            const sellerReceive = listing.price - tax;

            // 🔥 AQUI ESTAVA O LIMITE ANUAL: FOI REMOVIDO! 
            // O comércio não tem limite, ele só adiciona o dinheiro na conta do vendedor.
            
            buyer.saldoPc -= listing.price;
            seller.saldoPc += sellerReceive;
            
            // Nós podemos (opcionalmente) registrar o lucro no 'receivedThisYear' pra fins estatísticos,
            // mas NÃO usamos isso pra bloquear a compra, porque é comércio.
            if (!seller.financialLimits) seller.financialLimits = { receivedThisYear: 0, lastResetYear: new Date().getFullYear() };
            seller.financialLimits.receivedThisYear += sellerReceive;

            // Entrega o item (Verifica se é House Item para mandar para o Beco Diagonal)
            let realItem = await StoreItem.findById(listing.itemData.itemId).session(session) || await Item.findById(listing.itemData.itemId).session(session);
            let finalExpiresAt = listing.itemData.expiresAt;

            if (!finalExpiresAt && realItem && realItem.validadeDias) {
                finalExpiresAt = new Date();
                finalExpiresAt.setDate(finalExpiresAt.getDate() + realItem.validadeDias);
            }

            if (listing.itemData.isHouseItem) {
                const buyerClassroom = await Classroom.findOne({ serie: buyer.turma }).session(session);
                if (buyerClassroom) {
                    if (!buyerClassroom.roomInventory) buyerClassroom.roomInventory = [];
                    
                    const newRoomSlot = {
                        itemId: listing.itemData.itemId,
                        name: listing.itemData.name || realItem?.nome,
                        image: listing.itemData.imagem || realItem?.imagem, // INGLÊS
                        description: listing.itemData.descricao || realItem?.descricao, // INGLÊS
                        category: listing.itemData.category || 'CONSUMIVEL',
                        rarity: listing.itemData.raridade || realItem?.raridade || 'Comum',
                        quantity: 1, // INGLÊS
                        acquiredBy: buyerId, // INGLÊS
                        acquiredAt: new Date(), // INGLÊS
                        origin: 'MARKETPLACE'
                    };

                    if (finalExpiresAt) newRoomSlot.expiresAt = finalExpiresAt;

                    buyerClassroom.roomInventory.push(newRoomSlot);
                    await buyerClassroom.save({ session });
                }
            } else {
                // Vai pra mochila pessoal normal
                const newPersonalSlot = {
                    itemId: listing.itemData.itemId,
                    name: listing.itemData.name || realItem?.nome,
                    descricao: listing.itemData.descricao || realItem?.descricao, // PORTUGUÊS
                    imagem: listing.itemData.imagem || realItem?.imagem, // PORTUGUÊS
                    raridade: listing.itemData.raridade || realItem?.raridade || 'Comum',
                    basePrice: listing.itemData.basePrice || realItem?.preco || 0,
                    category: listing.itemData.category || 'CONSUMIVEL',
                    quantity: 1,
                    origin: 'marketplace',
                    acquiredAt: new Date()
                };

                if (finalExpiresAt) newPersonalSlot.expiresAt = finalExpiresAt;

                buyer.inventory.push(newPersonalSlot);
            }

            listing.status = 'SOLD';
            listing.buyer = buyerId;
            listing.soldAt = new Date();
            listing.taxPaid = tax;

            await buyer.save({ session });
            await seller.save({ session });
            await listing.save({ session });

            await Log.create([{
                user: buyerId,
                action: 'MARKET_BUY',
                details: `Comprou ${listing.itemData.name}`,
                target: listing.seller,
                ip: req.ip
            }], { session });

            await session.commitTransaction();
            res.json({ message: "Compra realizada!", novoSaldo: buyer.saldoPc });

        } catch (error) {
            await session.abortTransaction();
            res.status(400).json({ message: error.message });
        } finally {
            session.endSession();
        }
    },
    
    // ❌ 3. CANCELAR 
    async cancelListing(req, res) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const listing = await MarketListing.findOne({ _id: id, seller: userId, status: 'ACTIVE' }).session(session);
            if (!listing) throw new Error("Anúncio não encontrado.");

            // Retorna o item completo (Blindado pra Sala e Pessoal)
            if (listing.itemData.isHouseItem) {
                const user = await User.findById(userId).session(session);
                const classroom = await Classroom.findOne({ serie: user.turma }).session(session);
                if (classroom) {
                    if (!classroom.roomInventory) classroom.roomInventory = [];
                    classroom.roomInventory.push({
                        itemId: listing.itemData.itemId,
                        nome: listing.itemData.name,
                        name: listing.itemData.name,
                        image: listing.itemData.imagem,
                        imagem: listing.itemData.imagem,
                        description: listing.itemData.descricao,
                        descricao: listing.itemData.descricao,
                        category: listing.itemData.category || 'CONSUMIVEL',
                        quantity: 1,
                        quantidade: 1,
                        expiresAt: listing.itemData.expiresAt,
                        acquiredAt: new Date(),
                        adicionadoEm: new Date(),
                        origin: 'MARKETPLACE',
                        acquiredBy: userId,
                        adquiridoPor: userId
                    });
                    await classroom.save({ session });
                }
            } else {
                const user = await User.findById(userId).session(session);
                user.inventory.push({
                    itemId: listing.itemData.itemId,
                    name: listing.itemData.name,
                    descricao: listing.itemData.descricao,
                    imagem: listing.itemData.imagem,
                    image: listing.itemData.imagem,
                    raridade: listing.itemData.raridade || 'Comum',
                    basePrice: listing.itemData.basePrice,
                    category: listing.itemData.category || 'CONSUMIVEL',
                    quantity: 1,
                    expiresAt: listing.itemData.expiresAt,
                    acquiredAt: new Date(),
                    origin: 'marketplace'
                });
                await user.save({ session });
            }

            listing.status = 'CANCELLED';
            await listing.save({ session });
            
            await session.commitTransaction();
            res.json({ message: "Anúncio cancelado e item devolvido intacto." });

        } catch (e) {
            await session.abortTransaction();
            res.status(400).json({ message: e.message });
        } finally {
            session.endSession();
        }
    },

    async getListings(req, res) {
        try {
            const listings = await MarketListing.find({ status: 'ACTIVE' })
                .populate('seller', 'nome turma')
                .sort({ createdAt: -1 })
                .limit(50);
            res.json(listings);
        } catch (e) { res.status(500).json({ error: "Erro ao listar." }) }
    },

    async getMyListings(req, res) {
        try {
            const listings = await MarketListing.find({ seller: req.user.id, status: 'ACTIVE' })
                .sort({ createdAt: -1 });
            res.json(listings);
        } catch (error) { res.status(500).json({ message: "Erro." }); }
    }
};