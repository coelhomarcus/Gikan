import { asyncHandler } from "../../middleware/async-handler";
import { createBackup } from "./admin.service";

export const getBackup = asyncHandler(async (_req, res) => {
    const backup = await createBackup();
    const filename = `gikan-backup-${backup.exportedAt.slice(0, 10)}.json`;

    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.json(backup);
});
