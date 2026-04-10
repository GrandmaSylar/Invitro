import { Router, Request, Response } from 'express';
import { ConfigService } from '../services/configService';
import { DatabaseManager } from '../services/dbManager';

const router = Router();

// Get all configs
router.get('/db-configs', (req: Request, res: Response) => {
  const configs = ConfigService.getConfigs();
  res.json(configs);
});

// Save new config
router.post('/db-configs', (req: Request, res: Response) => {
  const newConfig = { 
    ...req.body, 
    id: `db_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    isActive: false 
  };
  const added = ConfigService.addConfig(newConfig);
  res.json(added);
});

// Test Connection
router.post('/db-configs/test', async (req: Request, res: Response) => {
  const result = await DatabaseManager.testConnection(req.body);
  res.json(result);
});

// Set Active Connection
router.put('/db-configs/:id/active', async (req: Request, res: Response) => {
  const { id } = req.params;
  ConfigService.setActiveConfig(id);

  // Attempt to boot the active DB immediately
  const activeDb = ConfigService.getActiveConfig();
  if (activeDb) {
    await DatabaseManager.initializeActiveConnection(activeDb);
  }

  res.json({ success: true });
});

// Delete Config
router.delete('/db-configs/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  
  const active = ConfigService.getActiveConfig();
  if (active?.id === id) {
    return res.status(400).json({ error: 'Cannot delete the currently active configuration' });
  }

  ConfigService.deleteConfig(id);
  res.json({ success: true });
});

export default router;
