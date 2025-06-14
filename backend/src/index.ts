import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from 'dotenv';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import { authRouter } from './routes/auth.routes.js';
import { subjectsRouter } from './routes/subjects.routes.js';
import { studyRouter } from './routes/study.routes.js';
import { subscriptionRouter } from './routes/subscription.routes.js';
import { adminRouter } from './routes/admin.routes.js';
import { subSubjectsRouter } from './routes/sub-subjects.routes.js';

// Load environment variables
config();

const app = express();
const port = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/auth', authRouter);
app.use('/api/subjects', subjectsRouter);
app.use('/api/sub-subjects', subSubjectsRouter);
app.use('/api/study', studyRouter);
app.use('/api/subscription', subscriptionRouter);
app.use('/api/admin', adminRouter);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});