import eventTypes from '../eventTypes'

export default (config, emitter, debug) => {
  let state = {
    messages: {}
  }
  const triggerReaction = config.reaction

  function updateMessage (key) {
    const message = state.messages[key]
    Object.values(message.reactions).forEach(r => {
      const count = r.original.length
      r.final = r.current.filter((_, i) => i < count)
      r.up = r.current.filter((_, i) => i >= count)
      r.down = r.original.filter(x => r.final.indexOf(x) < 0)
    })
    const text = todayEat(message.reactions, r => {
      if (r.up.length > 0 || r.down.length > 0) {
        return ':' + r.name + ':' +
          ' - se ' + (r.down.length > 1 ? 'bajaron' : 'bajo') + ': ' + r.down.map(x => `<@${x}>`).join(',') +
          ' - ' + (r.up.length > 1 ? 'esperan' : 'esperan') + ': ' + r.up.map(x => `<@${x}>`).join(',') + '\n'
      }
      return ''
    })
    emitter.emit(eventTypes.OUT.webPost, 'chat.update', {
      channel: message.channel,
      text: text,
      ts: message.ts
    }, (error) => { debug(error) })
  }
  function todayEat (reactions, block) {
    return 'Hoy comen\n' + Object.values(reactions)
      .map(x => `:${x.name}: -> ` + x.original.length + x.final.map(u => ` <@${u}>`))
      .join('\n') +
      ((block && Object.values(reactions).map(r => block(r)).join('\n')) || '')
  }
  emitter.on(eventTypes.IN.reactionAdded, (payload) => {
    const ts = payload.item.ts
    const channel = payload.item.channel
    const key = channel + '-' + ts
    const reaction = payload.reaction.split('..')[0]
    if (reaction === triggerReaction && !state.messages[key]) {
      emitter.emit(eventTypes.OUT.startTyping, {
        channel: channel
      }, (_) => {})
      emitter.emit(eventTypes.OUT.webGet, 'conversations.history', {
        channel: channel,
        latest: ts,
        oldest: ts,
        inclusive: true
      },
      (error, response) => {
        debug(error)
        let message
        if (response.ok && (message = response.messages[0])) {
          const reactedUsers = (message.reactions || [])
            .reduce((acc, r) => {
              const name = r.name.split('::')[0]
              debug(r)
              if (acc[name]) {
                acc[name] = acc[name].concat(r.users)
              } else {
                acc[name] = r.users.slice()
              }
              debug(acc)
              return acc
            }, {})
          debug(reactedUsers)
          const countableReactions = [...((message.text || '').match(/(:[^\s:]+:)/igm) || [])]
            .map(x => x.substring(1, x.length - 1))
            .filter(x => !x.startsWith('skin-tone-'))
            .reduce((acc, name) => {
              acc[name] = {
                name: name,
                original: reactedUsers[name] || [],
                current: (reactedUsers[name] || []).slice(),
                final: (reactedUsers[name] || []).slice(),
                up: [],
                down: []
              }
              return acc
            }, {})
          debug(countableReactions)
          if (Object.keys(countableReactions).length > 0) {
            const text = todayEat(countableReactions)
            state.messages[key] = {
              channel: channel,
              originalMessage: ts,
              reactions: countableReactions,
              text: text
            }
            emitter.emit(eventTypes.OUT.webPost, 'chat.postMessage', {
              channel: channel,
              text: text,
              link_names: false,
              username: 'acá se come bien'
            }, (err, response) => {
              debug(err)
              state.messages[key].ts = response.ts
            })
          }
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
      const index = r ? r.current.indexOf(payload.user) : -1
      if (index >= 0) {
        r.current.splice(index, 1)
        updateMessage(key)
      }
    }
  })
}
