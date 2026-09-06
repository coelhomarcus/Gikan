import { updateProfileSchema } from "@gikan/shared";
import { asyncHandler } from "../../middleware/async-handler";
import { updateProfile } from "./users.service";

export const updateMe = asyncHandler(async (req, res) => {
    const input = updateProfileSchema.parse(req.body);
    const user = await updateProfile(req.user!.sub, input);
    res.json({ user });
});
