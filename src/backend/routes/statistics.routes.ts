import { Router } from 'express';
import { StatisticsController } from '../controllers/statistics.controller';

const router = Router();
const statisticsController = new StatisticsController();

router.get('/', statisticsController.getStatistics);
router.post('/reset', statisticsController.resetStatistics);

export default router;