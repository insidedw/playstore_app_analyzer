import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import puppeteer from 'puppeteer';

@Injectable()
export class HanjaService {
  constructor(private configService: ConfigService) {}

  async hanja(text: string) {
    const url = `${this.configService.get('HANJA_URL')}${encodeURIComponent(
      text,
    )}`;
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    );
    await page.goto(url, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    // .hanja-box 클래스를 가진 요소를 찾아서 텍스트를 추출
    const result = await page.evaluate(() => {
      const hanjaBox = document.querySelector('.hanja-box');
      return hanjaBox?.textContent;
    });

    await browser.close();
    return result;
  }
}
