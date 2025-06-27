import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { StudyConfigController } from '../controllers/studyConfig.controller.js';

export const studyConfigRouter = Router();
const controller = new StudyConfigController();

// All routes require authentication
studyConfigRouter.use(authenticate);

// Study configuration routes
studyConfigRouter.get('/', controller.getUserStudyConfig);
studyConfigRouter.post('/', controller.createStudyConfig);
studyConfigRouter.put('/:id', controller.updateStudyConfig);
studyConfigRouter.delete('/:id', controller.deleteStudyConfig);

// Study schedule generation
studyConfigRouter.post('/:id/generate-schedule', controller.generateStudySchedule);
studyConfigRouter.get('/:id/schedule', controller.getStudySchedule);
studyConfigRouter.get('/:id/stats', controller.getStudyStats);

// Study session management
studyConfigRouter.get('/sessions', controller.getUserStudySessions);
studyConfigRouter.get('/sessions/calendar', controller.getStudySessionsForCalendar);
studyConfigRouter.put('/sessions/:sessionId/complete', controller.completeStudySession);
studyConfigRouter.put('/sessions/:sessionId', controller.updateStudySession);
studyConfigRouter.delete('/sessions/:sessionId', controller.deleteStudySession);

// Bulk operations
studyConfigRouter.post('/sessions/bulk-complete', controller.bulkCompleteStudySessions);
studyConfigRouter.delete('/sessions/bulk-delete', controller.bulkDeleteStudySessions);