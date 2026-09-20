const errors = {
        notAuthenticated: "Você não está autenticado", invalidSession: "Sessão inválida ou expirada", invalidData: "Confira os campos destacados.",
        requestFailed: "Não foi possível concluir a solicitação.", internal: "Ocorreu um erro interno. Tente novamente.",
        tooLarge: "Este documento é grande demais para salvar. Divida o conteúdo em páginas menores.",
        projectNotFound: "Projeto não encontrado", issueNotFound: "Tarefa não encontrada", documentNotFound: "Documento não encontrado",
        notFound: "O item solicitado não foi encontrado.", accountFieldInUse: "Este campo ({{field}}) já está em uso.", requestLimit: "Muitas solicitações. Tente novamente mais tarde.",
        incorrectCredentials: "Usuário ou senha incorretos", invalidSpecialCode: "Código especial inválido", projectKeyInUse: "Este ID de projeto já está em uso",
        projectKeyLocked: "O ID do projeto não pode ser alterado depois da criação da primeira tarefa", membershipRequired: "Você não é membro deste projeto",
        permissionDenied: "Você não tem permissão para realizar esta ação.", conflict: "Este item foi atualizado em outro lugar. Atualize e tente novamente.",
        tooManyLoginAttempts: "Muitas tentativas de acesso. Tente novamente em alguns minutos.", tooManyRegistrationAttempts: "Muitas tentativas de cadastro. Tente novamente mais tarde.",
        saveConflict: "Esta página foi atualizada em outro lugar. Seu rascunho foi mantido.", issueDescriptionConflict: "A descrição desta tarefa foi atualizada em outro lugar. Seu rascunho foi mantido.", screenFailureTitle: "Algo deu errado", screenFailureDescription: "O Gikan não conseguiu abrir esta tela. Recarregue a página ou volte aos projetos.", goToProjects: "Ir para projetos", reloadPage: "Recarregar página", notFoundTitle: "404 · Não encontrado", pageMissing: "Esta página não existe.", pageMissingDescription: "O link pode estar desatualizado ou a página pode ter sido movida.", goHome: "Ir para o início",
    } as const;

export default errors;
