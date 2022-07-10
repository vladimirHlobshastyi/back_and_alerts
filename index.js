const express = require("express");
const { MongoClient } = require("mongodb");
const uri =
  "mongodb+srv://Rikke:2607@cluster0.gwqbdq7.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri);
const PORT = process.env.PORT || 3000;

const app = express();
const jsonParser = express.json();

(async () => {
  try {
    await client.connect();
    const region = await client.db().collection("regions");
    app.locals.collection = region;
    await app.listen(PORT);
    console.log("Сервер ожидает подключения...");
  } catch (err) {
    return console.log(err);
  }
})();

app.get("/all_regions", async (req, res) => {
  const collection = req.app.locals.collection;

  try {
    const regions = await client.db().collection("regions").find().toArray();//<-
    res.send(regions[0].data);
  } catch (err) {
    return console.log(err);
  }
});

app.get("/region/:id", async (req, res) => {
  const id = req.params.id;//<-
  const collection = req.app.locals.collection;

  
  try {
    const region = await collection.find().toArray();
    res.send(region[0].data[id]);
  } catch (err) {
    return console.log(err);
  }
});

app.post("/region", jsonParser, async (req, res) => {
  if (!req.body) return res.sendStatus(400);

  const id = req.body.id;
  const alert = req.body.alert;
  const changed = req.body.changed;
  const collection = req.app.locals.collection;

  try {
  
    const setChangesInRegion = await collection.updateOne(
      { data: { $elemMatch: { id: id } } },
      { $set: { "data.$.alert": alert, "data.$.changed": changed } }
    );

    res.send(setChangesInRegion);
  } catch (err) {
    return console.log(err);
  }
});

process.on("SIGINT", async () => {
  await client.close();
  console.log("Приложение завершило работу");
  process.exit();
});
