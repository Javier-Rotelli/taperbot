import eventTypes from "../eventTypes";
import splitWords from "../splitWords";

import { userToString } from "../slackUtils";

function removeLast(value, array) {
  let index = array.lastIndexOf(value);
  if (index >= 0) {
    return array.slice(0, index).concat(array.slice(index + 1));
  }
  return array;
}

/** @type { import("./plugin").TaperbotPlugin } */
export default ({ config, emitter, log, storage }) => {
  let store = storage.createStore(false, {
    messages: {},
  });
  const triggerReaction = config.reaction;
  const countReaction = config.countReaction;
  const reverseCountReaction = config.reverseCountReaction;
  const allTriggers = [
    triggerReaction,
    ...(countReaction && [countReaction]),
    ...(reverseCountReaction && [reverseCountReaction]),
  ];
  const defaultReactions = config.defaultReactions;
  const defaultReverseCountReactions = config.defaultReverseCountReactions;
  const countMessage = config.countMessage;
  const reverseCountMessage = config.reverseCountMessage;
  const ignoreUsers = config.ignoreUsers;
  const timeout = config.timeout;
  const messages = store.get(["messages"]);
  Object.keys(messages.value).forEach((k) => {
    const almuerzo = messages.get([k]);
    const ts = almuerzo.value.ts || k.split("-")[1];
    const timeoutDate = new Date(ts * 1000 + timeout);
    if (timeoutDate < new Date()) {
      // muy viejo, lo borramos
      almuerzo.set(undefined);
      return;
    }
    if (typeof almuerzo.value === "string") {
      return;
    }
    if (!almuerzo.value.triggers) {
      // migrar almuerzos existentes
      almuerzo.get(["triggers"]).set([triggerReaction]);
      almuerzo.get(["isCounting"]).set(false);
    }
    const reactions = almuerzo.get(["reactions"]);
    Object.keys(reactions.value).forEach((kk) => {
      const hu = reactions.get([kk, "hideUsers"]);
      if (!hu.value) {
        hu.set([]);
      }
    });
    fetchReactedUsers(
      almuerzo.value.channel,
      almuerzo.value.originalMessage,
      (error, reactedUsers) => {
        error && log(error);
        if (reactedUsers) {
          Object.keys(reactions.value).forEach((k) => {
            reactions
              .get([k, "current"])
              .set((current) => applyAll(current || [], reactedUsers[k] || []));
          });
          emitter.emit(
            eventTypes.OUT.webGet,
            "conversations.history",
            {
              channel: almuerzo.value.channel,
              latest: almuerzo.value.ts,
              oldest: almuerzo.value.ts,
              inclusive: true,
            },
            (error, response) => {
              error && log(error);
              let countMessage;
              if (
                response.ok &&
                (countMessage = response.messages[0]) &&
                countMessage.reactions
              ) {
                countMessage.reactions.forEach((r) => {
                  if (almuerzo.value.reactions[r.name]) {
                    almuerzo
                      .get(["reactions", r.name, "hideUsers"])
                      .set(r.users);
                  }
                });
              }
              updateMessage(k);
            }
          );
        }
      }
    );
  });

  function applyAll(previous, updated) {
    let retval = previous.concat(updated);
    previous.forEach((x) => {
      retval.splice(retval.lastIndexOf(x), 1);
    });
    return retval;
  }
  function updateMessage(key, isNew) {
    // the following changes to message can be recreated so they don't need to be in the file
    // but they don't bother being there (so we don't update to use the set() function here)
    let message = store.value.messages[key];
    if (typeof message === "string") {
      message = store.value.messages[message];
    }
    Object.values(message.reactions).forEach((r) => {
      const current = nonRepeated(r.current);
      if (message.isReverseCount && (current.length > 0 || !r.hideIfEmpty)) {
        r.original = current;
        r.final = message.allUsers.filter(
          (x) => r.original.indexOf(x) < 0 && r.hideUsers.indexOf(x) < 0
        );
        r.count = r.final.length;
        r.finalCount = r.count;
        r.up = [];
        r.down = [];
      } else if (message.isCounting) {
        r.original = current;
        r.count = current.length;
        r.finalCount = r.count;
        r.final = current.filter((x) => r.hideUsers.indexOf(x) < 0);
        r.up = [];
        r.down = [];
      } else {
        const original = nonRepeated(r.original);
        r.count = original.length;
        r.finalCount = Math.min(r.count, current.length);
        r.final = current.filter(
          (x, i) => i < r.count && r.hideUsers.indexOf(x) < 0
        );
        r.up = current.filter(
          (x, i) => i >= r.count && r.hideUsers.indexOf(x) < 0
        );
        r.down = original.filter(
          (x) => r.final.indexOf(x) < 0 && r.hideUsers.indexOf(x) < 0
        );
      }
    });
    const text = todayEat(message, (r) => {
      if (r.up.length > 0 || r.down.length > 0) {
        return (
          ":" +
          r.name +
          ":" +
          " - se " +
          (r.down.length > 1 ? "bajaron" : "bajo") +
          ": " +
          r.down.map(userToString).join(",") +
          " - " +
          (r.up.length > 1 ? "esperan" : "espera") +
          ": " +
          r.up.map(userToString).join(",") +
          "\n"
        );
      }
      return "";
    });
    if (isNew) {
      emitter.emit(
        eventTypes.OUT.webPost,
        "chat.postMessage",
        {
          channel: message.channel,
          text: text,
          link_names: false,
          as_user: true,
        },
        (err, response) => {
          err && log(err);
          store.get(["messages", key, "ts"]).set(response.ts);
          store.get(["messages", message.channel + "-" + response.ts]).set(key);
        }
      );
    } else {
      emitter.emit(
        eventTypes.OUT.webPost,
        "chat.update",
        {
          channel: message.channel,
          text: text,
          ts: message.ts,
        },
        (error) => {
          error && log(error);
        }
      );
    }
  }

  function typeFromTriggers(triggers) {
    const main = triggers.indexOf(triggerReaction) >= 0;
    const count = triggers.indexOf(countReaction) >= 0;
    const reverse = triggers.indexOf(reverseCountReaction) >= 0;
    return {
      isReverseCount: reverse,
      isCounting: (!main && count) || reverse,
    };
  }

  function titleFor(message) {
    return message.isReverseCount ? reverseCountMessage : countMessage;
  }

  function todayEat(message, block) {
    const reactions = message.reactions;
    return (
      titleFor(message) +
      "\n" +
      Object.values(reactions)
        .filter((x) => x.count > 0 || !x.hideIfEmpty)
        .map(
          (x) =>
            `:${x.name}: -> ` +
            x.count +
            x.final.map(userToString) +
            (x.count > x.final.length
              ? ` + ${x.count - x.finalCount} libre(s)`
              : "")
        )
        .join("\n") +
      ((block &&
        "\n" +
          Object.values(reactions)
            .map((r) => block(r))
            .join("\n")) ||
        "")
    );
  }

  function nonRepeated(array) {
    return array.filter((x, i, a) => a.indexOf(x) === i);
  }

  function matchingGroup(text, regex) {
    const result = regex.exec(text);
    return result && result.length > 1 && result[1];
  }

  function countFromText(text) {
    const words = splitWords(text);
    const reaction =
      words.length > 1 && matchingGroup(words[0], /:([^\s:]+):/i);
    return (
      reaction && {
        name: reaction,
        users: words
          .slice(1)
          .map((x) => matchingGroup(x, /<@(.*)>/i) || `_${x}_`),
      }
    );
  }

  function fetchReactedUsers(channel, ts, then) {
    emitter.emit(
      eventTypes.OUT.webGet,
      "conversations.history",
      {
        channel: channel,
        latest: ts,
        oldest: ts,
        inclusive: true,
      },
      (error, response) => {
        error && log(error);
        let originalMessage;
        if (response.ok && (originalMessage = response.messages[0])) {
          emitter.emit(
            eventTypes.OUT.webGet,
            "conversations.replies",
            {
              channel: channel,
              ts: ts,
              limit: 100,
            },
            (error, response) => {
              let submessages;
              if (response.ok && (submessages = response.messages)) {
                const reactedInMessages = submessages
                  .map((m) => countFromText(m.text))
                  .filter((x) => x);
                const reactedUsers = (originalMessage.reactions || [])
                  .concat(reactedInMessages)
                  .reduce((acc, r) => {
                    const name = r.name.split("::")[0];
                    return {
                      ...acc,
                      [name]: (acc[name] || []).concat(r.users),
                    };
                  }, {});
                then(null, reactedUsers, originalMessage);
              } else {
                then(error);
              }
            }
          );
        } else {
          then(error);
        }
      }
    );
  }

  emitter.on(eventTypes.IN.reactionAdded, (payload) => {
    const ts = payload.item.ts;
    const channel = payload.item.channel;
    const user = payload.user;
    const key = channel + "-" + ts;
    const reaction = payload.reaction.split("::")[0];
    const message = store.get(["messages", key]);
    if (allTriggers.indexOf(reaction) >= 0 && !message.value) {
      const triggers = [reaction];
      emitter.emit(
        eventTypes.OUT.startTyping,
        {
          channel: channel,
        },
        () => {}
      );
      const type = typeFromTriggers(triggers);
      !message.value &&
        fetchReactedUsers(channel, ts, (error, reactedUsers, slackMessage) => {
          error && log(error);
          if (reactedUsers) {
            const theDefaultReactions = type.isReverseCount
              ? defaultReverseCountReactions
              : defaultReactions;
            const reactedInMessage = [
              ...((slackMessage.text || "").match(/(:[^\s:]+:)/gim) || []),
            ]
              .map((x) => x.substring(1, x.length - 1))
              .filter((x) => !x.startsWith("skin-tone-"));
            const reactionsInfo = reactedInMessage
              .concat(theDefaultReactions)
              .reduce((acc, name) => {
                const users = reactedUsers[name] || [];
                return {
                  ...acc,
                  [name]: {
                    name: name,
                    count: nonRepeated(users).length,
                    hideIfEmpty:
                      reactedInMessage.indexOf(name) < 0 ||
                      reactedInMessage.length === 0,
                    original: users,
                    current: users.slice(),
                    hideUsers: [],
                    final: users.slice(),
                    up: [],
                    down: [],
                  },
                };
              }, {});
            if (Object.keys(reactionsInfo).length > 0) {
              emitter.emit(
                eventTypes.OUT.webGet,
                "conversations.members",
                {
                  channel: channel,
                },
                (error, response) => {
                  message.set({
                    channel: channel,
                    user: user,
                    originalMessage: ts,
                    triggers: triggers,
                    allUsers: !error
                      ? response.members.filter(
                          (x) => ignoreUsers.indexOf(x) < 0
                        )
                      : [],
                    reactions: reactionsInfo,
                    ...type,
                  });
                  updateMessage(key, true);
                }
              );
            }
          }
        });
    } else if (message.value) {
      if (typeof message.value === "string") {
        const mm = store.get(["messages", message.value]);
        const r = mm.get(["reactions", reaction]);
        if (r.value) {
          r.get(["hideUsers"]).set((array) => array.concat([payload.user]));
          updateMessage(key);
        }
      } else if (
        allTriggers.indexOf(reaction) >= 0 &&
        message.value.user === payload.user
      ) {
        const triggers = message.value.triggers.concat([reaction]);
        message.set((m) => ({ ...m, triggers, ...typeFromTriggers(triggers) }));
        updateMessage(key);
      } else {
        const r = message.get(["reactions", reaction]);
        if (r.value) {
          r.get(["current"]).set((c) => c.concat([payload.user]));
          updateMessage(key);
        }
      }
    }
  });
  emitter.on(eventTypes.IN.reactionRemoved, (payload) => {
    const ts = payload.item.ts;
    const channel = payload.item.channel;
    const key = channel + "-" + ts;
    const reaction = payload.reaction.split("::")[0];
    const message = store.get(["messages", key]);
    if (allTriggers.indexOf(reaction) < 0 && message.value) {
      if (typeof message.value === "string") {
        const hu = store.get([
          "messages",
          message.value,
          "reactions",
          reaction,
          "hideUsers",
        ]);
        const index = (hu.value || []).lastIndexOf(payload.user);
        if (index >= 0) {
          hu.set((hideUsers) =>
            (hideUsers || []).filter((item) => item !== payload.user)
          );
          updateMessage(key);
        }
      } else {
        message
          .get(["reactions", reaction, "current"])
          .set((current) => removeLast(payload.user, current));
        updateMessage(key);
      }
    } else if (
      allTriggers.indexOf(reaction) >= 0 &&
      message.get(["user"]).value === payload.user
    ) {
      if (message.value.triggers.length > 1) {
        const triggers = removeLast(reaction, message.value.triggers);
        messages.set((m) => ({
          ...m,
          triggers,
          ...typeFromTriggers(triggers),
        }));
        updateMessage(key);
        return;
      }
      emitter.emit(
        eventTypes.OUT.webPost,
        "chat.delete",
        {
          channel: message.channel,
          ts: message.ts,
        },
        (error) => {
          if (!error) {
            message.set(undefined);
          } else {
            log(error);
          }
        }
      );
    }
  });
  emitter.on(eventTypes.IN.receivedOtherMessage, (payload) => {
    const ts =
      payload.thread_ts ||
      (payload.previous_message && payload.previous_message.thread_ts);
    const channel = payload.channel;
    const key = channel + "-" + ts;
    const message = store.get(["messages", key]);
    if (!message.value) {
      return;
    }
    let newText;
    let oldText;
    if (!payload.subtype) {
      // added
      newText = payload.text;
      oldText = "";
    } else if (payload.subtype === "message_changed") {
      // modified
      newText = payload.message.text;
      oldText = payload.previous_message.text;
    } else if (payload.subtype === "message_deleted") {
      // deleted
      newText = "";
      oldText = payload.previous_message.text;
    }
    let r;
    const added = countFromText(newText);
    r = added && message.get(["reactions", added.name]);
    if (r && r.value) {
      r.get(["current"]).set((current) => current.concat(added.users));
    }
    const deleted = countFromText(oldText);
    r = deleted && message.get(["reactions", deleted.name]);
    if (r && r.value) {
      const current = r.get(["current"]);
      deleted.users.forEach((u) => {
        current.set((c) => removeLast(u, c));
      });
    }
    updateMessage(key);
  });
};
