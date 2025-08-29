import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import puppeteer from 'puppeteer';

export class HanjaResponse {
  text: string;
  hanja: {
    text: string;
    meaning: string;
    strokeCount: string;
  }[];
}

interface HanjaEntry {
  hanja: string; // 한자 (하나 이상 가능)
  meanings: string[]; // 뜻 목록 (쉼표로 구분)
  strokes: number; // 획수
  original: string; // 원본 문자열(디버깅용)
}

@Injectable()
export class HanjaService {
  private readonly logger = new Logger(HanjaService.name);
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

    // .hanja-box 클래스를 가진 요소들을 찾아서 텍스트를 추출
    const result = await page.evaluate(() => {
      const hanjaBoxes = document.querySelectorAll('.hanja-box');
      /**
       * 아래의 응답을 HanjaResponse 타입으로 변환
       * 
       * [
  "㬃 대 13획 㬣 대 18획 䚟 대 15획 代 대신할 5획 儓 하인 16획 坮 대, 8획 垈 집터, 8획 大 큰 3획 對 마주볼, 대답할 14획 岱 태산 8획 帶 띠, 데 11획 待 기다릴, 대접할 9획 懟 원망할 18획 戴 일, 받들 18획 抬 볼기칠 8획 擡 들 17획 旲 해클 7획 杸 팔모진창, 칠 8획 柋 누에시렁 9획 檯 상 18획 汏 씻을 6획 玳 대모 9획 碓 방아 13획 臺 대 14획 袋 자루 11획 貸 빌릴, 용서할 12획 鐓 창고달 20획 隊 대오 12획 黛 눈썹먹 17획",
  "僌 웅 13획 熊 곰 14획 雄 수컷 12획"
]
       */
      return Array.from(hanjaBoxes).map((hanjaBox) => {
        const text = hanjaBox?.textContent.trim().replace(/\s+/g, ' ');
        //'획'이라는 단어를 끝으면서 하나의 묵음으로 나누고 그 묵음을 기준으로 나누어서 배열로 반환. 묵음으로 나눌 때 '획' 이 처음있는 곳까지 얻어서 가져온다음 가공하고 짜르는 방법으로
        return text;
      });
    });

    const response: HanjaResponse[] = [];
    result.forEach((t, index) => {
      const a = new HanjaResponse();
      a.text = text.split('')[index];
      a.hanja = [];
      while (true) {
        const hanjaIdx = t.indexOf('획');
        if (hanjaIdx === -1) {
          break;
        }
        this.logger.log(t);

        const hanjaText = t.slice(0, hanjaIdx);
        this.logger.log(hanjaText);
        const hanjaTexts = this.parseHanjaLine(hanjaText);
        this.logger.log(hanjaTexts);
        a.hanja.push({
          text: hanjaTexts.hanja,
          meaning: hanjaTexts.meanings
            .map((m) => m.replace(/\//g, '').trim())
            .join(','),
          strokeCount: hanjaTexts.strokes.toString(),
        });
        t = t.slice(hanjaIdx + 1);
      }
      response.push(a);
    });
    await browser.close();
    return response;
  }

  parseHanjaLine(input: string): HanjaEntry {
    const raw = input.trim();

    // 바깥 큰따옴표가 있으면 제거
    const s = raw.replace(/^"(.*)"$/, '$1').trim();

    // 한자 스크립트(확장 포함) + 공백 + 숫자 아닌 뜻 구간 + 공백 + 숫자
    // meanings 구간은 마지막 숫자(획수) 앞까지 전부 먹는다.
    const re =
      /^(?<hanja>[\p{Script=Han}\u3400-\u9FFF\uF900-\uFAFF\u{20000}-\u{2A6DF}]+)\s+(?<meanings>[^0-9]+?)\s+(?<strokes>\d+)\s*$/u;

    const m = s.match(re);
    if (!m || !m.groups) {
      throw new Error(`형식을 파싱할 수 없습니다: ${input}`);
    }

    const hanja = m.groups.hanja;
    const meaningsPart = m.groups.meanings;
    const strokes = Number(m.groups.strokes);

    if (!Number.isInteger(strokes) || strokes <= 0) {
      throw new Error(`획수는 양의 정수여야 합니다: ${m.groups.strokes}`);
    }

    // 뜻은 쉼표(,) 기준으로 분리, 공백 제거, 빈 항목 제거
    const meanings = meaningsPart
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    return { hanja, meanings, strokes, original: input };
  }

  /**
   * 여러 줄(또는 줄바꿈 포함 문자열)을 파싱합니다.
   * 빈 줄과 주석(//)은 건너뜀.
   */
  parseHanjaLines(lines: string | string[]): HanjaEntry[] {
    const arr = Array.isArray(lines) ? lines : lines.split(/\r?\n/);
    const out: HanjaEntry[] = [];
    for (const line of arr) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('//')) continue;
      out.push(this.parseHanjaLine(trimmed));
    }
    return out;
  }
}
