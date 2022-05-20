import { path } from "ramda";

export const getFromAPI = (app, conf, log) => async (method, args, cb) => {
  log("Web Request Method:", method, "args", args);
  makeWebRequest(app, conf.botToken, log, method, args, cb);
};

export const postToAPI = (app, conf, log) => (method, args, cb) => {
  log("Web Request Method:", method, "args", args);
  makeWebRequest(app, conf.botToken, log, method, args, cb);
};

const makeWebRequest = async (app, token, log, method, args, callback) => {
  const methodPath = method.split(".");
  try {
    const result = await path(
      methodPath,
      app.client
    )({
      token: token,
      ...args,
    });
    log(result);
    callback(null, result);
  } catch (error) {
    log(error);
  }
};
