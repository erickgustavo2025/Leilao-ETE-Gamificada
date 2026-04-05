const { z } = require('zod');
const mongoose = require('mongoose');

// Helper para validar ID do MongoDB
const objectIdSchema = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "ID inválido.",
});

const schemas = {
    // 🔐 AUTENTICAÇÃO
    auth: {
        login: z.object({
            body: z.object({
                matricula: z.string().min(3, "Matrícula é obrigatória"),
                senha: z.string().min(1, "Senha é obrigatória")
            })
        }),
        firstAccess: z.object({
            body: z.object({
                matricula: z.string().min(3),
                dataNascimento: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, "Formato deve ser DD/MM/AAAA")
            })
        }),
        register: z.object({
            body: z.object({
                id: objectIdSchema,
                email: z.string().email("Email inválido"),
                senha: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
                nickname: z.string().optional()
            })
        }),
        changePassword: z.object({
            body: z.object({
                senhaAtual: z.string().min(1, "Senha atual é obrigatória"),
                novaSenha: z.string().min(6, "Nova senha deve ter no mínimo 6 caracteres")
            })
        }),
        changeEmail: z.object({
            body: z.object({
                senha: z.string().min(1, "Senha é obrigatória"),
                novoEmail: z.string().email("Email inválido")
            })
        })
    },

    // 💰 LEILÃO (Ajustado para Middleware Unificado)
    auction: {
        bid: z.object({
            // O middleware envia params e body separadamente para o Zod
            params: z.object({
                id: objectIdSchema
            }),
            body: z.object({
                // Aceita 'valor' ou 'bidValue' e garante conversão para número
                valor: z.preprocess((val) => Number(val), z.number().positive("O lance deve ser positivo")).optional(),
                bidValue: z.preprocess((val) => Number(val), z.number().positive("O lance deve ser positivo")).optional(),
                // ID do Arrematador (opcional)
                useItemId: z.string().nullable().optional()
            }).refine(data => data.valor || data.bidValue, {
                message: "O valor do lance é obrigatório"
            })
        }),
        createItem: z.object({
            body: z.object({
                titulo: z.string().min(3),
                descricao: z.string().min(5),
                lanceMinimo: z.coerce.number().min(1),
                dataFim: z.coerce.date({
                    errorMap: () => ({ message: "Data inválida" })
                }),
                validadeDias: z.coerce.number().min(0).default(0),
                seriesPermitidas: z.string().optional(), // Vem como string JSON do FormData
                rankMinimo: z.string().optional(),
                // 🔥 Blindagem absoluta para o Checkbox do Admin (FormData envia 'true' como string)
                isHouseItem: z.preprocess((val) => val === 'true' || val === true, z.boolean()).optional(),
                originalItemId: z.string().optional()
            })
        })
    },

    inventory: {
        giveItem: z.object({
            body: z.object({
                studentId: objectIdSchema,
                itemId: objectIdSchema,
                quantity: z.coerce.number().int().positive().default(1)
            })
        }),
        transfer: z.object({
            body: z.object({
                targetMatricula: z.string().min(3), // Ajustei para bater com o frontend (targetMatricula vs destinatario)
                amount: z.coerce.number().int().positive(),
                password: z.string().min(1)
            })
        })
    },

    // 🛒 LOJA
    store: {
        buy: z.object({
            params: z.object({
                id: objectIdSchema
            })
        }),
        createItem: z.object({
            body: z.object({
                nome: z.string().min(3),
                descricao: z.string().min(5),
                preco: z.coerce.number().min(1),
                estoque: z.coerce.number().int().min(0),
                raridade: z.enum(['Comum', 'Raro', 'Épico', 'Lendário', 'Evento']),
                cargoExclusivo: z.string().optional(),
                validadeDias: z.coerce.number().min(0).optional()
            })
        }),
        updateItem: z.object({
            params: z.object({ id: objectIdSchema }),
            body: z.object({
                nome: z.string().min(3).optional(),
                preco: z.coerce.number().min(0).optional(),
                estoque: z.coerce.number().int().min(0).optional(),
                ativo: z.boolean().optional()
            })
        })
    },

    // 🎫 TICKETS (CORRIGIDO AQUI)
    tickets: {
        useItem: z.object({
            body: z.object({
                itemId: z.string().min(1, "ID do item necessário") // Aceita ID do Mongo ou string legada
            })
        }),
        validate: z.object({
            body: z.object({
                // 👇 AQUI ESTAVA O ERRO: Mudei de .length(6) para .min(6)
                // O novo gerador cria hash de 8 chars. O antigo criava 6.
                // .min(6) aceita ambos e evita erro de validação.
                hash: z.string().min(6, "Hash inválido (curto)")
            })
        })
    },

    // 🛒 MERCADO (Novas Regras)
    market: {
        sell: z.object({
            body: z.object({
                itemId: z.string().min(1, "ID do item é obrigatório"), // Aceita ID do Mongo ou string legada
                price: z.coerce.number().int().positive("O preço deve ser um número inteiro positivo")
            })
        }),
        buy: z.object({
            body: z.object({
                listingId: z.string().min(1, "ID do anúncio é obrigatório")
            })
        })
    },

    // 🛡️ ADMIN
    admin: {
        givePoints: z.object({
            body: z.object({
                studentIds: z.array(objectIdSchema).nonempty("Selecione pelo menos um aluno"),
                amount: z.coerce.number().int("O valor deve ser inteiro"),
                action: z.enum(['add', 'remove']),
                description: z.string().min(3, "Motivo obrigatório")
            })
        }),
        updateProfile: z.object({
            body: z.object({
                id: objectIdSchema,
                nome: z.string().min(3).optional(),
                turma: z.string().optional()
            })
        })
    },

    user: {
        block: z.object({
            body: z.object({
                studentId: objectIdSchema.optional(),
                userId: objectIdSchema.optional(),
                reason: z.string().min(5).optional()
            }).refine(data => data.studentId || data.userId, {
                message: "Deve fornecer studentId ou userId"
            })
        })
    },

    // 📈 INVESTIMENTOS
    investments: z.object({
        body: z.object({
            symbol: z.string().min(1, "Símbolo do ativo é obrigatório"),
            quantity: z.coerce.number().int().positive("A quantidade deve ser um número inteiro positivo")
        })
    }),

    // 🏢 STARTUPS
    startupCreate: z.object({
        body: z.object({
            nome: z.string().min(3, "Nome da empresa deve ter no mínimo 3 caracteres"),
            tag: z.string().min(3, "Ticker deve ter no mínimo 3 caracteres").max(6, "Ticker deve ter no máximo 6 caracteres"),
            descricao: z.string().min(10, "Descrição deve ter no mínimo 10 caracteres"),
            valuationInicial: z.coerce.number().positive("Valuation deve ser um número positivo"),
            totalAcoes: z.coerce.number().int().min(1, "Total de ações deve ser no mínimo 1")
        })
    })
};

module.exports = schemas;