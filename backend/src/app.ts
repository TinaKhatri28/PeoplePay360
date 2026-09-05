import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { requestIdMiddleware } from './shared/middleware/request-id.middleware';
import { tenantMiddleware } from './shared/middleware/tenant.middleware';
import { errorMiddleware } from './shared/middleware/error.middleware';
import swaggerUi from 'swagger-ui-express';
import { swaggerDocument } from './config/swagger';

// Module routers
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/user.routes';
import employeeRoutes from './modules/employees/employee.routes';
import departmentRoutes from './modules/departments/department.routes';
import contractRoutes from './modules/contracts/contract.routes';
import scheduleRoutes from './modules/schedules/schedule.routes';
import attendanceRoutes from './modules/attendance/attendance.routes';
import leaveRoutes from './modules/leave/leave.routes';
import salaryRoutes from './modules/salary-structures/salary-structure.routes';
import payrollRoutes from './modules/payroll/payroll.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';

export const createApp = (): Express => {
  const app = express();

  // Security & parsing middleware
  app.use(helmet({
    contentSecurityPolicy: false, // Allows flexible PDF previews and local dev
  }));
  app.use(cors({
    origin: true,
    credentials: true,
  }));
  app.use(express.json());
  app.use(requestIdMiddleware);
  app.use(tenantMiddleware);

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      ok: true,
      status: 'UP',
      name: 'PeoplePay360 Enterprise API',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  // Swagger / OpenAPI documentation UI
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  // Helper to mount routers to a given base path prefix
  const mountRoutes = (prefix: string) => {
    app.use(`${prefix}/auth`, authRoutes);
    app.use(`${prefix}/users`, userRoutes);
    app.use(`${prefix}/employees`, employeeRoutes);
    app.use(`${prefix}/departments`, departmentRoutes);
    app.use(`${prefix}/contracts`, contractRoutes);
    app.use(`${prefix}/schedules`, scheduleRoutes);
    app.use(`${prefix}/attendance`, attendanceRoutes);
    app.use(`${prefix}/time-off`, leaveRoutes);
    app.use(`${prefix}/leave`, leaveRoutes);
    app.use(`${prefix}/salary`, salaryRoutes);
    app.use(`${prefix}/payroll`, payrollRoutes);
    app.use(`${prefix}/dashboard`, dashboardRoutes);
  };

  // Canonical enterprise v1 routes
  mountRoutes('/api/v1');

  // Direct /api bridge for existing frontend UI compatibility
  mountRoutes('/api');

  // 404 Handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Endpoint ${req.method} ${req.originalUrl} not found`,
      },
      requestId: req.requestId,
    });
  });

  // Centralized Error Handler
  app.use(errorMiddleware);

  return app;
};
