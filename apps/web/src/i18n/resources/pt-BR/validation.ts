const validation = {
        required: "Este campo é obrigatório.", invalidEmail: "Digite um endereço de e-mail válido.", invalidUrl: "Digite uma URL válida.",
        usernameFormat: "O nome de usuário deve ter de 3 a 32 caracteres: letras minúsculas, números e _.", passwordMin: "A senha deve ter pelo menos 8 caracteres.",
        imagesHttp: "As imagens precisam usar um endereço HTTP ou HTTPS.", minLength: "Digite pelo menos {{count}} caracteres.", maxLength: "Use no máximo {{count}} caracteres.", invalidUuid: "Escolha uma opção válida.", projectKeyFormat: "Use de 2 a 8 letras maiúsculas ou números.", hexColor: "Digite uma cor hexadecimal válida, como #7f56d9.", documentContentSize: "Esta página pode ter no máximo 100.000 caracteres.",
    } as const;

export default validation;
