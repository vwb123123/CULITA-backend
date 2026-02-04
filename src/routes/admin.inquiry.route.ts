import { Router } from "express";
import { AdminInquiryController } from "../controllers/admin.inquiry.controller";
import { authenticateJwt } from "../middlewares/auth.middleware";
import { isAdmin } from "../middlewares/admin.middleware";
import { validateQuery, validateParams, validateBody } from "../middlewares/validation.middleware";
import {
    getAdminInquiryListQuerySchema,
    adminInquiryIdParamSchema,
    answerInquirySchema,
} from "../schemas/admin.inquiry.schema";

const router = Router();
const inquiryController = new AdminInquiryController();

// 관리자 권한 필수
router.use(authenticateJwt, isAdmin);

// 1. 전체 조회
router.get("/", validateQuery(getAdminInquiryListQuerySchema), inquiryController.getAllInquiries);

// 2. 상세 조회
router.get("/:id", validateParams(adminInquiryIdParamSchema), inquiryController.getInquiryDetail);

// 3. 답변 등록 (PATCH 사용 - 부분 업데이트 성격)
router.patch(
    "/:id/answer",
    validateParams(adminInquiryIdParamSchema),
    validateBody(answerInquirySchema),
    inquiryController.answerInquiry,
);

// 4. 삭제
router.delete("/:id", validateParams(adminInquiryIdParamSchema), inquiryController.deleteInquiry);

export default router;
