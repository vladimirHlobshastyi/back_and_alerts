/* const { MongoCLient } = require("mongodb");
//const express = require("express");
//const PORT = 3002;
//const app = express();
const client = new MongoClient(
  "mongodb+srv://rikke:2607@cluster0.gwqbdq7.mongodb.net/?retryWrites=true&w=majority"
);

const start = async () => {
  try {
    // app.listen(PORT, () => console.log(PORT));
    await client.connect();
    console.log("working!");
    //  await client.db().createCollection();
  } catch (e) {
    console.log(e);
  }
};

start();
 */
const { MongoClient, ServerApiVersion } = require("mongodb");
const uri =
  "mongodb+srv://Rikke:2607@cluster0.gwqbdq7.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

const start = async () => {
  try {
    // app.listen(PORT, () => console.log(PORT));
    await client.connect();
    console.log("working!!!!!!!!!!!!!!!");

    // await client.db().createCollection("regions");
    const region = await client.db().collection("regions");
    //const results = await region.find({ data }).toArray();
    // const results = await region.findOne({ data: [{id:2}] });
    // await region.insertOne({data2:2});
    // const count = await region.countDocuments();
    //const result = await collection.deleteOne({name: "Bob"});
    //const result = await collection.deleteMany({name: "Tom"});
    //const result = await collection.findOneAndDelete({age: 21});
    //const result = await collection.drop()
    //const result = await collection.findOneAndUpdate({age: 21}, { $set: {age: 25}});
    // const result = await collection.findOneAndUpdate({name: "Bob"}, { $set: {name: "Sam"}}, { returnDocument: "after" });
    //return NEW state after changed
    //const result = await collection.updateMany({name: "Sam"}, { $set: {name: "Bob"}});
    // const result = await collection.updateOne({name: "Tom"}, { $set: {name: "Tom Junior", age:33}});
    //console.log(`В коллекции users ${count} документов`);
    console.log(results);
  } catch (e) {
    console.log(e);
  } finally {
    await client.close();
  }
};

start();
