import { authPaths } from "./auth.paths";
import { adminUserPaths } from "./admin.user.paths";
import { categoryPaths } from "./category.paths";
import { adminCategoryPaths } from "./admin.category.paths";

export const paths = {
    ...authPaths,
    ...adminUserPaths,
    ...adminCategoryPaths,
    ...categoryPaths,
};
