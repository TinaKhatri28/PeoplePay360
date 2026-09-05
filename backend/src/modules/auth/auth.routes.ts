import { Router } from 'express';
import { authController } from './auth.controller';
import { validateRequest } from '../../shared/middleware/validate.middleware';
import { loginSchema, refreshTokenSchema } from './auth.schema';
import { authenticate } from '../../shared/guards/authenticate.guard';
import { authRateLimiter } from '../../shared/middleware/rate-limiter.middleware';

const router = Router();

router.post('/login', authRateLimiter, validateRequest({ body: loginSchema }), authController.login);
router.post('/refresh', validateRequest({ body: refreshTokenSchema }), authController.refreshToken);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.me);

export default router;
