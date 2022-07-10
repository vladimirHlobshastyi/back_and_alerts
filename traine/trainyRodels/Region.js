const { Schema, model } = require("mongoose");

const Region = new Schema({
  id: { type: String, unique: true },
  name: { type: String, unique: true },
  name_en: { type: String, unique: true },
  alert: { type: Boolean },
  changed: { type: String },
});

module.exports = model("regions", Region);
