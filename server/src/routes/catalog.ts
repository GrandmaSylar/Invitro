import { Router, Request, Response } from 'express';

const router = Router();

router.get('/tests', (req: Request, res: Response) => {
  res.json({ tests: [] });
});

router.post('/tests', (req: Request, res: Response) => {
  res.json({ message: 'Create test endpoint' });
});

router.get('/parameters', (req: Request, res: Response) => {
  res.json({ parameters: [] });
});

router.post('/parameters', (req: Request, res: Response) => {
  res.json({ message: 'Create parameter endpoint' });
});

router.get('/antibiotics', (req: Request, res: Response) => {
  res.json({ antibiotics: [] });
});

router.post('/antibiotics', (req: Request, res: Response) => {
  res.json({ message: 'Create antibiotic endpoint' });
});

export default router;
