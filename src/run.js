import WebSocket from 'ws'
import request from 'request'
import {EventEmitter} from 'events'
import createDebug from 'debug'
import {getConfig} from './config'
import {getNextId, isFromChannels, shouldProcess, isFromUser} from './messageUtil'
import adminPlugin from './plugins/admin'
import eventTypes from './eventTypes'
import { getFromAPI, postToAPI } from './slackWeb'

const conf = getConfig()
if (conf.debug) {
  process.env['DEBUG'] = (conf.debug === true) ? '*' : conf.debug
}
const log = createDebug('taperbot:core')
const devLog = createDebug('taperbot:core:dev')

const startServer = (url) => {
  const ws = new WebSocket(url)
  const emitter = new EventEmitter()

  ws.on('open', () => {
    log('Connected')
    resetPing(ws)
  })

  ws.on('error', (error) => {
    log('Error on Websocket server: %o', error)
  })

  ws.on('message', (rawMessage) => {
    const payload = JSON.parse(rawMessage)
    if (isFromChannels(payload, conf.ignoredChannels)) {
      return
    }
    log(payload)
    switch (payload.type) {
      case 'message':
        if (shouldProcess(payload, conf.userId)) {
          emitter.emit(eventTypes.IN.receivedMessage, payload)
        } else if (!isFromUser(payload, conf.userId)) {
          emitter.emit(eventTypes.IN.receivedOtherMessage, payload)
        }
        break
      case 'reaction_added':
        emitter.emit(eventTypes.IN.reactionAdded, payload)
        break
      case 'reaction_removed':
        emitter.emit(eventTypes.IN.reactionRemoved, payload)
        break
      case 'member_left_channel':
        emitter.emit(eventTypes.IN.memberLeftChannel, payload)
        break
    }
  })

  emitter.on(eventTypes.OUT.sendMessage, (content, channel, id) => {
    if (conf.ignoredChannels.includes(channel)) {
      return
    }
    sendMessage(ws, {
      channel: channel,
      id,
      text: content,
      type: 'message'
    })
  })

  emitter.on(eventTypes.OUT.startTyping, (message) => {
    sendMessage(ws, {
      channel: message.channel,
      id: getNextId(),
      type: 'typing',
      reply_to: message.id
    })
  })

  emitter.on(eventTypes.OUT.webGet, getFromAPI(conf, log))

  emitter.on(eventTypes.OUT.webPost, postToAPI(conf, log))

  initPlugins(conf.plugins, emitter)
}

const sendMessage = (ws, message) => {
  if (process.env.NODE_ENV !== 'production') {
    devLog('Message to send: %O', message)
    return
  }

  if (message.id === undefined) {
    message.id = getNextId()
  }
  ws.send(JSON.stringify(message))
  resetPing(ws)
}

const initPlugins = (plugins, emitter) => {
  const pluginsFolder = './plugins/'

  return Object.keys(plugins).map((pluginName) => {
    log(`Iniciando plugin ${pluginName}`)
    const pluginConfig = plugins[pluginName]
    return require(`${pluginsFolder}${pluginName}`).default(pluginConfig, emitter, createDebug(`taperbot:${pluginName}`))
  }).concat([adminPlugin(conf, emitter, createDebug('taperbot:admin'))])
}

const getUrl = (apiToken) => 'https://slack.com/api/rtm.start?token=' + apiToken

request(getUrl(conf.apiToken), function (err, response, body) {
  if (!err && response.statusCode === 200) {
    const res = JSON.parse(body)
    if (res.ok) {
      startServer(res.url)
    } else {
      console.error('error connecting to slack')
      console.error(body)
    }
  }
})

let pingTimer
const resetPing = (ws) => {
  clearTimeout(pingTimer)
  pingTimer = setTimeout(sendPing(ws), 5000)
}

const sendPing = (ws) => () => {
  ws.send(JSON.stringify({
    'id': getNextId(),
    'type': 'ping'
  }))
  log('sent ping')
  resetPing(ws)
}
