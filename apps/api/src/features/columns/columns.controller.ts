import { createColumnSchema, updateColumnSchema } from "@todokanban/shared";
import { asyncHandler } from "../../middleware/async-handler";
import { createColumn, deleteColumn, listColumns, updateColumn } from "./columns.service";

export const list = asyncHandler<{ projectId: string }>(async (req, res) => {
    const columns = await listColumns(req.params.projectId);
    res.json({ columns });
});

export const create = asyncHandler<{ projectId: string }>(async (req, res) => {
    const input = createColumnSchema.parse(req.body);
    const column = await createColumn(req.params.projectId, input);
    res.status(201).json({ column });
});

export const update = asyncHandler<{ projectId: string; columnId: string }>(async (req, res) => {
    const input = updateColumnSchema.parse(req.body);
    const column = await updateColumn(req.params.projectId, req.params.columnId, input);
    res.json({ column });
});

export const remove = asyncHandler<{ projectId: string; columnId: string }>(async (req, res) => {
    await deleteColumn(req.params.projectId, req.params.columnId);
    res.status(204).send();
});
