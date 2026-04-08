// scripts/seedSurvey.js
const mongoose = require('mongoose');
require('dotenv').config();
const Survey = require('../models/Survey');

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/etegamificada";

const initialSurvey = {
    title: "Pesquisa Acadêmica Jovem Cientista 2026",
    description: "Sua participação é vital para comprovar o impacto da gamificação e da IA no ensino técnico. Ajude-nos a construir o futuro da ETE!",
    rewardAmount: 100,
    isActive: true,
    questions: [
        { id: "q1", text: "Quantas vezes por semana você acessa a ETE Gamificada?", type: "multiple_choice", options: ["1-2 vezes", "3-5 vezes", "Todos os dias"] },
        { id: "q2", text: "De 0 a 10, o quanto o Oráculo GIL te ajuda a entender matérias que você tinha dificuldade?", type: "rating" },
        { id: "q3", text: "Você sentiu uma melhora nas suas notas reais após começar a usar o sistema?", type: "multiple_choice", options: ["Sim, muito", "Um pouco", "Não notei diferença"] },
        { id: "q4", text: "O sistema de Economia (PC$) te fez ter mais interesse em poupar ou investir dinheiro na vida real?", type: "multiple_choice", options: ["Sim, muito", "Um pouco", "Não"] },
        { id: "q5", text: "O uso do Oráculo GIL ajudou você a identificar quais são as suas maiores dificuldades em matérias técnicas (DS/ADM)?", type: "boolean" },
        { id: "q6", text: "A disputa pela 'Taça das Casas' e a interação no 'Beco Diagonal' fizeram você se sentir mais conectado com os colegas?", type: "boolean" },
        { id: "q7", text: "Qual seu objetivo principal ao usar o Oráculo: entender o passo a passo ou apenas a resposta final?", type: "multiple_choice", options: ["Entender o passo a passo", "Apenas a resposta final", "Ambos"] },
        { id: "q8", text: "Saber que você pode comprar pontos de nota com PC$ te motiva a fazer mais missões?", type: "multiple_choice", options: ["Sim, muito", "Um pouco", "Não muda nada"] },
        { id: "q9", text: "Por qual dispositivo você mais acessa o site?", type: "multiple_choice", options: ["Celular", "Computador da Escola", "Computador de Casa"] },
        { id: "q10", text: "Antes da ETE Gamificada, você costumava estudar fora do horário de aula por conta própria?", type: "multiple_choice", options: ["Nunca", "Raramente", "Às vezes", "Frequentemente"] },
        { id: "q11", text: "Você já usou o Oráculo GIL para revisar conteúdo de uma prova que estava chegando?", type: "boolean" },
        { id: "q12", text: "O Oráculo já te deu uma resposta que você achou errada ou confusa?", type: "multiple_choice", options: ["Sim", "Não", "Nunca percebi"] },
        { id: "q13", text: "Antes do sistema, você sabia o que era uma ação, um dividendo ou uma criptomoeda?", type: "multiple_choice", options: ["Não sabia nada", "Sabia de ouvir falar", "Entendia bem"] },
        { id: "q14", text: "O sistema de Ranks e PC$ já te fez sentir ansioso ou pressionado a performar melhor?", type: "multiple_choice", options: ["Nunca", "Às vezes", "Com frequência"] },
        { id: "q15", text: "Se a ETE Gamificada parasse de funcionar amanhã, você sentiria falta?", type: "multiple_choice", options: ["Muita falta", "Alguma falta", "Indiferente"] },
        { id: "q16", text: "Já perdeu PC$ em investimento ruim e pesquisou por que o ativo caiu?", type: "multiple_choice", options: ["Sim", "Não", "Nunca investi"] },
        { id: "q17", text: "Após usar as Startups, você já pensou em abrir um negócio próprio no futuro?", type: "multiple_choice", options: ["Sim, mais do que antes", "Já pensava antes", "Não"] },
        { id: "q18", text: "Acha que os professores deveriam usar mais o site para criar missões das aulas?", type: "multiple_choice", options: ["Sim, seria ótimo", "Tanto faz", "Prefiro separado"] },
        { id: "q19", text: "Você tem internet de boa qualidade em casa para acessar o site?", type: "multiple_choice", options: ["Sim", "Às vezes trava", "Só acesso na escola"] },
        { id: "q20", text: "Você já explicou como funciona alguma coisa do site para alguém de fora da escola?", type: "boolean" }
    ]
};

async function seed() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB...");
        
        // Desativa outras
        await Survey.updateMany({}, { isActive: false });
        
        // Cria a nova
        const survey = await Survey.create(initialSurvey);
        console.log("✅ Pesquisa Científica criada com sucesso! ID:", survey._id);
        
        process.exit(0);
    } catch (err) {
        console.error("❌ Erro no seed:", err);
        process.exit(1);
    }
}

seed();
