import { createCategorySchema } from "@todokanban/shared";
import { asyncHandler } from "../../middleware/async-handler";
import { createCategory, deleteCategory, listCategories } from "./categories.service";

export const list = asyncHandler<{ projectId: string }>(async (req, res) => {
    const categoryList = await listCategories(req.params.projectId);
    res.json({ categories: categoryList });
});

export const create = asyncHandler<{ projectId: string }>(async (req, res) => {
    const input = createCategorySchema.parse(req.body);
    const category = await createCategory(req.params.projectId, input, req.user!.sub);
    res.status(201).json({ category });
});

export const remove = asyncHandler<{ projectId: string; categoryId: string }>(async (req, res) => {
    await deleteCategory(req.params.projectId, req.params.categoryId, {
        userId: req.user!.sub,
        isAdmin: req.user!.isAdmin,
        isProjectOwner: req.projectMembership?.role === "owner",
    });
    res.status(204).send();
});
