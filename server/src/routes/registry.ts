import { Router, Request, Response } from 'express';

const router = Router();

router.get('/hospitals', (req: Request, res: Response) => {
  res.json({ hospitals: [] });
});

router.post('/hospitals', (req: Request, res: Response) => {
  res.json({ message: 'Create hospital endpoint' });
});

router.delete('/hospitals/:id', (req: Request, res: Response) => {
  res.json({ message: 'Delete hospital endpoint' });
});

router.get('/doctors', (req: Request, res: Response) => {
  res.json({ doctors: [] });
});

router.post('/doctors', (req: Request, res: Response) => {
  res.json({ message: 'Create doctor endpoint' });
});

router.delete('/doctors/:id', (req: Request, res: Response) => {
  res.json({ message: 'Delete doctor endpoint' });
});

export default router;
