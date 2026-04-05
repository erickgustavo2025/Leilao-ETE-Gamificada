const mongoose = require('mongoose');

const PriceCacheSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true,
    unique: true, // Garante que cada ativo tenha apenas uma entrada de cache
    trim: true,
    uppercase: true,
  },
  shortName: {
    type: String,
    required: true,
    trim: true,
  },
  longName: {
    type: String,
    required: true,
    trim: true,
  },
  currency: {
    type: String,
    required: true,
    enum: ['BRL', 'USD'], // Moedas suportadas
  },
  regularMarketPrice: {
    type: Number,
    required: true,
    min: 0, // Preço não pode ser negativo
  },
  regularMarketChange: {
    type: Number,
    required: true,
  },
  regularMarketChangePercent: {
    type: Number,
    required: true,
  },
  regularMarketTime: {
    type: Date,
    required: true,
  },
  marketCap: {
    type: Number,
    min: 0,
    default: 0,
  },
  logourl: {
    type: String,
    trim: true,
    default: null,
  },
  assetType: {
    type: String,
    required: true,
    enum: ['STOCK', 'CRYPTO'], // Tipo de ativo
  },
}, { timestamps: true }); // Adiciona createdAt e updatedAt automaticamente

// Índices para otimização de consulta
// O índice único em 'symbol' já é criado pelo unique: true no schema.
PriceCacheSchema.index({ assetType: 1 });

module.exports = mongoose.model('PriceCache', PriceCacheSchema);
