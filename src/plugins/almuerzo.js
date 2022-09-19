import eventTypes from "../eventTypes";
import splitWords from "../splitWords";

import { userToString } from "../slackUtils";

const almuerzoFile = "data/almuerzo.json";

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
  const messages = store.value.messages;
  Object.keys(messages).forEach((k) => {
      const almuerzo = messages[k];
      const ts = almuerzo.ts || k.split("-")[1];
      const timeoutDate = new Date(ts * 1000 + timeout);
      if (timeoutDate < new Date()) {
        // muy viejo, lo borramos
        messages[k] = undefined;
        return;
      }
      if (typeof almuerzo === "string") {
        return;
      }
      if (!almuerzo.triggers) {
        // migrar almuerzos existentes
        almuerzo.triggers = [triggerReaction];
        almuerzo.isCounting = false;
      }
      Object.keys(almuerzo.reactions).forEach((kk) => {
        if (!almuerzo.reactions[kk].hideUsers) {
          almuerzo.reactions[kk].hideUsers = [];
        }
      });
      fetchReactedUsers(
        almuerzo.channel,
        almuerzo.originalMessage,
        (error, reactedUsers) => {
          if (reactedUsers) {
            Object.values(almuerzo.reactions).forEach((r) => {
              r.current = applyAll(r.current, reactedUsers[r.name] || []);
            });
            emitter.emit(
              eventTypes.OUT.webGet,
              "conversations.history",
              {
                channel: almuerzo.channel,
                latest: almuerzo.ts,
                oldest: almuerzo.ts,
                inclusive: true,
              },
              (error, response) => {
                let countMessage;
                if (
                  response.ok &&
                  (countMessage = response.messages[0]) &&
                  countMessage.reactions
                ) {
                  countMessage.reactions.forEach((r) => {
                    if (almuerzo.reactions[r.name]) {
                      almuerzo.reactions[r.name].hideUsers = r.users;
                    }
                  });
                  updateMessage(k);
                } else {
                  log(error);
                }
              }
            );
          } else {
            log(error);
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
    store.set(store.value); // storage api usage is not optimal // TODO: improve
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
          log(err);
          store.value.messages[key].ts = response.ts;
          store.value.messages[message.channel + "-" + response.ts] = key;
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
          log(error);
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
        log(error);
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
    if (allTriggers.indexOf(reaction) >= 0 && !store.value.messages[key]) {
      const triggers = [reaction];
      emitter.emit(
        eventTypes.OUT.startTyping,
        {
          channel: channel,
        },
        (_) => {}
      );
      const type = typeFromTriggers(triggers);
      !store.value.messages[key] &&
        fetchReactedUsers(channel, ts, (error, reactedUsers, message) => {
          if (reactedUsers) {
            const theDefaultReactions = type.isReverseCount
              ? defaultReverseCountReactions
              : defaultReactions;
            const reactedInMessage = [
              ...((message.text || "").match(/(:[^\s:]+:)/gim) || []),
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
                  store.value.messages[key] = {
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
                  };
                  updateMessage(key, true);
                }
              );
            }
          } else {
            log(error);
          }
        });
    } else if (store.value.messages[key]) {
      let m = store.value.messages[key];
      if (typeof m === "string") {
        const mm = store.value.messages[m];
        const r = mm.reactions[reaction];
        if (r) {
          r.hideUsers.push(payload.user);
          updateMessage(key);
        }
      } else if (
        allTriggers.indexOf(reaction) >= 0 &&
        m.user === payload.user
      ) {
        const m = store.value.messages[key];
        m.triggers.push(reaction);
        store.value.messages[key] = { ...m, ...typeFromTriggers(m.triggers) };
        updateMessage(key);
      } else {
        const r = m.reactions[reaction];
        if (r) {
          r.current.push(payload.user);
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
    if (allTriggers.indexOf(reaction) < 0 && store.value.messages[key]) {
      if (typeof store.value.messages[key] === "string") {
        const r = store.value.messages[store.value.messages[key]].reactions[reaction];
        const index = r ? r.hideUsers.lastIndexOf(payload.user) : -1;
        if (index >= 0) {
          r.hideUsers.splice(index, 1);
          updateMessage(key);
        }
      } else {
        const r = store.value.messages[key].reactions[reaction];
        const index = r ? r.current.lastIndexOf(payload.user) : -1;
        if (index >= 0) {
          r.current.splice(index, 1);
          updateMessage(key);
        }
      }
    } else if (
      allTriggers.indexOf(reaction) >= 0 &&
      store.value.messages[key] &&
      store.value.messages[key].user === payload.user
    ) {
      const m = store.value.messages[key];
      log(m);
      if (m.triggers.length > 1) {
        const index = m.triggers.lastIndexOf(reaction);
        if (index >= 0) {
          m.triggers.splice(index, 1);
          store.value.messages[key] = { ...m, ...typeFromTriggers(m.triggers) };
          updateMessage(key);
        }
        return;
      }
      emitter.emit(
        eventTypes.OUT.webPost,
        "chat.delete",
        {
          channel: m.channel,
          ts: m.ts,
        },
        (error) => {
          if (!error) {
            store.value.messages[key] = undefined;
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
    if (!store.value.messages[key]) {
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
    r = added && store.value.messages[key].reactions[added.name];
    if (r) {
      r.current = r.current.concat(added.users);
    }
    const deleted = countFromText(oldText);
    r = deleted && store.value.messages[key].reactions[deleted.name];
    if (r) {
      deleted.users.forEach((u) => {
        const index = r.current.lastIndexOf(u);
        if (index >= 0) {
          r.current.splice(index, 1);
        }
      });
    }
    updateMessage(key);
  });
};
