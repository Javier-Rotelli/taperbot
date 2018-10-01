import eventTypes from '../eventTypes'
import splitWords from '../splitWords'
import fs from 'fs'

const almuerzoFile = 'data/almuerzo.json'

export default (config, emitter, debug) => {
  let state = {
    messages: {}
  }
  const triggerReaction = config.reaction
  const defaultReactions = config.defaultReactions
  const timeout = config.timeout
  if (fs.existsSync(almuerzoFile)) {
    state = JSON.parse(fs.readFileSync(almuerzoFile, 'utf8'))
    Object.keys(state.messages).forEach(k => {
      const almuerzo = state.messages[k]
      const timeoutDate = new Date(almuerzo.ts * 1000 + timeout)
      if (timeoutDate < new Date()) {
        // muy viejo, lo borramos
        state.messages[k] = undefined
        return
      }
      fetchReactedUsers(almuerzo.channel, almuerzo.originalMessage, (error, reactedUsers) => {
        if (reactedUsers) {
          Object.values(almuerzo.reactions).forEach(r => {
            r.current = applyAll(r.current, reactedUsers[r.name] || [])
          })
          updateMessage(k)
        } else {
          debug(error)
        }
      })
    })
  }
  function applyAll (previous, updated) {
    let retval = previous.concat(updated)
    previous.forEach(x => {
      retval.splice(retval.lastIndexOf(x), 1)
    })
    return retval
  }
  function userToString (u) {
    return u.startsWith('_') ? ` ${u}` : ` <@${u}>`
  }
  function updateMessage (key) {
    const message = state.messages[key]
    Object.values(message.reactions).forEach(r => {
      const original = nonRepeated(r.original)
      r.count = original.length
      const current = nonRepeated(r.current)
      r.final = current.filter((_, i) => i < r.count)
      r.up = current.filter((_, i) => i >= r.count)
      r.down = original.filter(x => r.final.indexOf(x) < 0)
    })
    const text = todayEat(message.reactions, r => {
      if (r.up.length > 0 || r.down.length > 0) {
        return ':' + r.name + ':' +
          ' - se ' + (r.down.length > 1 ? 'bajaron' : 'bajo') + ': ' + r.down.map(userToString).join(',') +
          ' - ' + (r.up.length > 1 ? 'esperan' : 'espera') + ': ' + r.up.map(userToString).join(',') + '\n'
      }
      return ''
    })
    emitter.emit(eventTypes.OUT.webPost, 'chat.update', {
      channel: message.channel,
      text: text,
      ts: message.ts
    }, (error) => { debug(error) })
    fs.writeFileSync(almuerzoFile, JSON.stringify(state), 'utf8')
  }
  function todayEat (reactions, block) {
    return 'Hoy comen\n' + Object.values(reactions)
      .map(x => `:${x.name}: -> ` + x.count + x.final.map(userToString) + (x.count > x.final.length ? ` + ${x.count - x.final.length} libre(s)` : ''))
      .join('\n') +
      ((block && '\n' + Object.values(reactions).map(r => block(r)).join('\n')) || '')
  }
  function nonRepeated (array) {
    return array.filter((x, i, a) => a.indexOf(x) === i)
  }
  function matchingGroup (text, regex) {
    const result = regex.exec(text)
    return result && result.length > 1 && result[1]
  }
  function countFromText (text) {
    const words = splitWords(text)
    const reaction = words.length > 1 && matchingGroup(words[0], /:([^\s:]+):/i)
    return (reaction && {
      name: reaction,
      users: words.slice(1).map(x => matchingGroup(x, /<@(.*)>/i) || `_${x}_`)
    })
  }
  function fetchReactedUsers (channel, ts, then) {
    emitter.emit(eventTypes.OUT.webGet, 'conversations.history', {
      channel: channel,
      latest: ts,
      oldest: ts,
      inclusive: true
    },
    (error, response) => {
      debug(error)
      let originalMessage
      if (response.ok && (originalMessage = response.messages[0])) {
        emitter.emit(eventTypes.OUT.webGet, 'conversations.replies', {
          channel: channel,
          ts: ts,
          limit: 100
        },
        (error, response) => {
          let submessages
          if (response.ok && (submessages = response.messages)) {
            const reactedInMessages = submessages
              .map(m => countFromText(m.text))
              .filter(x => x)
            const reactedUsers = (originalMessage.reactions || [])
              .concat(reactedInMessages)
              .reduce((acc, r) => {
                const name = r.name.split('::')[0]
                return { ...acc, [name]: (acc[name] || []).concat(r.users) }
              }, {})
            then(null, reactedUsers, originalMessage)
          } else {
            then(error)
          }
        })
      } else {
        then(error)
      }
    })
  }
  emitter.on(eventTypes.IN.reactionAdded, (payload) => {
    const ts = payload.item.ts
    const channel = payload.item.channel
    const user = payload.user
    const key = channel + '-' + ts
    const reaction = payload.reaction.split('..')[0]
    if (reaction === triggerReaction && !state.messages[key]) {
      emitter.emit(eventTypes.OUT.startTyping, {
        channel: channel
      }, (_) => {})
      !state.messages[key] && fetchReactedUsers(channel, ts, (error, reactedUsers, message) => {
        if (reactedUsers) {
          const reactedDefaults = Object.keys(reactedUsers).filter(x => defaultReactions.indexOf(x) >= 0)
          let reactionsInfo = [...((message.text || '').match(/(:[^\s:]+:)/igm) || [])]
            .map(x => x.substring(1, x.length - 1))
            .filter(x => !x.startsWith('skin-tone-'))
            .concat(reactedDefaults)
            .reduce((acc, name) => {
              const users = reactedUsers[name] || []
              return { ...acc,
                [name]: {
                  name: name,
                  count: nonRepeated(users).length,
                  original: users,
                  current: users.slice(),
                  final: users.slice(),
                  up: [],
                  down: []
                }
              }
            }, {})
          if (Object.keys(reactionsInfo).length > 0) {
            const text = todayEat(reactionsInfo)
            state.messages[key] = {
              channel: channel,
              user: user,
              originalMessage: ts,
              reactions: reactionsInfo
            }
            emitter.emit(eventTypes.OUT.webPost, 'chat.postMessage', {
              channel: channel,
              text: text,
              link_names: false,
              as_user: true
            }, (err, response) => {
              debug(err)
              state.messages[key].ts = response.ts
              fs.writeFileSync(almuerzoFile, JSON.stringify(state), 'utf8')
            })
          }
        } else {
          debug(error)
        }
      })
    } else if (reaction !== triggerReaction && state.messages[key]) {
      const r = state.messages[key].reactions[reaction]
      if (r) {
        r.current.push(payload.user)
        updateMessage(key)
      }
    }
  })
  emitter.on(eventTypes.IN.reactionRemoved, (payload) => {
    const ts = payload.item.ts
    const channel = payload.item.channel
    const key = channel + '-' + ts
    const reaction = payload.reaction.split('..')[0]
    if (reaction !== triggerReaction && state.messages[key]) {
      const r = state.messages[key].reactions[reaction]
      const index = r ? r.current.lastIndexOf(payload.user) : -1
      if (index >= 0) {
        r.current.splice(index, 1)
        updateMessage(key)
      }
    } else if (reaction === triggerReaction && state.messages[key] && state.messages[key].user === payload.user) {
      emitter.emit(eventTypes.OUT.webPost, 'chat.delete', {
        channel: state.messages[key].channel,
        ts: state.messages[key].ts
      }, (error) => {
        if (!error) {
          state.messages[key] = undefined
          fs.writeFileSync(almuerzoFile, JSON.stringify(state), 'utf8')
        } else {
          debug(error)
        }
      })
    }
  })
  emitter.on(eventTypes.IN.receivedOtherMessage, (payload) => {
    const ts = payload.thread_ts || (payload.previous_message && payload.previous_message.thread_ts)
    const channel = payload.channel
    const key = channel + '-' + ts
    if (!state.messages[key]) { return }
    let newText
    let oldText
    if (!payload.subtype) {
      // added
      newText = payload.text
      oldText = ''
    } else if (payload.subtype === 'message_changed') {
      // modified
      newText = payload.message.text
      oldText = payload.previous_message.text
    } else if (payload.subtype === 'message_deleted') {
      // deleted
      newText = ''
      oldText = payload.previous_message.text
    }
    let r
    const added = countFromText(newText)
    r = added && state.messages[key].reactions[added.name]
    if (r) {
      r.current = r.current.concat(added.users)
    }
    const deleted = countFromText(oldText)
    r = deleted && state.messages[key].reactions[deleted.name]
    if (r) {
      deleted.users.forEach(u => {
        const index = r.current.lastIndexOf(u)
        if (index >= 0) {
          r.current.splice(index, 1)
        }
      })
    }
    updateMessage(key)
  })
}
