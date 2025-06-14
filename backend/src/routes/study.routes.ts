import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { StudyController } from '../controllers/study.controller.js';

export const studyRouter = Router();
const controller = new StudyController();

// All routes require authentication
studyRouter.use(authenticate);

// Study sessions
studyRouter.get('/sessions', controller.getStudySessions);
studyRouter.post('/sessions', controller.createStudySession);
studyRouter.put('/sessions/:id', controller.updateStudySession);
studyRouter.delete('/sessions/:id', controller.deleteStudySession);

// Questions
studyRouter.get('/questions/:subSubjectId', controller.getQuestions);
studyRouter.post('/questions/:subSubjectId', controller.generateQuestions);
studyRouter.post('/sessions/:sessionId/questions', controller.submitQuestions);

// Study data
studyRouter.post('/reset', controller.resetStudyData);
studyRouter.get('/performance', controller.getPerformanceStats);