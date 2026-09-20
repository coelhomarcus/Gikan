import { Router } from "express";
import {
  createDocumentSchema,
  documentParamsSchema,
  updateDocumentSchema,
} from "@gikan/shared";
import { asyncHandler } from "../../middleware/async-handler";
import * as service from "./documents.service";

// Mounted behind authentication and project membership in projects.routes.ts.
export const documentsRouter = Router({ mergeParams: true });
documentsRouter.get(
  "/",
  asyncHandler<{ projectId: string }>(async (req, res) => {
    res.json({ documents: await service.listDocuments(req.params.projectId) });
  }),
);
documentsRouter.post(
  "/",
  asyncHandler<{ projectId: string }>(async (req, res) => {
    res
      .status(201)
      .json({
        document: await service.createDocument(
          req.params.projectId,
          req.user!.sub,
          createDocumentSchema.parse(req.body),
        ),
      });
  }),
);
documentsRouter.get(
  "/:documentId",
  asyncHandler(async (req, res) => {
    const { projectId, documentId } = documentParamsSchema.parse(req.params);
    res.json({ document: await service.getDocument(projectId, documentId) });
  }),
);
documentsRouter.patch(
  "/:documentId",
  asyncHandler(async (req, res) => {
    const { projectId, documentId } = documentParamsSchema.parse(req.params);
    res.json({
      document: await service.updateDocument(
        projectId,
        documentId,
        req.user!.sub,
        updateDocumentSchema.parse(req.body),
      ),
    });
  }),
);
documentsRouter.delete(
  "/:documentId",
  asyncHandler(async (req, res) => {
    const { projectId, documentId } = documentParamsSchema.parse(req.params);
    await service.deleteDocument(
      projectId,
      documentId,
      req.user!.sub,
      req.user!.isAdmin,
    );
    res.status(204).send();
  }),
);
