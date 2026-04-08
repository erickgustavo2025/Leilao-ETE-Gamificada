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

// Middleware para IMAGENS (Processa para WebP)
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

// Middleware para DOCUMENTOS (PDF, DOC, Imagens) para MISSÕES
const uploadDocument = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, 'DOC-' + uniqueSuffix + path.extname(file.originalname).toLowerCase());
        }
    }),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB para documentos
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        // Aceita mimetype de PDF ou se estiver na lista de imagens
        const isPdf = file.mimetype === 'application/pdf';
        const isDoc = file.mimetype === 'application/msword' || file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        
        if (extname || isPdf || isDoc) return cb(null, true);
        cb(new Error('Apenas Imagens, PDF ou DOC/DOCX são permitidos.'));
    }
});

// Middleware mágico que converte para WEBP (Apenas para o upload de imagem padrão)
const processImageToWebp = async (req, res, next) => {
    if (!req.file) return next();
    // Se não for imagem (ex: PDF no uploadDocument), não processa com Sharp
    if (!req.file.mimetype.startsWith('image/')) return next();

    try {
        const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}.webp`;
        const filepath = path.join(uploadDir, filename);

        await sharp(req.file.buffer)
            .webp({ quality: 80 })
            .toFile(filepath);

        req.file.filename = filename;
        req.file.path = filepath;
        
        next();
    } catch (error) {
        console.error('Erro ao converter imagem para WEBP:', error);
        next(); // Continua mesmo se der erro, o multer.diskStorage no uploadDocument já salvou
    }
};

module.exports = { upload, processImageToWebp, uploadDocument };