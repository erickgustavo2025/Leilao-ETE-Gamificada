export const formatRole = (role: string) => {
    const roles: Record<string, string> = {
        'student': 'Estudante',
        'monitor': 'Monitor',
        'admin': 'Admin',
        'dev': 'Desenvolvedor'
    };
    return roles[role] || role;
};

export const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }).replace('R$', 'PC$');
};