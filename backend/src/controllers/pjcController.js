// backend/src/controllers/pjcController.js
const pjcDataService = require('../services/PJCDataService');

/**
 * Exporta dados anonimizados para o artigo científico (PJC)
 */
exports.exportPJCData = async (req, res) => {
    try {
        const { disciplinaId } = req.params;
        const { turma, ano } = req.query; // Filtros opcionais
        
        if (!disciplinaId) return res.status(400).json({ error: "Disciplina ID é obrigatório." });

        const data = await pjcDataService.exportScientificData(disciplinaId, { turma, ano });
        
        res.json({
            success: true,
            totalRows: data.length,
            filters: { turma, ano },
            dataset: data
        });
    } catch (error) {
        console.error("❌ Erro ao exportar dados PJC:", error.message);
        res.status(500).json({ error: "Falha na exportação dos dados científicos." });
    }
};

/**
 * Retorna o mapa de lacunas (Gaps) pedagógicos da turma
 */
exports.getPedagogicalGaps = async (req, res) => {
    try {
        const { disciplinaId } = req.params;
        const { turma } = req.query;

        if (!disciplinaId) return res.status(400).json({ error: "Disciplina ID é obrigatório." });

        const analysis = await pjcDataService.generateGapAnalysis(disciplinaId, { turma });
        
        res.json({
            success: true,
            ...analysis
        });
    } catch (error) {
        console.error("❌ Erro ao buscar gaps:", error.message);
        res.status(500).json({ error: "Erro ao processar análise pedagógica." });
    }
};
