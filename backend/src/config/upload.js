const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// Garante que a pasta uploads existe
const uploadDir = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Usamos memoryStorage para o Sharp poder processar a imagem ANTES de salvar no HD
const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Limite de 5MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|webp|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) return cb(null, true);
        cb(new Error('Apenas imagens (jpeg, jpg, png, webp, gif) são permitidas!'));
    }
});

// Middleware mágico do CTO que converte para WEBP
const processImageToWebp = async (req, res, next) => {
    if (!req.file) return next();

    try {
        // Cria um nome único com a extensão .webp
        const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}.webp`;
        const filepath = path.join(uploadDir, filename);

        // O Sharp pega a imagem da memória, converte para webp (qualidade 80%) e salva no HD
        await sharp(req.file.buffer)
            .webp({ quality: 80 })
            .toFile(filepath);

        // Engana o req.file para o resto do sistema achar que o multer salvou normalmente
        req.file.filename = filename;
        req.file.path = filepath;
        
        next();
    } catch (error) {
        console.error('Erro ao converter imagem para WEBP:', error);
        next(error);
    }
};

module.exports = { upload, processImageToWebp };