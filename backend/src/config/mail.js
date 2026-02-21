const nodemailer = require('nodemailer');

// Cria o transporter UMA VEZ só (Singleton Pattern implícito)
// Usamos pool: true para reaproveitar conexões e evitar handshakes repetidos
let transporter = null;

if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
        pool: true, // <--- O PULO DO GATO
        maxConnections: 1, // Gmail não gosta de muitas conexões simultâneas de contas free
        rateLimit: 5, // Apenas 5 emails por segundo (segurança)
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: false, // Geralmente false para porta 587 (STARTTLS)
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        },
        tls: {
            rejectUnauthorized: false
        }
    });
    
    // Verifica a conexão ao iniciar
    transporter.verify(function (error, success) {
        if (error) {
            console.error('❌ Erro na conexão SMTP:', error);
        } else {
            console.log('✅ Servidor SMTP pronto para enviar emails via Pool');
        }
    });
}

const sendMailHelper = async (to, subject, text, html) => {
    try {
        // Se não tiver config de email, apenas loga (Simulação em DEV)
        if (!transporter) {
            console.warn("⚠️ SMTP_HOST não configurado. Email simulado no console:");
            console.log(`[EMAIL MOCK] Para: ${to} | Assunto: ${subject}`);
            console.log(`[EMAIL MOCK] Link/Conteúdo: ${text}`);
            return;
        }

        const info = await transporter.sendMail({
            from: `"Equipe ETE Gamificada" <${process.env.SMTP_USER}>`,
            to: to,
            subject: subject,
            text: text, 
            html: html 
        });

        console.log(`📧 Email despachado para ${to}. ID: ${info.messageId}`);
    } catch (error) {
        console.error('Erro ao enviar email:', error);
        throw error; 
    }
};

module.exports = {
    async sendPasswordReset(email, token) {
        // URL do frontend
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const link = `${frontendUrl}/reset-password?token=${token}`;

        const subject = 'Recuperação de Senha - ETE Gamificada';
        const text = `Você solicitou a recuperação de senha. Use o link: ${link}`;
        const html = `
            <div style="font-family: 'Courier New', monospace; color: #333; background-color: #f4f4f5; padding: 20px; border-radius: 8px; border: 2px solid #000;">
                <h2 style="color: #4f46e5;">🔐 PROTOCOLO DE SEGURANÇA</h2>
                <p>Detectamos uma solicitação de reset de credenciais para sua conta.</p>
                <br/>
                <a href="${link}" style="background-color: #4f46e5; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; border: 2px solid #000; box-shadow: 4px 4px 0px #000; display: inline-block;">
                    REDEFINIR ACESSO
                </a>
                <br/><br/>
                <p style="font-size: 12px; color: #666;">Se não foi você, ignore. Este link se autodestruirá em 1 hora.</p>
                <hr style="border-top: 1px dashed #999;" />
                <p style="font-size: 10px;">Link direto: ${link}</p>
            </div>
        `;

        await sendMailHelper(email, subject, text, html);
    }
};