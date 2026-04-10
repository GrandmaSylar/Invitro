import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

/**
 * Express middleware to validate request structures against a Zod schema.
 */
export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          issues: error.issues.map(issue => ({
            path: issue.path.join('.'),
            message: issue.message
          }))
        });
      }
      return res.status(400).json({ error: 'Validation failed' });
    }
  };
};
