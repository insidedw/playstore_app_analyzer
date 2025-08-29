import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PlayStoreService {
  private readonly languages = [
    'en',
    'ar',
    'de',
    'es',
    'fr',
    'it',
    'ja',
    'ko',
    'zh-TW',
    'zh',
  ];

  constructor(private configService: ConfigService) {}

  private async getReviewsForLanguage(
    page: puppeteer.Page,
    appId: string,
    language: string,
  ) {
    console.log(
      `[PlayStoreService] Fetching reviews for language: ${language}`,
    );

    const url = `${this.configService.get('PLAY_STORE_URL')}${appId}&hl=${language}&gl=KR`;
    console.log(`[PlayStoreService] Navigating to URL: ${url}`);

    await page.goto(url, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });
    console.log(`[PlayStoreService] Page loaded successfully for ${language}`);

    // 페이지가 완전히 로드될 때까지 대기
    console.log(`[PlayStoreService] Waiting for page to fully load...`);
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // 리뷰 섹션으로 스크롤
    console.log(`[PlayStoreService] Scrolling to reviews section...`);
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight * 0.8);
    });

    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 리뷰 내용 수집
    console.log(`[PlayStoreService] Collecting reviews for ${language}...`);
    const reviews = await page.evaluate(() => {
      const reviewElements = document.querySelectorAll('.h3YV2d');
      return Array.from(reviewElements)
        .map((element) => {
          const text = element.textContent?.trim() || '';
          return { text };
        })
        .filter((review) => review.text.length > 0);
    });

    console.log(
      `[PlayStoreService] Found ${reviews.length} reviews for ${language}`,
    );
    return reviews;
  }

  async getAppReviews(appId: string) {
    console.log(
      `[PlayStoreService] Starting to fetch reviews for app: ${appId}`,
    );

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    console.log('[PlayStoreService] Browser launched successfully');

    const page = await browser.newPage();
    console.log('[PlayStoreService] New page created');

    // User-Agent 설정
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    );
    console.log('[PlayStoreService] User-Agent set');

    try {
      const allReviews = [];

      for (const language of this.languages) {
        try {
          const reviews = await this.getReviewsForLanguage(
            page,
            appId,
            language,
          );
          allReviews.push(
            ...reviews.map((review) => ({
              ...review,
              language,
            })),
          );
        } catch (error) {
          console.error(
            `[PlayStoreService] Error fetching reviews for ${language}:`,
            error,
          );
          // Continue with next language even if one fails
          continue;
        }
      }

      console.log(
        `[PlayStoreService] Total reviews collected across all languages: ${allReviews.length}`,
      );
      return allReviews;
    } catch (error) {
      console.error('[PlayStoreService] Error in getAppReviews:', error);
      throw error;
    } finally {
      console.log('[PlayStoreService] Closing browser...');
      await browser.close();
      console.log('[PlayStoreService] Browser closed');
    }
  }
}
