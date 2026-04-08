## Requisitos Técnicos da Lei 15.211/2025 (ECA Digital) para a ETE Gamificada

Este documento consolida os principais requisitos técnicos extraídos da Lei nº 15.211, de 17 de setembro de 2025 (Estatuto Digital da Criança e do Adolescente), que são diretamente aplicáveis ao projeto ETE Gamificada. O objetivo é guiar o desenvolvimento e a auditoria de conformidade.

### Art. 3º - Proteção Prioritária e Melhor Interesse

> "Art. 3º Os produtos ou serviços de tecnologia da informação direcionados a crianças e a adolescentes ou de acesso provável por eles devem garantir a proteção prioritária desses usuários, ter como parâmetro o seu melhor interesse e contar com medidas adequadas e proporcionais para assegurar um nível elevado de privacidade, de proteção de dados e de segurança, nos termos definidos nas Leis nºs 8.069, de 13 de julho de 1990 (Estatuto da Criança e do Adolescente), e 13.709, de 14 de agosto de 2018 (Lei Geral de Proteção de Dados Pessoais)."

**Requisitos Técnicos:**
*   **Design by Default:** Todas as funcionalidades devem ser projetadas com a proteção de crianças e adolescentes como prioridade máxima.
*   **Privacidade por Design:** Implementação de medidas técnicas que garantam a privacidade e a proteção de dados pessoais desde a concepção do sistema (LGPD).
*   **Segurança por Design:** Uso de mecanismos de segurança robustos para proteger contra acessos indevidos, vazamentos de dados e outras vulnerabilidades.

### Art. 5º - Deveres de Prevenção, Proteção, Informação e Segurança

> "Art. 5º Os produtos ou serviços de tecnologia da informação direcionados a crianças e a adolescentes ou de acesso provável por eles deverão observar os deveres de prevenção, de proteção, de informação e de segurança previstos neste Capítulo e nas Leis nºs 8.078, de 11 de setembro de 1990 (Código de Defesa do Consumidor), e 8.069, de 13 de julho de 1990 (Estatuto da Criança e do Adolescente), em conformidade com o princípio do melhor interesse da criança e do adolescente e da sua proteção integral, especial e prioritária."

**Requisitos Técnicos:**
*   **Mecanismos de Segurança Adequados:** Implementar e manter mecanismos de segurança amplamente reconhecidos para prevenir acesso e uso inadequado.
*   **Proteção da Saúde Mental e Física:** O design da plataforma deve considerar o impacto na saúde mental e física dos usuários, evitando elementos que possam causar ansiedade, vício ou exposição a conteúdo prejudicial.

### Art. 10 - Mecanismos de Aferição de Idade

> "Art. 10. Os fornecedores de produtos ou serviços de tecnologia da informação direcionados a crianças e a adolescentes ou de acesso provável por eles deverão adotar mecanismos para proporcionar experiências adequadas à idade, nos termos deste Capítulo, respeitadas a autonomia progressiva e a diversidade de contextos socioeconômicos brasileiros."

**Requisitos Técnicos:**
*   **Verificação de Idade Robusta:** Implementar mecanismos confiáveis de verificação de idade que impeçam a simples autodeclaração, garantindo que a idade informada seja precisa.
*   **Experiências Adequadas à Idade:** O conteúdo e as funcionalidades devem ser adaptados à faixa etária dos usuários, com restrições apropriadas para crianças e adolescentes.

### Art. 17 - Ferramentas de Supervisão Parental

> "Art. 17. Os fornecedores de produtos ou serviços de tecnologia da informação direcionados a crianças e a adolescentes ou de acesso provável por eles deverão permitir aos pais e responsáveis legais:
> I – visualizar, configurar e gerenciar as opções de conta e privacidade da criança ou do adolescente;
> II – restringir compras e transações financeiras;
> III – identificar os perfis de adultos com os quais a criança ou o adolescente se comunica;
> IV – acessar métricas consolidadas do tempo total de uso do produto ou serviço;
> V – ativar ou desativar salvaguardas por meio de controles acessíveis e adequados;
> VI – dispor de informações e de opções de controle em língua portuguesa."

**Requisitos Técnicos:**
*   **Painel de Controle Parental:** Desenvolver um painel de controle robusto para pais/responsáveis com as seguintes funcionalidades:
    *   Gestão de privacidade e configurações de conta do menor.
    *   Restrição de transações financeiras (PC$ e itens).
    *   Visualização de contatos e interações (se aplicável ao chat).
    *   Métricas de tempo de uso.
    *   Ativação/desativação de salvaguardas (ex: filtros de conteúdo).
*   **Interface Intuitiva:** As ferramentas devem ser de fácil acesso e compreensão, em português.

### Art. 20 - Vedação de Caixas de Recompensa (Loot Boxes)

> "Art. 20. São vedadas as caixas de recompensa (loot boxes) oferecidas em jogos eletrônicos direcionados a crianças e a adolescentes ou de acesso provável por eles, nos termos da respectiva classificação indicativa, que incluam funcionalidades de interação entre usuários por meio de mensagens de texto, áudio ou vídeo ou troca de conteúdos, de forma síncrona ou assíncrona, deverão observar integralmente as salvaguardas previstas no art. 16 da Lei nº 14.852, de 3 de maio de 2024, especialmente no que se refere à moderação de conteúdos, à proteção contra preconceitos e à atuação parental sobre os mecanismos de comunicação."

**Requisitos Técnicos:**
*   **Proibição de Mecanismos Aleatórios Pagos:** O sistema de recompensas (PC$, itens) não pode envolver elementos de aleatoriedade que possam ser adquiridos com dinheiro real ou moeda virtual com valor monetário real, configurando "loot boxes".
*   **Transparência nas Recompensas:** Todas as recompensas devem ser claras e previsíveis, sem elementos de surpresa ou "sorte" que incentivem o consumo compulsivo.

### Art. 26 - Proteção contra Exploração Comercial e Perfilamento

> "Art. 26. É vedada a criação de perfis comportamentais de usuários crianças e adolescentes a partir da coleta e do tratamento de seus dados pessoais, inclusive daqueles obtidos nos processos de verificação de idade, bem como de dados grupais e coletivos, para fins de direcionamento de publicidade comercial."

**Requisitos Técnicos:**
*   **Anonimização/Pseudonimização:** Dados coletados para o estudo científico (`AIInteraction`) devem ser anonimizados ou pseudonimizados para evitar o perfilamento individual para fins comerciais.
*   **Restrição de Publicidade:** O sistema não deve usar dados de comportamento ou perfil para direcionar publicidade comercial a crianças e adolescentes.

### Art. 27 - Prevenção e Combate a Violações Graves

> "Art. 27. Os fornecedores de produtos ou serviços de tecnologia da informação disponíveis no território nacional deverão remover e comunicar os conteúdos de aparente exploração, de abuso sexual, de sequestro e de aliciamento detectados em seus produtos ou serviços, direta ou indiretamente, às autoridades nacionais e internacionais competentes, na forma de regulamento."

**Requisitos Técnicos:**
*   **Mecanismos de Denúncia:** Implementar ferramentas de denúncia de conteúdo impróprio ou ilegal.
*   **Monitoramento de Conteúdo:** Desenvolver ou integrar sistemas de monitoramento de conteúdo (especialmente em chats) para identificar e remover proativamente violações graves.
*   **Comunicação com Autoridades:** Estabelecer um protocolo para comunicação rápida e eficaz com as autoridades competentes em caso de detecção de violações.
