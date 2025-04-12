import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class OpenAIService {
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get('OPENAI_API_KEY'),
    });
  }

  async analyzeReviews(reviews: {text: string }[]) {
    const prompt = `다음은 앱 리뷰들입니다. 이 리뷰들을 분석하여 앱의 주요 특징, 장점, 단점을 파악해주세요.

리뷰들:
${reviews.map((review) => `-: ${review.text}`).join('\n')}

분석 결과를 notion에 복붙해서 보게 마크다운 형식으로 작성해주고 다음과 같은 형식으로 제공해주세요: 
## 주요 특징

## 장점

## 단점`;

    const completion = await this.openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: "gpt-4o",
    });

    return completion.choices[0].message.content;
  }
} 