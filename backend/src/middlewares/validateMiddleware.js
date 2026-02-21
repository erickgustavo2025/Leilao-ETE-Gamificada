const { z } = require('zod');

const validate = (schema) => (req, res, next) => {
    // 1. Blindagem: Protege contra erro de dev (esquecer o schema na rota)
    if (!schema) {
        console.error("❌ ERRO CRÍTICO: Rota sem Schema de validação!");
        return res.status(500).json({ error: 'Erro interno de configuração.' });
    }

    // 2. Validação Unificada
    const result = schema.safeParse({
        body: req.body,
        query: req.query,
        params: req.params,
    });

    // 3. Tratamento de Erro BLINDADO
    if (!result.success) {
        // 🔥 CORREÇÃO DO ERRO 'MAP UNDEFINED' 🔥
        // O Zod às vezes retorna 'issues' em vez de 'errors' dependendo da versão/contexto.
        // Adicionamos '|| []' para garantir que nunca tente fazer .map em null/undefined.
        const zodIssues = result.error.issues || result.error.errors || [];

        const errorMessages = zodIssues.map((err) => ({
            field: err.path.join('.').replace('body.', ''),
            message: err.message,
        }));

        console.log("⚠️ Falha de Validação:", JSON.stringify(errorMessages));

        return res.status(400).json({
            error: 'Dados inválidos',
            issues: errorMessages
        });
    }

    // 4. Sucesso: Injeta dados limpos
    req.body = result.data.body;
    req.query = result.data.query;
    req.params = result.data.params;

    next();
};

module.exports = validate;