const validation = {
        required: "This field is required.", invalidEmail: "Enter a valid email address.", invalidUrl: "Enter a valid URL.",
        usernameFormat: "Username must be 3–32 characters: lowercase letters, numbers, and _.", passwordMin: "Password must be at least 8 characters.",
        imagesHttp: "Images require an HTTP or HTTPS URL.", minLength: "Enter at least {{count}} characters.", maxLength: "Use no more than {{count}} characters.", invalidUuid: "Choose a valid option.", projectKeyFormat: "Use 2–8 uppercase letters or numbers.", hexColor: "Enter a valid hex color, such as #7f56d9.", documentContentSize: "This page can contain at most 100,000 characters.",
    } as const;

export default validation;
