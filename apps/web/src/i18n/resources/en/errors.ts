const errors = {
        notAuthenticated: "Not authenticated", invalidSession: "Invalid or expired session", invalidData: "Please check the highlighted fields.",
        requestFailed: "The request could not be completed.", internal: "An internal error occurred. Please try again.",
        tooLarge: "This document is too large to save. Split its content into smaller pages.",
        projectNotFound: "Project not found", issueNotFound: "Issue not found", documentNotFound: "Document not found",
        notFound: "The requested item could not be found.", accountFieldInUse: "This {{field}} is already in use.", requestLimit: "Too many requests. Please try again later.",
        incorrectCredentials: "Incorrect username or password", invalidSpecialCode: "Invalid special code", projectKeyInUse: "Project ID is already in use",
        projectKeyLocked: "Project ID cannot change after the first issue is created", membershipRequired: "You are not a member of this project",
        permissionDenied: "You do not have permission to perform this action.", conflict: "This item was updated elsewhere. Refresh and try again.",
        tooManyLoginAttempts: "Too many login attempts. Try again in a few minutes.", tooManyRegistrationAttempts: "Too many registration attempts. Try again later.",
        saveConflict: "This page was updated elsewhere. Your draft has been kept.", screenFailureTitle: "Something went wrong", screenFailureDescription: "Gikan could not render this screen. Reload the page or return to your projects.", goToProjects: "Go to projects", reloadPage: "Reload page", notFoundTitle: "404 · Not found", pageMissing: "This page is missing.", pageMissingDescription: "The link may be outdated, or the page may have moved somewhere else.", goHome: "Go home",
    } as const;

export default errors;
