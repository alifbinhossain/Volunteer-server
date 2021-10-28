const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const ObjectId = require("mongodb").ObjectId;
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(express.json());
app.use(cors());

//CLIENT SETUP
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xwgkc.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function server() {
  try {
    await client.connect();
    const database = client.db("volunteer_db");
    const eventCollection = database.collection("events");
    const volunteersCollection = database.collection("volunteers");

    //EVENTS GET API
    app.get("/events", async (req, res) => {
      const cursor = eventCollection.find({});
      const events = await cursor.toArray();

      res.json(events);
    });

    //EVENTS TITLE GET API
    app.get("/events/titles", async (req, res) => {
      const result = await eventCollection.distinct("title", {});
      res.json(result);
    });

    //CURRENT VOLUNTEER EVENTS GET API
    app.get("/volunteer/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const volunteerEvents = await volunteersCollection.find(query).toArray();

      const userEvents = await Promise.all(
        volunteerEvents.map(async (event) => {
          const title = event.event;
          const img = await eventCollection.findOne({ title: title });
          const newEvent = { ...event, img: img.img };
          return newEvent;
        })
      );
      res.json(userEvents);
    });

    //VOLUNTEER POST API
    app.post("/volunteer", async (req, res) => {
      const volunteer = req.body;
      const result = await volunteersCollection.insertOne(volunteer);
      res.json(result);
    });

    //VOLUNTEER DELETE EVENT API
    app.delete("/volunteer/event/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await volunteersCollection.deleteOne(query);

      res.json(result);
      console.log(result);
    });
  } finally {
    // await client.close();
  }
}

server().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello from volunteer server");
});

app.listen(port, () => {
  console.log("Server running on", port);
});
