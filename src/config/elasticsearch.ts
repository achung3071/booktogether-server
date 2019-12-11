import { Client } from "@elastic/elasticsearch";
import migrateBooks from "./esmigration/migrateBooks";
import migrateReviews from "./esmigration/migrateReviews";
import dotenv from "dotenv";
dotenv.config();

const client: Client = new Client({
  node: process.env.ELASTICSEARCH_URL
});

const settings = {
  analysis: {
    filter: {
      autocomplete_filter: {
        type: "edge_ngram",
        min_gram: 1,
        max_gram: 40
      }
    },
    analyzer: {
      autocomplete: {
        filter: ["lowercase", "autocomplete_filter"],
        type: "custom",
        tokenizer: "whitespace"
      }
    }
  }
};

const booksBody = {
  settings,
  mappings: {
    properties: {
      authors: {
        type: "text",
        analyzer: "autocomplete"
      },
      title: {
        type: "text",
        analyzer: "autocomplete"
      }
    }
  }
};

const reviewsBody = {
  settings,
  mappings: {
    properties: {
      author: {
        type: "nested",
        properties: {
          name: { type: "text", analyzer: "autocomplete" }
        }
      },
      books: {
        type: "nested",
        properties: {
          title: { type: "text", analyzer: "autocomplete" }
        }
      },
      title: {
        type: "text",
        analyzer: "autocomplete"
      },
      published: { type: "boolean" }
    }
  }
};

(async (): Promise<void> => {
  try {
    // await client.indices.delete({ index: "books" });
    // await client.indices.delete({ index: "reviews" });
    const booksIndex = await client.indices.exists({ index: "books" });
    const reviewsIndex = await client.indices.exists({ index: "reviews" });
    if (!booksIndex.body) {
      await client.indices.create({ index: "books", body: booksBody });
      migrateBooks();
    }
    if (!reviewsIndex.body) {
      await client.indices.create({ index: "reviews", body: reviewsBody });
      migrateReviews();
    }
  } catch (error) {
    console.log(error);
  }
})();

export default client;
