const { MongoClient, ServerApiVersion } = require("mongodb");
const express = require("express");
const app = express();
const cors = require("cors");
const port = 5000;
require("dotenv").config();

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("Fable Ebook Server is Running!");
});

const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const database = client.db("fable_ebook");
    const ebookCollection = database.collection("ebooks");

    //Get Ebooks
    app.get("/api/ebooks", async (req, res) => {
      const query = {};
      if (req.query.writerEmail) {
        query.writerEmail = req.query.writerEmail;
      }
      if (req.query.status) {
        query.status = req.query.status;
      }
      const cursor = ebookCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // Add New Ebook
    app.post("/api/ebooks", async (req, res) => {
      const ebook = req.body;
      const result = await ebookCollection.insertOne(ebook);
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log("Fable MongoDB connected successfully!");
  } finally {
    // Connection stays open
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
