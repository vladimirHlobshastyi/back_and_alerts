const express = require("express");
let router = express.Router();
const jsonParser = express.json();
const { MongoClient } = require("mongodb");
const uri =
  "mongodb+srv://Rikke:2607@cluster0.gwqbdq7.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri);

router.get("/all_regions", async (req, res) => {
  try {
    const regions = await client.db().collection("regions").find().toArray();
    res.send(regions[0].data);
  } catch (err) {
    return console.log(err);
  }
});

router.get("/region/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const region = await client.db().collection("regions").find().toArray();
    res.send(region[0].data[id]);
  } catch (err) {
    return console.log(err);
  }
});

router.post("/region", jsonParser, async (req, res) => {
  if (!req.body) return res.sendStatus(400);

  const id = req.body.id;
  const alert = req.body.alert;
  const changed = req.body.changed;

  try {
    const setChangesInRegion = await client
      .db()
      .collection("regions")
      .updateOne(
        { data: { $elemMatch: { id: id } } },
        { $set: { "data.$.alert": alert, "data.$.changed": changed } }
      );

    res.send(setChangesInRegion);
  } catch (err) {
    return console.log(err);
  }
});

module.exports = router;
