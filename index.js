const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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
    const bookSellCollection = database.collection("soldbooks");
    const userCollection = database.collection("user");

    //Users-----------------------
    app.get("/api/users", async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    app.delete("/api/users/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const query = ObjectId.isValid(id)
          ? { _id: new ObjectId(id) }
          : { id };

        const result = await userCollection.deleteOne(query);

        if (result.deletedCount === 0) {
          return res.status(404).json({ message: "User not found" });
        }

        res.send(result);
      } catch (error) {
        console.error("Delete user error:", error);
        res.status(400).json({ message: "Failed to delete user" });
      }
    });

    //Ebooks------------------
    app.get("/api/ebooks", async (req, res) => {
      const query = {};
      if (req.query.writerEmail) query.writerEmail = req.query.writerEmail;
      if (req.query.status) query.status = req.query.status;
      // handle limit
      const limit = parseInt(req.query.limit) || 0;
      const cursor = ebookCollection.find(query).limit(limit);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/api/ebooks/:id", async (req, res) => {
      const id = req.params.id;
      const query = {
        _id: new ObjectId(id),
      };
      const result = await ebookCollection.findOne(query);
      res.send(result);
    });

    app.delete("/api/ebooks/:id", async (req, res) => {
      const query = { _id: new ObjectId(req.params.id) };
      const result = await ebookCollection.deleteOne(query);
      res.send(result);
    });

    // Add New Ebook------------------
    app.post("/api/ebooks", async (req, res) => {
      const data = req.body;
      const ebook = { ...data, createdAt: new Date() };
      const result = await ebookCollection.insertOne(ebook);
      res.send(result);
    });

    //Update Status---------------------
    app.patch("/api/ebooks/:id", async (req, res) => {
      const id = req.params.id;
      const updatedBook = req.body;
      const query = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          status: updatedBook.status,
        },
      };
      const result = await ebookCollection.updateOne(query, updatedDoc);
      res.send(result);
    });

    //Sold Books------------------
    app.get("/api/soldbooks", async (req, res) => {
      const query = {};
      if (req.query.buyerId) {
        query.buyerId = req.query.buyerId;
      }
      if (req.query.bookId) {
        query.bookId = req.query.bookId;
      }
      const cursor = bookSellCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.post("/api/soldbooks", async (req, res) => {
      const soldBook = req.body;
      const soldBooks = {
        ...soldBook,
        createdAt: new Date(),
      };
      const result = await bookSellCollection.insertOne(soldBooks);
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
