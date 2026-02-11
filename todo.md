# Vibe Coding 1.0 - Admin Panel TODO

## Funcionalidades Obrigatórias

### Autenticação e Permissões
- [x] Sistema de autenticação exclusivo para administradores
- [x] Controle de permissões por role (admin/user)
- [x] Rota protegida /admin com redirecionamento
- [x] Logout seguro com limpeza de sessão

### Dashboard Principal
- [x] Dashboard com métricas e visão geral
- [x] Contador de usuários ativos
- [x] Contador de cursos publicados
- [x] Contador de aulas criadas
- [x] Gráfico de progresso geral da plataforma
- [x] Atividades recentes

### Gerenciamento de Cursos
- [x] CRUD completo de cursos
- [x] Campos: título, descrição, instrutor, categoria, status de publicação
- [x] Listagem com filtros e busca
- [x] Criação de novo curso
- [x] Edição de curso existente
- [x] Exclusão de curso
- [x] Publicação/Despublicação de curso

### Gerenciamento de Aulas
- [x] CRUD completo de aulas
- [x] Vinculação de aulas a cursos
- [x] Controle de liberação por data/hora programada
- [x] Listagem de aulas por curso
- [x] Criação de nova aula
- [x] Edição de aula
- [x] Exclusão de aula
- [x] Agendamento de liberação

### Materiais de Apoio
- [x] CRUD completo de materiais
- [x] Associação a aulas específicas
- [x] Upload para S3 (PDFs, vídeos, links)
- [x] Listagem de materiais por aula
- [x] Criação de novo material
- [x] Edição de material
- [x] Exclusão de material
- [x] Visualização de URL do material

### Gerenciamento de Usuários
- [x] Visualização de perfil do usuário
- [x] Histórico de aulas concluídas
- [x] Progresso em cursos
- [x] Controle de acesso à plataforma
- [x] Listagem de usuários com filtros
- [x] Busca de usuários
- [x] Visualização de detalhes do usuário
- [x] Edição de permissões de usuário

### Sessões ao Vivo
- [x] Criação de sessões ao vivo
- [x] Agendamento de data/hora
- [x] Controle de status (agendada/ao vivo/finalizada)
- [x] Link de transmissão
- [x] Listagem de sessões
- [x] Edição de sessão
- [x] Exclusão de sessão
- [x] Histórico de sessões

### Moderação de Comunidade
- [x] Visualização de posts
- [x] Visualização de comentários
- [x] Sistema de denúncias
- [x] Ações de moderação (aprovar/remover/banir)
- [x] Listagem de posts com filtros
- [x] Listagem de comentários
- [x] Listagem de denúncias
- [x] Histórico de ações de moderação

### Ferramentas da Plataforma
- [x] Gerenciamento de IDE online
- [x] Gerenciamento de compiladores
- [x] Gerenciamento de ambientes
- [x] Controle de disponibilidade
- [x] Listagem de ferramentas
- [x] Criação de ferramenta
- [x] Edição de ferramenta
- [x] Exclusão de ferramenta

### Sistema de Permissões
- [x] Permissões granulares por tipo de usuário
- [x] Controle de acesso a funcionalidades específicas
- [x] Definição de roles customizados
- [x] Atribuição de permissões a usuários
- [x] Listagem de permissões
- [x] Edição de permissões
- [x] Auditoria de permissões

### Interface e Layout
- [x] Layout com sidebar responsivo
- [x] Menu de navegação elegante
- [x] Tema visual elegante e perfeito
- [x] Responsividade em dispositivos móveis
- [x] Componentes reutilizáveis
- [x] Paleta de cores consistente
- [x] Tipografia profissional

### Testes e Documentação
- [x] Testes unitários com Vitest
- [x] Documentação de estrutura de pastas
- [x] Documentação de modelos de dados
- [x] Documentação de fluxo de navegação
- [x] Documentação de boas práticas de segurança
- [x] Guia de uso do painel admin


## Melhorias Recentes

### Filtros e Busca Avançada de Usuários
- [x] Implementar filtros por role (admin/user)
- [x] Implementar filtros por status (ativo/inativo)
- [x] Implementar filtros por data de criação (range)
- [x] Implementar filtros por progresso (range)
- [x] Implementar busca por nome e email
- [x] Implementar ordenação por múltiplas colunas
- [x] Criar componente de filtros reutilizável
- [x] Adicionar botão de limpar filtros
- [x] Salvar filtros em localStorage
- [x] Implementar testes de filtros


### Ajustes de Navegação
- [ ] Remover landing page
- [ ] Deixar apenas página de login como inicial
- [ ] Redirecionar usuários autenticados para o painel admin
