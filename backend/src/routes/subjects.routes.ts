import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { SubjectsController } from '../controllers/subjects.controller.js';

export const subjectsRouter = Router();
const controller = new SubjectsController();

// All routes require authentication
subjectsRouter.use(authenticate);

// Subjects
subjectsRouter.get('/', controller.getSubjects);
subjectsRouter.post('/', controller.createSubject);
subjectsRouter.put('/:id', controller.updateSubject);
subjectsRouter.delete('/:id', controller.deleteSubject);

// Sub-subjects
subjectsRouter.get('/:subjectId/sub-subjects', controller.getSubSubjects);
subjectsRouter.post('/:subjectId/sub-subjects', controller.createSubSubject);
subjectsRouter.put('/sub-subjects/:id', controller.updateSubSubject);
subjectsRouter.delete('/sub-subjects/:id', controller.deleteSubSubject);