const express = require("express");
const { MongoClient } = require("mongodb");
const uri =
  "mongodb+srv://Rikke:2607@cluster0.gwqbdq7.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri);
const PORT = process.env.PORT || 3001;

const app = express();
const expressWs = require("express-ws")(app);
const routeRegions = require("./routes/regions.js");

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

//routing
app.use(routeRegions);

process.on("SIGINT", async () => {
  await client.close();
  console.log("Приложение завершило работу");
  process.exit();
});

const { Api, TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const input = require("input");

const apiId = 17620472;
const apiHash = "402a0787337887b617443fd09a7f3329";
let stringSession = new StringSession(
  `1AgAOMTQ5LjE1NC4xNjcuNTABu3DTDewmo9v59EJN66qooGOx62KgRqLb1jjGbvE00f1+klztcdfBKVIy5LBqOpfto/RidbMuUwRY/FtFx74RvT2gcAt2LKt39SrCapiLsaGgOkaY3xgK0wJDCS1xbowFzEmRqHhZCffNMT+CS+eOa+/cV4ppbwfIzAg25YPgyhXzcStCyAK5QCksqwtB9OYoXQBoK2rILgEbXN6rng14LA5cLCWAtqKEpL9j83lbJ+Jc5EyZPdgRTUFB0YT+i/TLJZFwH84+g8Q+K8YImqioFlvyAkqMf019VGahDFH4T3y4/E0Cs9Nk6QDlV7U65tTzcWBgJIn2LeHOYtFhEY2EP8Q=`
);

const clientTelegram = new TelegramClient(stringSession, apiId, apiHash, {});

let pts = 19935; // TODO: get the pts value from previously saved message
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

//Functions for parse message

function isTooManyUpdates(response) {
  return response && response.className === "updates.ChannelDifferenceTooLong";
}

function isNewMessagesResponse(response) {
  return response && response.className === "updates.ChannelDifference";
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

// problems with websocket connection
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
  /*   app.ws("/ws", async (ws, req) => { */
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

      try {
        for (let oneRegion of parsedMessages) {
          /*   await ws.send(
              JSON.stringify({
                region: oneRegion.region,
                alert: oneRegion.alert,
                changed: oneRegion.changed,
              })
            ); */

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
  /*  }); */
})();

module.exports = app;
