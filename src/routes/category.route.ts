import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller';

const router = Router();
const categoryController = new CategoryController();

router.get('/', categoryController.getAllCategories);
router.get('/:path', categoryController.getCategoryByPath);

export default router;