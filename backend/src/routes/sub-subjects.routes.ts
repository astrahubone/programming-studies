import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { SubSubjectsController } from '../controllers/sub-subjects.controller.js';

export const subSubjectsRouter = Router();
const controller = new SubSubjectsController();

// All routes require authentication
subSubjectsRouter.use(authenticate);

// Sub-subjects routes
subSubjectsRouter.get('/:subjectId', controller.getSubSubjects);
subSubjectsRouter.post('/:subjectId', controller.createSubSubject);
subSubjectsRouter.put('/:id', controller.updateSubSubject);
subSubjectsRouter.delete('/:id', controller.deleteSubSubject);