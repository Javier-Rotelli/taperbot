import eventTypes from "./eventTypes";

export const getUsers = async (emitter) => {
  return new Promise((resolve, reject) => {
    emitter.emit(eventTypes.OUT.webGet, "users.list", {}, (err, response) => {
      if (err) {
        reject(err);
      }
      resolve(response.members);
    });
  });
};

export const getChannels = async (emitter) => {
  return new Promise((resolve, reject) => {
    emitter.emit(
      eventTypes.OUT.webGet,
      "conversations.list",
      {
        types: "private_channel",
        exclude_archived: true,
      },
      (err, response) => {
        if (err) {
          reject(err);
        }
        resolve(response.channels);
      }
    );
  });
};

export const userToString = (u) => {
  return u.startsWith("_") ? ` ${u}` : ` <@${u}>`;
};
