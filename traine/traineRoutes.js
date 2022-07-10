const Router = require("express");
const router = new Router();
const region = require("./trainyRodels/Region");

router.get("/all_regions", async (req, res) => {
  try {
    res.json("its work");
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: "error" });
  }
});
router.get("/region/:id", async () => {});
router.post("/region", async (req, res) => {
  try {
    const { id, name, alert, changed } = req.body;

    /*  const test = region.findOneAndUpdate(
      { data: { $elemMatch: { id: 1 } } },
      { $set: { "data.$.alert": true } }
    ); */

    // test;
    /*  const newUs = await region.findAndUpdate(
      { id: 5 },
      { id, name, alert, changed },
      function (err) {
        console.log(err);
      }
    );
    newUs; */
    /* await newUs.save(); */

    return res.json("create newUser");
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: "error" });
  }
});

module.exports = router;
