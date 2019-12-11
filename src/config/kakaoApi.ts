import Book from "../models/Book";
import axios from "axios";
import cheerio from "cheerio";
import { Document } from "mongoose";
import puppeteer from "puppeteer";

const BASE_URL = "https://dapi.kakao.com/v3/search/book";

/* Response body:
{
  documents: [{authors, contents, datetime, isbn, price, publisher,
    sale_price, status, thumbnail, title, translators, url}],
  meta: { is_end, pageable_count, total_count }
} */

function handleTitle(title: string): string {
  let newTitle = "";
  let shouldInclude = true;
  for (const letter of title) {
    if (letter === "(" && shouldInclude) {
      shouldInclude = false;
    }
    if (shouldInclude) {
      newTitle += letter;
    }
    if (letter === ")" && !shouldInclude) {
      shouldInclude = true;
    }
  }
  return newTitle;
}

async function searchApi(publisher: string, page: number): Promise<void> {
  const url = `${BASE_URL}?target=publisher&query=${encodeURI(
    publisher
  )}&size=50&page=${page}`;
  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `KakaoAK ${process.env.KAKAO_API_KEY}`
      }
    });
    const data = response.data;
    const books = data.documents;

    for (const entry of books) {
      const avoidWords = [
        "찬송가",
        "성경",
        "세트",
        "샘플",
        "컬러링북",
        "ebook",
        "epub",
        "sample"
      ];
      if (avoidWords.some(word => entry.title.toLowerCase().includes(word))) {
        continue;
      } else {
        const { title, authors } = entry;
        const match = await Book.findOne({ title, authors });
        if (match && match.isbn !== entry.isbn) {
          continue; // If it is a different version of the same book, continue
        }
      }
      const browser = await puppeteer.launch();
      const browserPage = await browser.newPage();
      const html = await browserPage
        .goto(entry.url)
        .then(() => browserPage.content());
      browser.close();
      const $ = cheerio.load(html);
      const elDesc = $("p.desc").get(0);
      if (!elDesc.parent.attribs.class.includes("hide")) {
        let description = "";
        elDesc.children.forEach((textNode: any) => {
          const text = textNode.data === undefined ? "\n" : textNode.data;
          description += text;
        });
        entry.contents = description.trim();
      }
      entry.title = handleTitle(entry.title);
      const existing = await Book.findOne({ isbn: entry.isbn });
      if (existing) {
        await Book.findByIdAndUpdate(existing.id, entry);
      } else {
        const book: Document = new Book(entry);
        await book.save();
      }
    }

    if (!data.meta.is_end) {
      await searchApi(publisher, page + 1);
    }
  } catch (error) {
    console.log(error.message);
  }
}

// Connect to database and fetch / save books
const kakaoApiToDB = async () => {
  console.log("MIGRATING KAKAO BOOKS TO DB:::");
  const publishers: string[] = [
    "위즈덤하우스",
    "시공사",
    "문학동네",
    "김영사",
    "창비",
    "웅진씽크빅",
    "길벗",
    "민음사",
    "알에이치코리아",
    "다산북스",
    "학지사",
    "아가페출판사",
    "비룡소",
    "한빛미디어",
    "박영사",
    "쌤앤파커스",
    "계림북스",
    "을유문화사",
    "자음과모음",
    "개암나무",
    "문학수첩",
    "인플루엔셜"
  ];
  // Divide webscraping publishers into batches to prevent CPU overload
  try {
    for (let i = 0; i < publishers.length; i += 3) {
      const batch = publishers.slice(i, i + 3);
      await Promise.all(batch.map(publisher => searchApi(publisher, 1)));
    }
  } catch (error) {
    console.log("ERROR while calling Kakao API:", error.message);
  }
};

export default kakaoApiToDB;
