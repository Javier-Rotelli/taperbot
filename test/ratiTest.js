/* eslint-env mocha */

import sinon from "sinon";
const EventEmitter = require("events").EventEmitter;
import createDebug from "debug";

import rati from "../src/plugins/rati";

const log = createDebug("taperbot:core");

const config = {
  channel: "G06E6NZ89",
  cook: "COOK",
};

const getReactionPayload = (messageTime, reactionTime) => {
  return {
    type: "reaction_added",
    user: "U0XP25ZMJ",
    item: {
      type: "message",
      channel: "G06E6NZ89",
      ts: messageTime.getTime() / 1000,
    },
    reaction: "the_horns::skin-tone-3",
    item_user: "COOK",
    event_ts: reactionTime.getTime() / 1000,
    ts: reactionTime.getTime() / 1000,
  };
};

describe("Test rati plugin", function () {
  it("should send a message when the days differ", function (done) {
    const emitter = new EventEmitter();
    const spy = sinon.spy();

    emitter.on("send:message", spy);

    rati({ config, emitter, log });
    emitter.emit(
      "reaction:added",
      getReactionPayload(new Date(2017, 3, 2), new Date(2017, 3, 3))
    );
    sinon.assert.calledOnce(spy);
    done();
  });

  it("should not send a message when the days are equal", function (done) {
    const emitter = new EventEmitter();
    const spy = sinon.spy();

    emitter.on("send:message", spy);

    rati({ config, emitter, log });
    emitter.emit(
      "reaction:added",
      getReactionPayload(new Date(2017, 3, 2), new Date(2017, 3, 2))
    );
    sinon.assert.notCalled(spy);
    done();
  });

  it("should mention the offending user", function (done) {
    const emitter = new EventEmitter();
    const spy = sinon.spy();

    emitter.on("send:message", spy);

    rati({ config, emitter, log });
    emitter.emit(
      "reaction:added",
      getReactionPayload(new Date(2017, 3, 2), new Date(2017, 3, 3))
    );
    sinon.assert.calledWith(spy, sinon.match("<@U0XP25ZMJ>"), "G06E6NZ89");
    done();
  });
});
