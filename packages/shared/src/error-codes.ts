const messageCodes: Record<string, string> = {
    "Not authenticated": "errors.notAuthenticated",
    "Invalid or expired session": "errors.invalidSession",
    "Invalid data": "errors.invalidData",
    "Internal error": "errors.internal",
    "This document is too large to save. Split its content into smaller pages.": "errors.tooLarge",
    "Project not found": "errors.projectNotFound",
    "Issue not found": "errors.issueNotFound",
    "Document not found": "errors.documentNotFound",
    "Incorrect username or password": "errors.incorrectCredentials",
    "Invalid special code": "errors.invalidSpecialCode",
    "Project key is already in use": "errors.projectKeyInUse",
    "Project key cannot change after the first issue is created": "errors.projectKeyLocked",
    "You are not a member of this project": "errors.membershipRequired",
    "This page was updated elsewhere. Your draft has been kept.": "errors.saveConflict",
    "This page was updated elsewhere. Your draft has been kept": "errors.saveConflict",
    "Too many login attempts. Try again in a few minutes.": "errors.tooManyLoginAttempts",
    "Too many registration attempts. Try again later.": "errors.tooManyRegistrationAttempts",
    "You do not have permission to update this category": "errors.permissionDenied",
    "You do not have permission to delete this category": "errors.permissionDenied",
    "Only the project owner can do this": "errors.permissionDenied",
    "Only the project owner can manage cycles": "errors.permissionDenied",
    "Only the author or project owner can delete this page": "errors.permissionDenied",
};

export function resolveApiError(message: string, status: number): { code: string; params?: Record<string, string> } {
    const mapped = messageCodes[message];
    if (mapped) return { code: mapped };
    const duplicate = /^This (username|email) is already in use$/.exec(message);
    if (duplicate) return { code: "errors.accountFieldInUse", params: { field: duplicate[1] } };
    if (status === 404) return { code: "errors.notFound" };
    if (status === 403) return { code: "errors.permissionDenied" };
    if (status === 409) return { code: "errors.conflict" };
    if (status === 413) return { code: "errors.tooLarge" };
    if (status === 429) return { code: "errors.requestLimit" };
    if (status >= 500) return { code: "errors.internal" };
    if (status === 400) return { code: "errors.invalidData" };
    if (status === 401) return { code: "errors.notAuthenticated" };
    return { code: "errors.requestFailed" };
}

