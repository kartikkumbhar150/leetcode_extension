import { Request, Response, NextFunction } from 'express';

// Hardcoded admin credentials for DSA sheet management
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'kartikADM15';

/**
 * Middleware: checks for admin credentials in the request header.
 * Clients send:  X-Admin-Key: admin:kartikADM15  (base64 encoded or plain)
 * OR a query param:  ?adminKey=admin:kartikADM15
 */
export const adminOnly = (req: Request, res: Response, next: NextFunction) => {
  // Accept from header: X-Admin-Key: <username>:<password>
  const headerKey = req.headers['x-admin-key'] as string | undefined;
  // Accept from body: { adminUsername, adminPassword }
  const { adminUsername, adminPassword } = req.body || {};

  const validFromHeader =
    headerKey === `${ADMIN_USERNAME}:${ADMIN_PASSWORD}`;

  const validFromBody =
    adminUsername === ADMIN_USERNAME && adminPassword === ADMIN_PASSWORD;

  if (validFromHeader || validFromBody) {
    return next();
  }

  return res.status(403).json({ message: 'Admin access required' });
};
