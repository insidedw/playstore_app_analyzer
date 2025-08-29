import { Controller, Get, Query } from '@nestjs/common';
import { PlayStoreService } from '../services/play-store.service';
import { OpenAIService } from '../services/openai.service';
import { HanjaService } from 'src/services/hanja.service';

@Controller('app')
export class AppController {
  constructor(
    private readonly playStoreService: PlayStoreService,
    private readonly openAIService: OpenAIService,
    private readonly hanjaService: HanjaService,
  ) {}

  @Get('analyze')
  async analyzeApp(@Query('appId') appId: string) {
    const reviews = await this.playStoreService.getAppReviews(appId);
    const analysis = await this.openAIService.analyzeReviews(reviews);
    return { reviews, analysis };
  }

  @Get('hanja')
  async hanja(@Query('text') text: string) {
    const result = await this.hanjaService.hanja(text);
    return result;
  }
}
