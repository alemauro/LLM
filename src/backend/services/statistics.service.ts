import * as fs from 'fs';
import * as path from 'path';
import { Statistics, StatisticsData } from '../types';

export class StatisticsService {
  private static instance: StatisticsService;
  private stats: StatisticsData;
  private readonly dataDir: string;
  private readonly filePath: string;

  private constructor() {
    this.dataDir = process.env.NODE_ENV === 'production' ? '/app/data' : './data';
    this.filePath = path.join(this.dataDir, 'statistics.json');
    
    this.ensureDataDirectory();
    this.stats = this.loadStatistics();
  }

  public static getInstance(): StatisticsService {
    if (!StatisticsService.instance) {
      StatisticsService.instance = new StatisticsService();
    }
    return StatisticsService.instance;
  }

  private ensureDataDirectory(): void {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  private loadStatistics(): StatisticsData {
    try {
      if (fs.existsSync(this.filePath)) {
        const data = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(data);
        return {
          promptCount: parsed.promptCount || 0,
          lastUpdated: new Date(parsed.lastUpdated || Date.now())
        };
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
    }

    return {
      promptCount: 0,
      lastUpdated: new Date()
    };
  }

  private saveStatistics(): void {
    try {
      const dataToSave = {
        promptCount: this.stats.promptCount,
        lastUpdated: this.stats.lastUpdated.toISOString()
      };
      fs.writeFileSync(this.filePath, JSON.stringify(dataToSave, null, 2));
    } catch (error) {
      console.error('Error saving statistics:', error);
    }
  }

  public incrementPromptCount(): void {
    this.stats.promptCount++;
    this.stats.lastUpdated = new Date();
    this.saveStatistics();
  }

  public getStatistics(): Statistics {
    return {
      promptCount: this.stats.promptCount,
      lastUpdated: this.stats.lastUpdated.toISOString()
    };
  }

  public resetStatistics(): void {
    if (process.env.NODE_ENV !== 'production') {
      this.stats = {
        promptCount: 0,
        lastUpdated: new Date()
      };
      this.saveStatistics();
    }
  }
}