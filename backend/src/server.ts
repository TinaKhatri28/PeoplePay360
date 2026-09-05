import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRouter from './routes/auth';
import usersRouter from './routes/users';
import employeesRouter from './routes/employees';
import contractsRouter from './routes/contracts';
import attendanceRouter from './routes/attendance';
import timeoffRouter from './routes/timeoff';
import schedulesRouter from './routes/schedules';
import salaryRouter from './routes/salary';
import payrollRouter from './routes/payroll';
import dashboardRouter from './routes/dashboard';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, name: 'PeoplePay360 API' });
});

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/employees', employeesRouter);
app.use('/api/contracts', contractsRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/time-off', timeoffRouter);
app.use('/api/schedules', schedulesRouter);
app.use('/api/salary', salaryRouter);
app.use('/api/payroll', payrollRouter);
app.use('/api/dashboard', dashboardRouter);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`PeoplePay360 API running on http://localhost:${PORT}`);
});
