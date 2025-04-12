import { Controller, Get, Query } from '@nestjs/common';
import { PlayStoreService } from '../services/play-store.service';
import { OpenAIService } from '../services/openai.service';

@Controller('app')
export class AppController {
  constructor(
    private readonly playStoreService: PlayStoreService,
    private readonly openAIService: OpenAIService,
  ) {}

  @Get('analyze')
  async analyzeApp(@Query('appId') appId: string) {
    const reviews = await this.playStoreService.getAppReviews(appId);
    const analysis = await this.openAIService.analyzeReviews(reviews);
    return { reviews, analysis };
  }
} 