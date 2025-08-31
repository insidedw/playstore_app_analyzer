import { Controller, Get, Query } from '@nestjs/common';
import { PlayStoreService } from '../services/play-store.service';
import { OpenAIService } from '../services/openai.service';
import { HanjaService } from 'src/services/hanja.service';
import * as fs from 'fs';

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
    fs.writeFileSync('./result.json', JSON.stringify(result, null, 2));
    return result;
  }

  @Get('hanja-test')
  async hanjaTest() {
    //read korean_name.txt
    const koreanNames = fs.readFileSync('./korean_name.txt', 'utf8');
    const names = koreanNames.split('\r\n');
    for (const name of names) {
      try {
        const result = await this.hanjaService.hanja(name);
        fs.writeFileSync(
          `./hanja/${name}.json`,
          JSON.stringify(result, null, 2),
        );
      } catch (error) {
        fs.writeFileSync(
          `./hanja/${name}-error.json`,
          JSON.stringify(error, null, 2),
        );
      }
    }
    return 'done';
  }
}
