const { Api, TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const input = require("input");
const fs = require("fs").promises;
const path = require("path");

const idRegionsMoc = {
  Вінницька_область: 1,
  Волінська_область: 2,
  Дніпропетровська_область: 3,
  Донецька_область: 4,
  Житомирська_область: 5,
  Закарпатська_область: 6,
  Запорізька_область: 7,
  Івано_франківська_обалсть: 8,
  Київська_область: 9,
  Кіровоградська_область: 10,
  Луганська_область: 11,
  Львівська_область: 12,
  Миколаївська_область: 13,
  Одеська_область: 14,
  Полтавська_область: 15,
  Рівенська_область: 16,
  Сумська_область: 17,
  Тернопільска_область: 18,
  Харківська_область: 19,
  Херсонська_область: 20,
  Хмельницька_область: 21,
  Черкаська_область: 22,
  Чернівецька_область: 23,
  Чернігівська_область: 24,
  Київ: 25,
  Крим: 0,
  Севастопіль: 100,
};

const messagesFile = path.resolve(
  "./src/api/testApi/messages",
  `${Date.now()}.json`
);
const parsedMessagesFile = path.resolve(
  "./src/api/testApi/messages",
  `${Date.now()}_parsed.json`
);
const newMessage = path.resolve(
  "./src/api/testApi/messages",
  `newMessage.json`
);

const apiId = 17620472;
const apiHash = "402a0787337887b617443fd09a7f3329";
let stringSession = new StringSession(
  `1AgAOMTQ5LjE1NC4xNjcuNTABu3lDMHm0X08BNUyA6B2QzN28pIkiHlrSRoMkgoOfGdS894bVG6pxnjYTxpCTePl/TbNzkDb4SlUhgle+7nxffyuBGIjr6bkDbM2W2wFC++wmuwv3MkgXTAoKhG7YJbsBa+W6QVstIF7co7EIRwKFQVMzkNDv04IgyRnFIhNYHOid61ZftL5LsfnkAYZ7xWB0Ark5QVSxSnbU0KnMoaYarExprntabierxvTxuf7cHQNx/wgxE1spYEXQ6NKV5l+vDDwayvroDBFsfYU0C+FqhakBY9T5s65ZbGb0q1ptoepnK0M5cDJhomHgHEHs/wpPUfoO79qsGzQHJPisZ2jH+DM=`
);

const client = new TelegramClient(stringSession, apiId, apiHash, {});

let pts = 17300; // TODO: get the pts value from previously saved message
let messagesToPoll = 1;
let pollingInterval = 10 * 1000; // 2 min

function getNewMessages(pts, limit) {
  return client.invoke(
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
  if (message.match(/🟢/)) return false;
  if (message.match(/🔴/)) return true;
  if (message.match(/🟡/)) return "partial";
}

function getRegion(message) {
  return message.match(/(?<=\#)(.*?)$/g)[0];
}

function getTime(message) {
  return new Date(message.date * 1000).toLocaleTimeString();
}

function getId(message) {
  const res = message.match(/(?<=\#)(.*?)$/g)[0];
  return idRegionsMoc[res] ? idRegionsMoc[res] : undefined;
}

function parseMessages(messages) {
  let parsedMessages = [];
  messages.forEach((messageData) => {
    let idMessageData = getId(messageData.message);

    if (idMessageData != undefined)
      parsedMessages.push({
        id: idMessageData,
        region: getRegion(messageData.message),
        alert: alarmState(messageData.message),
        time: getTime(messageData),
        timestamp: messageData.date,
      });
  });
  return parsedMessages;
}

(async function run() {
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

  await client.connect();

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
      await writeMessagesToFile(parsedMessages, newMessage);
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
