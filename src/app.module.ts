import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './controllers/app.controller';
import { PlayStoreService } from './services/play-store.service';
import { OpenAIService } from './services/openai.service';
import { HanjaService } from './services/hanja.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [AppController],
  providers: [PlayStoreService, OpenAIService, HanjaService],
})
export class AppModule {}
