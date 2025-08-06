import { Request, Response } from 'express';
import { StatisticsService } from '../services/statistics.service';

export class StatisticsController {
  private statisticsService: StatisticsService;

  constructor() {
    this.statisticsService = StatisticsService.getInstance();
    
    this.getStatistics = this.getStatistics.bind(this);
    this.resetStatistics = this.resetStatistics.bind(this);
  }

  public getStatistics(_req: Request, res: Response): void {
    const stats = this.statisticsService.getStatistics();
    res.json({
      success: true,
      data: stats
    });
  }

  public resetStatistics(_req: Request, res: Response): void {
    if (process.env.NODE_ENV === 'production') {
      res.status(403).json({
        success: false,
        error: 'Operación no permitida en producción'
      });
      return;
    }

    this.statisticsService.resetStatistics();
    res.json({
      success: true,
      message: 'Estadísticas reiniciadas'
    });
  }
}