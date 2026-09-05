export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'PeoplePay360 Enterprise HRMS & Payroll API',
    version: '2.0.0',
    description: 'Complete backend API specification for enterprise HR and Payroll management. Supports RBAC, Multi-tenancy, Attendance, Leave, Contracts, and Deterministic Payroll Engine.',
  },
  servers: [
    {
      url: 'http://localhost:4000/api',
      description: 'Local Development Server',
    },
    {
      url: 'http://localhost:4000/api/v1',
      description: 'API v1 Canonical',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [
    {
      BearerAuth: [],
    },
  ],
  paths: {
    '/health': {
      get: {
        summary: 'System health check',
        responses: {
          200: {
            description: 'API is healthy and operational',
          },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'User login with email and password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'admin@oxp.com' },
                  password: { type: 'string', example: 'admin123' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Authenticated successfully with JWT access & refresh tokens' },
          401: { description: 'Invalid email or password' },
        },
      },
    },
    '/employees': {
      get: {
        summary: 'List and filter organization employees',
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'department_id', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'List of employees' },
        },
      },
      post: {
        summary: 'Create a new employee (HR Manager / Admin)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  name: { type: 'string', example: 'Jane Doe' },
                  email: { type: 'string', example: 'jane.doe@oxp.com' },
                  position: { type: 'string', example: 'Software Engineer' },
                  status: { type: 'string', example: 'Active' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Employee created successfully' },
        },
      },
    },
    '/contracts': {
      get: {
        summary: 'List all employee employment contracts',
        responses: { 200: { description: 'List of contracts' } },
      },
      post: {
        summary: 'Create contract with Overlap Protection',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['employee_id', 'start_date', 'wage'],
                properties: {
                  employee_id: { type: 'string' },
                  start_date: { type: 'string', example: '2026-01-01' },
                  end_date: { type: 'string', nullable: true },
                  wage: { type: 'number', example: 85000 },
                  status: { type: 'string', example: 'Running' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Contract created' },
          409: { description: 'Contract overlap detected' },
        },
      },
    },
    '/payroll/eligible-employees': {
      get: {
        summary: 'Find employees eligible for payroll for a specific year and month',
        parameters: [
          { name: 'year', in: 'query', required: true, schema: { type: 'integer', example: 2026 } },
          { name: 'month', in: 'query', required: true, schema: { type: 'integer', example: 9 } },
        ],
        responses: { 200: { description: 'List of eligible employees with valid contracts' } },
      },
    },
    '/payroll/payruns': {
      get: {
        summary: 'List payruns with statuses and totals',
        responses: { 200: { description: 'List of payruns' } },
      },
      post: {
        summary: 'Create payrun in Draft status',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['period_month', 'period_year', 'employee_ids'],
                properties: {
                  period_month: { type: 'integer', example: 9 },
                  period_year: { type: 'integer', example: 2026 },
                  employee_ids: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Payrun created in Draft state' } },
      },
    },
    '/payroll/payruns/{id}/compute': {
      post: {
        summary: 'Execute dynamic payroll computation engine for payrun',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'All payslips computed using rules, attendance, and leave' } },
      },
    },
    '/payroll/payruns/{id}/mark-paid': {
      post: {
        summary: 'Mark payrun paid and finalize immutable payslips',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Payrun marked Paid' } },
      },
    },
    '/payroll/payslips/{id}/pdf': {
      get: {
        summary: 'Stream generated payslip PDF document',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Binary PDF document' } },
      },
    },
    '/dashboard': {
      get: {
        summary: 'Retrieve live dynamic dashboard metrics',
        parameters: [
          { name: 'year', in: 'query', schema: { type: 'integer' } },
          { name: 'month', in: 'query', schema: { type: 'integer' } },
        ],
        responses: { 200: { description: 'Dashboard metrics and department distribution' } },
      },
    },
  },
};
