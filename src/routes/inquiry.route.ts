import { Router } from "express";
import { UserInquiryController } from "../controllers/inquiry.controller";
import { authenticateJwt } from "../middlewares/auth.middleware";
import { validateBody, validateQuery, validateParams } from "../middlewares/validation.middleware";
import {
    createInquirySchema,
    updateInquirySchema,
    getInquiryListQuerySchema,
    inquiryIdParamSchema,
} from "../schemas/inquiry.schema";

const router = Router();
const inquiryController = new UserInquiryController();

// 모든 문의 기능은 로그인 필수
router.use(authenticateJwt);

// 1. 목록 조회
router.get("/", validateQuery(getInquiryListQuerySchema), inquiryController.getMyInquiries);

// 2. 상세 조회
router.get("/:id", validateParams(inquiryIdParamSchema), inquiryController.getInquiryDetail);

// 3. 등록
router.post("/", validateBody(createInquirySchema), inquiryController.createInquiry);

// 4. 수정
router.put(
    "/:id",
    validateParams(inquiryIdParamSchema),
    validateBody(updateInquirySchema),
    inquiryController.updateInquiry,
);

// 5. 삭제
router.delete("/:id", validateParams(inquiryIdParamSchema), inquiryController.deleteInquiry);

export default router;
