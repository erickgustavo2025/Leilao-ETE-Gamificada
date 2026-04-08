const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 30000, // 30 segundos
            connectTimeoutMS: 30000,
            socketTimeoutMS: 45000, // Tempo de vida do socket
        });
        console.log('✓ Banco de Dados Conectado');
    } catch (error) {
        console.error(`Erro ao conectar no MongoDB: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;