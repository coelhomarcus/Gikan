import type { Page } from "@playwright/test";

export const documentId = "77777777-7777-4777-8777-777777777777";
export const projectId = "11111111-1111-4111-8111-111111111111";
const userId = "22222222-2222-4222-8222-222222222222";
export const timestamp = "2026-09-18T12:00:00.000Z";
export const user = {
    id: userId,
    name: "Alex Morgan",
    username: "alex",
    email: "alex@example.test",
    avatarUrl: null,
    isAdmin: true,
    createdAt: timestamp,
    updatedAt: timestamp,
};
export const project = {
    id: projectId,
    name: "Platform",
    issueKey: "PLAT",
    nextIssueNumber: 5,
    description: "Building a better workspace for our team.",
    repositoryUrl: "https://example.test/platform",
    icon: "layers",
    pageContent: "",
    createdBy: userId,
    createdAt: timestamp,
    updatedAt: timestamp,
};
export const columns = ["Backlog", "Todo", "In progress", "Done"].map((name, i) => ({
    id: `33333333-3333-4333-8333-33333333333${i}`,
    projectId,
    name,
    color: ["#6b7280", "#a3a3a3", "#f59e0b", "#22c55e"][i],
    position: i * 1000,
    createdAt: timestamp,
}));
export const category = { id: "44444444-4444-4444-8444-444444444444", projectId, name: "Design", color: "#8b5cf6", createdBy: userId, createdAt: timestamp };
export const cycle = {
    id: "55555555-5555-4555-8555-555555555555",
    projectId,
    number: 1,
    name: "September sprint",
    status: "active",
    startsAt: "2026-09-14T00:00:00Z",
    endsAt: "2026-09-28T00:00:00Z",
};
const documentJson = { type: "doc" as const, content: [{ type: "paragraph", content: [{ type: "text", text: "Make every detail count." }] }] };
export const issues = ["Build the project workspace", "Refine the issue list", "Update navigation and search", "Document the design system"].map(
    (title, i) => ({
        id: `66666666-6666-4666-8666-66666666666${i}`,
        projectId,
        number: i + 1,
        identifier: `PLAT-${i + 1}`,
        columnId: columns[i].id,
        title,
        descriptionJson: documentJson,
        assigneeId: i % 2 ? null : userId,
        categoryId: category.id,
        priority: ["high", "medium", "low", "medium"][i],
        createdBy: userId,
        position: i * 1000,
        parentIssueId: null,
        cycleId: cycle.id,
        estimate: 3,
        createdAt: timestamp,
        updatedAt: timestamp,
    }),
);

