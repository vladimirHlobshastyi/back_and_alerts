const functionsForParseMessage = {
  isTooManyUpdates(response) {
    return (
      response && response.className === "updates.ChannelDifferenceTooLong"
    );
  },

  isNewMessagesResponse(response) {
    return response && response.className === "updates.ChannelDifference";
  },

  alarmState(message) {
    if (message.includes("Повітряна тривога в")) {
      return true;
    } else {
      return false;
    }
  },

  getRegion(message) {
    return message.match(/(?<=\#)(.*?)$/g)[0];
  },

  getTime(message) {
    return new Date(message.date * 1000).toLocaleTimeString();
  },

  parseMessages(messages) {
    let parsedMessages = messages.map((messageData) => {
      return {
        region: this.getRegion(messageData.message),
        alert: this.alarmState(messageData.message),
        changed: this.getTime(messageData),
      };
    });

    return parsedMessages;
  },
};

module.exports = functionsForParseMessage;
