import commandParser from '../commandParser'
import eventTypes from '../eventTypes'
import fs from 'fs'

const reactionsFile = 'data/reactions.json'

function splitWords (text) {
  return (text || '').split(/[,.\s?¿¡!\\/"'`*+-;_=()&$|@#[\]]+/gi)
}

export default (config, emitter, debug) => {
  let allReactions = {}
  if (fs.existsSync(reactionsFile)) {
    allReactions = JSON.parse(fs.readFileSync(reactionsFile, 'utf8'))
  }
  emitter.on(eventTypes.IN.receivedMessage, (message) => {
    const command = commandParser(message.text)
    if (command === null || (command.command !== 'reaction')) {
      return
    }
    if (command.text === 'list') {
      let description = 'Reactions configuradas:\n'
      Object.keys(allReactions).forEach(function (word) {
        description += word + ': :' + allReactions[word].join(': :') + ':\n'
      })
      emitter.emit('send:message', description, message.channel)
    } else if (command.text) {
      let components = splitWords(command.text)
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
    let reactions = new Set()
    words.forEach(function (item) {
      let r = allReactions[item.toLowerCase()] || []
      r.forEach(function (reaction) {
        reactions.add(reaction)
      })
    })
    let reactionsToAdd = []
    reactions.forEach(function (reaction) {
      let position = Math.floor(Math.random() * (reactionsToAdd.length + 1))
      reactionsToAdd.splice(position, 0, reaction)
    })
    reactionsToAdd.splice(0, Math.floor(Math.random() * (reactionsToAdd.length - 1)))
    reactionsToAdd.forEach(function (reaction) {
      emitter.emit(eventTypes.OUT.webPost, 'reactions.add',
        {
          name: reaction,
          channel: payload.channel,
          timestamp: payload.ts
        },
        (err, resp) => {
          if (err) {
            debug(err)
          }
        })
    })
  })
}
