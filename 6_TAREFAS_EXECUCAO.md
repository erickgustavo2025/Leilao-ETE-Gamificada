# ORDEM DE EXECUÇÃO: FASE 2

## ÉPICO 1: Backend - O Motor de Submissões
1. Crie o model `QuestSubmission.js` com o índice de trava única.
2. Refatore `requestManualValidation`. Remova a lógica de `activeQuests` e passe a criar o documento na nova coleção.
3. Crie `utils/questRewards.js` para unificar a entrega de recompensas. Use-a no Controller do Admin e do Aluno.

## ÉPICO 2: Frontend - A Experiência do Aluno
1. No `QuestBoard.tsx` (`ValidationModal`), para missões manuais, adicione um `<textarea>` limpo para "Link do Projeto, Drive ou Comentário".
2. Envie isso no payload como `submissionContent`.

## ÉPICO 3: Frontend - O Resgate e a Segurança do Admin
1. Envolva a página `AdminApprovals.tsx` dentro do `<AdminLayout>` (Você esqueceu na Fase 1!).
2. **Segurança XSS:** Ao renderizar o link enviado pelo aluno para o professor clicar, NUNCA use a string direta no `href`. Crie uma função `isValidUrl` (verificando http/https). Se for válido, renderize a tag `<a>` OBRIGATORIAMENTE com `target="_blank" rel="noopener noreferrer"`.

## ÉPICO 4: A Morte do F5 (Com Exceções Rigorosas)
1. Extermine o `window.location.reload()` do arquivo `Ranking.tsx` (linha 371) e substitua por `queryClient.invalidateQueries`.
2. **⚠️ ALERTA DE ARQUITETURA:** NÃO TOQUE nos reloads que estão dentro do `main.tsx` (eles tratam erro crítico de chunk do Vite) e NÃO TOQUE no `axios-config.ts` (eles tratam redirecionamentos de sessão). Deixe-os exatamente como estão.