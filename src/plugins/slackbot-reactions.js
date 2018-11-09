import commandParser from '../commandParser'
import splitWords from '../splitWords'
import eventTypes from '../eventTypes'
import fs from 'fs'

const reactionsFile = 'data/reactions.json'

function flatMap (array, callback) {
  return array.reduce((acc, x) => acc.concat(callback(x)), [])
}

function reactTo (allReactions, words, emitter, ts, channel) {
  // buscar reactions
  let reactions = new Set(flatMap(words, item => allReactions[item.toLowerCase()] || []))
  // mezclar reactions
  let reactionsToAdd = []
  reactions.forEach(function (reaction) {
    let position = Math.floor(Math.random() * (reactionsToAdd.length + 1))
    reactionsToAdd.splice(position, 0, reaction)
  })
  // recortar algunas
  reactionsToAdd.splice(0, Math.floor(Math.random() * (reactionsToAdd.length - 1)))
  // enviar
  reactionsToAdd.forEach(function (reaction, index) {
    setTimeout(function () {
      emitter.emit(eventTypes.OUT.webPost, 'reactions.add',
        {
          name: reaction,
          channel: channel,
          timestamp: ts
        },
        (_) => {})
    }, (Math.random() + index) * 1500)
  })
}

export default (config, emitter, debug) => {
  const deleteReaction = config.deleteReaction
  let allReactions = {}
  if (fs.existsSync(reactionsFile)) {
    allReactions = JSON.parse(fs.readFileSync(reactionsFile, 'utf8'))
  }
  emitter.on(eventTypes.IN.receivedMessage, (message) => {
    const command = commandParser(message.text)
    if (command === null || (command.command !== 'reaction')) {
      return
    }
    let components = splitWords(command.text)
    console.log(components)
    if (components.length === 1 && components[0] === 'list') {
      let description = 'Reactions configuradas:\n'
      Object.keys(allReactions).forEach(function (word) {
        description += word + ': :' + allReactions[word].join(': :') + ':\n'
      })
      emitter.emit('send:message', description, message.channel)
    } else if (command.text) {
      let posibleReaction = components[components.length - 1]
      if (posibleReaction.indexOf(':', 0) === 0 && posibleReaction.indexOf(':', posibleReaction.length - 1) !== -1) {
        let reaction = posibleReaction.substring(1, posibleReaction.length - 1)
        for (let i = 0; i < components.length - 1; i++) {
          // agregamos/quitamos la reaction para cada palabrita
          let word = components[i].toLowerCase()
          if (!word) {
            continue
          }
          if (!allReactions[word]) {
            allReactions[word] = []
          }
          let theArray = allReactions[word]
          let index = theArray.indexOf(reaction)
          if (index < 0) {
            theArray.push(reaction)
            emitter.emit('send:message', 'reaction agregada', message.channel)
          } else {
            theArray.splice(index, 1)
            emitter.emit('send:message', 'reaction quitada', message.channel)
          }
          if (theArray.length === 0) {
            allReactions[word] = undefined
          }
          fs.writeFileSync(reactionsFile, JSON.stringify(allReactions), 'utf8')
        }
      } else {
        emitter.emit('send:message', 'el último parámetro tiene que ser una reaction.', message.channel)
      }
    } else {
      emitter.emit('send:message', '`/reaction list` muestra la lista de reactions configuradas.\n`/reaction <palabra> <reaction>` agrega o quita esa reaction para esa palabra', message.channel)
    }
  })
  emitter.on(eventTypes.IN.receivedOtherMessage, (payload) => {
    let words = new Set(splitWords(payload.text))
    if (Math.random() > 0.9) {
      // cada tanto incluimos al nombre de usuario para que no sea tan pesado
      words.add('<@' + payload.user + '>')
    }
    if (Math.random() > 0.97) {
      // cada tanto tanto incluimos al channel para que no sea tan pesado
      words.add('<#' + payload.channel + '>')
    }
    reactTo(allReactions, Array.from(words), emitter, payload.ts, payload.channel)
  })
  emitter.on('reaction:added', (payload) => {
    if (payload.reaction === deleteReaction) {
      if (payload.item_user === config.userId) {
        emitter.emit(eventTypes.OUT.webPost, 'chat.delete', {
          channel: payload.item.channel,
          ts: payload.item.ts
        }, (error) => {
          debug(error)
        })
      } else {
        emitter.emit(eventTypes.OUT.webGet, 'conversations.history', {
          channel: payload.item.channel,
          latest: payload.item.ts,
          oldest: payload.item.ts,
          inclusive: true
        },
        (error, response) => {
          if (error) {
            debug(error)
          } else if (response.messages.length > 0) {
            response.messages[0].reactions.forEach(r => {
              if (r.users.indexOf(config.userId) >= 0) {
                emitter.emit(eventTypes.OUT.webPost, 'reactions.remove',
                  {
                    name: r.name,
                    channel: payload.item.channel,
                    timestamp: payload.item.ts
                  },
                  (_) => {})
              }
            })
          }
        })
      }
    } else {
      reactTo(allReactions, [payload.reaction, ':' + payload.reaction + ':'], emitter, payload.item.ts, payload.item.channel)
    }
  })
}
