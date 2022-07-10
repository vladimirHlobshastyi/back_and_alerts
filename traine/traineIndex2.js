const mongoose = require("mongoose");
const router = require("./traineRoutes");
const express = require("express");
const PORT = /* proces.env.PORT ||  */ 3000;

const app = express();

app.use(express.json());
app.use("/routes", router);

const start = async () => {
  try {
    await mongoose.connect(
      "mongodb+srv://Rikke:2607@cluster0.gwqbdq7.mongodb.net/?retryWrites=true&w=majority"
    );
    app.listen(PORT, () => {
      console.log(`server work in ${PORT} port`);
    });
  } catch (err) {
    console.log(err);
  }
};

start();
/* 
const Schema = mongoose.Schema;

const SomeModelSchema = new Schema({
  a_string: String,
  a_date: Date,
});

const SomeModel = mongoose.model("SomeModel", SomeModelSchema);
 */