/** In-memory HTTP fixtures; never touches the running API or its database. */
export async function mockApi(
    page: Page,
    options: { authenticated?: boolean; empty?: boolean; admin?: boolean; errorPath?: string; errorMethod?: string } = {},
) {
    let authenticated = options.authenticated ?? true;
    const currentUser = { ...user, isAdmin: options.admin ?? true };
    const currentProject = { ...project };
    const currentIssues = structuredClone(options.empty ? [] : issues);
    const currentColumns = structuredClone(columns);
    const currentCategories = structuredClone([category]);
    const currentCycles = structuredClone([cycle]);
    const members: Array<Record<string, unknown>> = [{ ...currentUser, role: options.admin === false ? "member" : "owner", joinedAt: timestamp }];
    const documents = [
        {
            id: documentId,
            projectId,
            title: "Overview notes",
            contentJson: documentJson,
            createdBy: userId,
            createdAt: timestamp,
            updatedAt: timestamp,
            revision: 1,
        },
    ];
    const comments: Record<string, unknown>[] = [];
    const relations: Record<string, unknown>[] = [];
    await page.clock.install({ time: new Date(timestamp) });
    await page.route("**/api/**", async (route) => {
        const request = route.request();
        const path = new URL(request.url()).pathname.replace(/^\/api/, "");
        const method = request.method();
        const body = request.postDataJSON() ?? {};
        const json = (data: unknown, status = 200) => route.fulfill({ status, json: data });
        if (options.errorPath === path && (!options.errorMethod || options.errorMethod === method)) return json({ error: "Simulated service failure" }, 500);
        if (path === "/auth/me") return authenticated ? json({ user: currentUser }) : json({ error: "Unauthorized" }, 401);
        if (path === "/auth/login" || path === "/auth/register") {
            authenticated = true;
            return json({ user: currentUser });
        }
        if (path === "/auth/logout") {
            authenticated = false;
            return route.fulfill({ status: 204 });
        }
        if (path === "/users/me") {
            Object.assign(currentUser, body);
            return json({ user: currentUser });
        }
        if (path === "/projects")
            return method === "POST" ? json({ project: { ...currentProject, ...body } }) : json({ projects: options.empty ? [] : [currentProject] });
        if (path === `/projects/${projectId}`) {
            if (method === "PATCH") Object.assign(currentProject, body);
            return json({ project: currentProject });
        }
        if (path === `/projects/${projectId}/documents`) {
            if (method === "POST") {
                const document = {
                    ...documents[0],
                    id: crypto.randomUUID(),
                    projectId,
                    title: "Untitled",
                    contentJson: { type: "doc", content: [] },
                    createdBy: userId,
                    createdAt: timestamp,
                    updatedAt: timestamp,
                    revision: 1,
                    ...body,
                };
                documents.push(document);
                return json({ document }, 201);
            }
            return json({ documents: documents.map(({ contentJson: _content, ...summary }) => summary) });
        }
        if (path.startsWith(`/projects/${projectId}/documents/`)) {
            const index = documents.findIndex((document) => path.endsWith(`/${document.id}`));
            if (index < 0) return json({ error: "Document not found" }, 404);
            const document = documents[index];
            if (method === "PATCH") {
                if (body.expectedRevision !== document.revision) return json({ error: "This page was updated elsewhere." }, 409);
                Object.assign(document, { title: body.title || "Untitled", contentJson: body.contentJson, revision: document.revision + 1 });
            }
            if (method === "DELETE") {
                documents.splice(index, 1);
                return route.fulfill({ status: 204 });
            }
            return json({ document });
        }
        if (path.endsWith("/members")) {
            if (method === "POST") {
                const member = {
                    id: "new-member",
                    name: "Sam Rivera",
                    username: body.username,
                    email: `${body.username}@example.test`,
                    avatarUrl: null,
                    role: "member",
                    joinedAt: timestamp,
                };
                members.push(member);
                return json({ members, member });
            }
            return json({ members });
        }
        if (path.includes("/members/") && method === "DELETE") {
            const memberId = path.split("/").at(-1);
            const index = members.findIndex((member) => member.id === memberId);
            if (index >= 0) members.splice(index, 1);
            return route.fulfill({ status: 204 });
        }
        if (path.includes("/columns")) {
            if (method === "PATCH")
                Object.assign(
                    currentColumns.find((c) => path.endsWith(c.id))!,
                    body,
                );
            if (method === "POST") currentColumns.push({ ...columns[0], ...body, id: "new-column" });
            if (method === "DELETE")
                currentColumns.splice(
                    currentColumns.findIndex((c) => path.endsWith(c.id)),
                    1,
                );
            return json({ columns: currentColumns, column: currentColumns.find((c) => path.endsWith(c.id)) ?? currentColumns.at(-1) });
        }
        if (path.includes("/categories")) {
            if (method === "POST") currentCategories.push({ ...category, ...body, id: "new-category" });
            if (method === "DELETE")
                currentCategories.splice(
                    currentCategories.findIndex((c) => path.endsWith(c.id)),
                    1,
                );
            if (method === "PATCH")
                Object.assign(
                    currentCategories.find((c) => path.endsWith(c.id))!,
                    body,
                );
            return json({ categories: currentCategories, category: currentCategories.at(-1) });
        }
        if (path.includes("/cycles")) {
            if (method === "POST") currentCycles.push({ ...cycle, ...body, id: "new-cycle" });
            if (method === "PATCH")
                Object.assign(
                    currentCycles.find((c) => path.endsWith(c.id))!,
                    body,
                );
            if (method === "DELETE")
                currentCycles.splice(
                    currentCycles.findIndex((c) => path.endsWith(c.id)),
                    1,
                );
            return json({ cycles: currentCycles, cycle: currentCycles.at(-1) });
        }
        if (path.endsWith("/comments")) {
            if (method === "POST")
                comments.push({
                    id: "comment-1",
                    issueId: issues[0].id,
                    authorId: userId,
                    author: currentUser,
                    createdAt: timestamp,
                    updatedAt: timestamp,
                    ...body,
                });
            return json({ comments, comment: comments.at(-1) });
        }
        if (path.endsWith("/activity")) return json({ activity: [] });
        if (path.endsWith("/relations")) {
            if (method === "POST") {
                const target = currentIssues.find((item) => item.identifier.toLowerCase() === String(body.targetIssueIdentifier).toLowerCase());
                if (!target) return json({ error: "Issue not found" }, 404);
                const relation = {
                    id: "relation-1",
                    sourceIssueId: issues[0].id,
                    targetIssueId: target.id,
                    type: body.type,
                    target: { id: target.id, number: target.number, title: target.title, projectId, project: { issueKey: currentProject.issueKey } },
                };
                relations.push(relation);
                return json({ relations, relation });
            }
            return json({ relations });
        }
        if (path.startsWith("/relations/") && method === "DELETE") {
            relations.splice(
                relations.findIndex((relation) => relation.id === path.split("/").at(-1)),
                1,
            );
            return route.fulfill({ status: 204 });
        }
        if (path === `/projects/${projectId}/issues`) {
            if (method === "POST") currentIssues.push({ ...issues[0], ...body, id: "new-issue", number: 5, identifier: "PLAT-5" });
            return json({ issues: currentIssues, issue: currentIssues.at(-1) });
        }
        if (path.startsWith("/issues/")) {
            const issue = currentIssues.find((i) => path === `/issues/${i.identifier}`);
            if (!issue) return json({ error: "Issue not found" }, 404);
            if (method === "PATCH") Object.assign(issue, body);
            if (method === "DELETE") {
                currentIssues.splice(currentIssues.indexOf(issue), 1);
                return route.fulfill({ status: 204 });
            }
            return json({
                issue: {
                    ...issue,
                    project: currentProject,
                    assignee: issue.assigneeId ? currentUser : null,
                    createdBy: currentUser,
                    category: currentCategories.find((item) => item.id === issue.categoryId) ?? null,
                    column: currentColumns.find((c) => c.id === issue.columnId),
                    cycle: currentCycles.find((item) => item.id === issue.cycleId) ?? null,
                    parent: currentIssues.find((item) => item.id === issue.parentIssueId)
                        ? {
                              id: issue.parentIssueId,
                              number: currentIssues.find((item) => item.id === issue.parentIssueId)!.number,
                              title: currentIssues.find((item) => item.id === issue.parentIssueId)!.title,
                          }
                        : null,
                    children: currentIssues
                        .filter((item) => item.parentIssueId === issue.id)
                        .map((item) => ({ id: item.id, number: item.number, title: item.title, columnId: item.columnId, priority: item.priority })),
                },
            });
        }
        return json({ error: `Unmocked ${method} ${path}` }, 404);
    });
}
