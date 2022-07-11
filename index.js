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
  try {
    const regions = await client.db().collection("regions").find().toArray();
    res.send(regions[0].data);
  } catch (err) {
    return console.log(err);
  }
});

app.get("/region/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const region = await client.db().collection("regions").find().toArray();
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

//

const { Api, TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const input = require("input");
const fs = require("fs").promises;
const path = require("path");

const newMessage = path.resolve("./", `newMessage.json`);

const apiId = 17620472;
const apiHash = "402a0787337887b617443fd09a7f3329";
let stringSession = new StringSession(
  `1AgAOMTQ5LjE1NC4xNjcuNTABu3lDMHm0X08BNUyA6B2QzN28pIkiHlrSRoMkgoOfGdS894bVG6pxnjYTxpCTePl/TbNzkDb4SlUhgle+7nxffyuBGIjr6bkDbM2W2wFC++wmuwv3MkgXTAoKhG7YJbsBa+W6QVstIF7co7EIRwKFQVMzkNDv04IgyRnFIhNYHOid61ZftL5LsfnkAYZ7xWB0Ark5QVSxSnbU0KnMoaYarExprntabierxvTxuf7cHQNx/wgxE1spYEXQ6NKV5l+vDDwayvroDBFsfYU0C+FqhakBY9T5s65ZbGb0q1ptoepnK0M5cDJhomHgHEHs/wpPUfoO79qsGzQHJPisZ2jH+DM=`
);

const clientTelegram = new TelegramClient(stringSession, apiId, apiHash, {});

let pts = 17300; // TODO: get the pts value from previously saved message
let messagesToPoll = 1;
let pollingInterval = 10 * 1000;

function getNewMessages(pts, limit) {
  return clientTelegram.invoke(
    new Api.updates.GetChannelDifference({
      channel: "air_alert_ua",
      filter: new Api.ChannelMessagesFilterEmpty(),
      pts,
      limit,
      force: true,
    })
  );
}

function isTooManyUpdates(response) {
  return response && response.className === "updates.ChannelDifferenceTooLong";
}

function isNewMessagesResponse(response) {
  return response && response.className === "updates.ChannelDifference";
}

async function writeMessagesToFile(data, file) {
  try {
    // write received messages to the local file
    await fs.writeFile(file, JSON.stringify(data));
  } catch (err) {
    console.log("Append file error: ", err.message);
    await fs.writeFile(file, JSON.stringify(data));
  }
}

function alarmState(message) {
  if (message.includes("Повітряна тривога в")) {
    return true;
  } else {
    return false;
  }
}

function getRegion(message) {
  return message.match(/(?<=\#)(.*?)$/g)[0];
}

function getTime(message) {
  return new Date(message.date * 1000).toLocaleTimeString();
}

function parseMessages(messages) {
  let parsedMessages = messages.map((messageData) => {
    return {
      region: getRegion(messageData.message),
      alert: alarmState(messageData.message),
      changed: getTime(messageData),
    };
  });

  return parsedMessages;
}

(async function () {
  // for initial req only - to get the StringSession value
  /*  await client.start({
    phoneNumber: async () => await input.text("Please enter your number: "),
    password: async () => await input.text("Please enter your password: "),
    phoneCode: async () =>
      await input.text("Please enter the code you received: "),
    onError: (err) => console.log(err),
  });
  stringSession = client.session.save();
  console.log(stringSession); */

  await clientTelegram.connect();

  setInterval(async () => {
    console.log("Sending request...");
    console.log("pts: ", pts);
    let result = await getNewMessages(pts, messagesToPoll);

    // too many new messages available, try to read them all before proceeding
    while (isTooManyUpdates(result)) {
      messagesToPoll += 50;
      console.log(
        "Too many updates, increasing the receiving messages number to ",
        messagesToPoll
      );
      result = await getNewMessages(pts, messagesToPoll);
    }

    if (isNewMessagesResponse(result)) {
      const parsedMessages = parseMessages(result.newMessages);
      //add new message document for debugging
      await writeMessagesToFile(parsedMessages, newMessage);
      try {
        for (let oneRegion of parsedMessages) {
          await client
            .db()
            .collection("regions")
            .updateOne(
              { data: { $elemMatch: { name: oneRegion.region } } },
              {
                $set: {
                  "data.$.alert": oneRegion.alert,
                  "data.$.changed": oneRegion.changed,
                },
              }
            );
        }
      } catch (err) {
        return console.log(err);
      }
      pts = result.pts;
      messagesToPoll = 1; // decreasing the messages number to initial

      console.log(
        "Got the response, number of new messages: ",
        result.newMessages.length
      );
    } else {
      console.log("No updates");
    }
  }, pollingInterval);
})();

///
//module.exports = app;
