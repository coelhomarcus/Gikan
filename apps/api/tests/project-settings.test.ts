import assert from "node:assert/strict";
import { afterEach, mock, test } from "node:test";
import type { Request, Response, NextFunction } from "express";
import { createProjectSchema } from "@gikan/shared";
import { db } from "../src/db";
import { projects } from "../src/db/schema";
import { createProject } from "../src/features/projects/projects.service";
import { isProjectKeyConflict } from "../src/features/projects/project-key";
import { HttpError } from "../src/lib/http-error";
import { requireProjectOwner } from "../src/middleware/project-membership.middleware";

// Stub the database boundary: these tests never connect to or mutate a development database.
afterEach(() => mock.restoreAll());
const collision = { code: "23505", constraint: "projects_issue_key_unique" };
const creatorId = "creator";

test("creation accepts a custom key, normalizes it, and keeps old clients compatible", () => {
    assert.equal(createProjectSchema.parse({ name: "My project", issueKey: " api2 " }).issueKey, "API2");
    assert.equal(createProjectSchema.parse({ name: "My project" }).issueKey, undefined);
    assert.equal(createProjectSchema.parse({ name: "My project", issueKey: "" }).issueKey, undefined);
    for (const issueKey of ["A", "ABCDEFGHI", "API-X", "API X", "💙"]) {
        assert.equal(createProjectSchema.safeParse({ name: "My project", issueKey }).success, false, issueKey);
    }
});

test("custom key is persisted verbatim without querying automatic suggestions", async () => {
    const inserts: Array<{ table: unknown; values: Record<string, unknown> | unknown[] }> = [];
    mock.method(db.query.projects, "findMany", async () => { throw new Error("Automatic allocation must not run"); });
    mock.method(db, "transaction", async (work: (tx: unknown) => Promise<unknown>) => work({
        insert: (table: unknown) => ({ values: (values: Record<string, unknown>) => {
            inserts.push({ table, values });
            return { returning: async () => [{ id: "new-project", ...values }] };
        } }),
    }));
    const result = await createProject(createProjectSchema.parse({ name: "My project", issueKey: "CUSTOM" }), creatorId);
    assert.equal(result.issueKey, "CUSTOM");
    assert.equal(inserts[0].table, projects);
    assert.deepEqual(inserts[1].values, { projectId: "new-project", userId: creatorId, role: "owner" });
    assert.equal((inserts[2].values as unknown[]).length, 3);
});

test("an explicit duplicate key returns 409 instead of silently suffixing it", async () => {
    const transaction = mock.method(db, "transaction", async () => { throw new Error("Query failed", { cause: collision }); });
    await assert.rejects(createProject({ name: "My project", issueKey: "CUSTOM" }, creatorId), (error: unknown) =>
        error instanceof HttpError && error.statusCode === 409 && error.message === "Project key is already in use");
    assert.equal(transaction.mock.callCount(), 1);
});

test("automatic keys retry with a fresh suggestion after a concurrent collision", async () => {
    let attempts = 0;
    mock.method(db.query.projects, "findMany", async () => attempts === 0 ? [{ issueKey: "MP" }] : [{ issueKey: "MP" }, { issueKey: "MP1" }]);
    mock.method(db, "transaction", async (work: (tx: unknown) => Promise<unknown>) => {
        attempts++;
        if (attempts === 1) throw collision;
        return work({ insert: () => ({ values: (values: Record<string, unknown>) => ({ returning: async () => [{ id: "new-project", ...values }] }) }) });
    });
    assert.equal((await createProject({ name: "My project" }, creatorId)).issueKey, "MP2");
    assert.equal(attempts, 2);
});

test("automatic allocation reports exhausted collisions as 409", async () => {
    mock.method(db.query.projects, "findMany", async () => []);
    const transaction = mock.method(db, "transaction", async () => { throw collision; });
    await assert.rejects(createProject({ name: "My project" }, creatorId), (error: unknown) => error instanceof HttpError && error.statusCode === 409);
    assert.equal(transaction.mock.callCount(), 5);
});

test("unrelated database errors propagate without being retried as key conflicts", async () => {
    const unavailable = new Error("Database unavailable");
    const transaction = mock.method(db, "transaction", async () => { throw unavailable; });
    await assert.rejects(createProject({ name: "My project", issueKey: "CUSTOM" }, creatorId), (error) => error === unavailable);
    assert.equal(transaction.mock.callCount(), 1);
    assert.equal(isProjectKeyConflict({ code: "23505", constraint: "other_unique_constraint" }), false);
    const cyclic: { cause?: unknown } = {}; cyclic.cause = cyclic;
    assert.equal(isProjectKeyConflict(cyclic), false);
});

function authorize(isAdmin: boolean): Promise<number> {
    return new Promise((resolve, reject) => {
        let status = 200;
        const response = { status(code: number) { status = code; return this; }, json() { resolve(status); } };
        const next: NextFunction = (error?: unknown) => error ? reject(error) : resolve(200);
        requireProjectOwner({ params: { projectId: "project" }, user: { sub: "user", isAdmin } } as unknown as Request<{ projectId: string }>, response as Response, next);
    });
}

test("project deletion/settings guard rejects members and nonmembers", async () => {
    mock.method(db.query.projects, "findFirst", async () => ({ id: "project" }));
    const membership = mock.method(db.query.projectMembers, "findFirst", async () => ({ role: "member" }));
    assert.equal(await authorize(false), 403);
    membership.mock.mockImplementation(async () => undefined);
    assert.equal(await authorize(false), 403);
});

test("project deletion/settings guard permits owner and admin, but not a missing project", async () => {
    const project = mock.method(db.query.projects, "findFirst", async () => ({ id: "project" }));
    mock.method(db.query.projectMembers, "findFirst", async () => ({ role: "owner" }));
    assert.equal(await authorize(false), 200);
    assert.equal(await authorize(true), 200);
    project.mock.mockImplementation(async () => undefined);
    await assert.rejects(authorize(true), (error: unknown) => error instanceof HttpError && error.statusCode === 404);
});
