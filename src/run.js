import WebSocket from 'ws'
import request from 'request'
import {EventEmitter} from 'events'
import createDebug from 'debug'
import {getConfig} from './config'
import {getNextId} from './messageUtil'

const conf = getConfig()
if (conf.debug) {
  process.env['DEBUG'] = (conf.debug === true) ? '*' : conf.debug
}
const log = createDebug('taperbot:core')

const isFromUser = (mess, uid) => mess.user === uid
const mentionsUser = (mess, uid) => mess.text && mess.text.includes(`<@${uid}>`)
const isFromChannels = (mess, channels) => channels.includes(mess.channel)

export const shouldProcess = (message, userId) => !isFromUser(message, userId) &&
                                                  mentionsUser(message, userId)

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
          emitter.emit('received:message', payload)
        }
        break
      case 'reaction_added':
        emitter.emit('reaction:added', payload)
        break
    }
  })

  emitter.on('send:message', (content, channel, id) => {
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

  emitter.on('startTyping', (message) => {
    sendMessage(ws, {
      channel: message.channel,
      id: getNextId(),
      type: 'typing',
      reply_to: message.id
    })
  })

  emitter.on('web', (method, args, cb) => {
    const url = `https://slack.com/api/${method}`
    const qs = {
      token: conf.apiToken,
      ...args
    }
    log('Web Request Method:', method, 'args', args)
    request(url, {qs}, (err, resp, body) => {
      if (err) {
        cb(err)
      }
      cb(null, JSON.parse(body))
    })
  })

  initPlugins(conf.plugins, emitter)
}

const sendMessage = (ws, message) => {
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
  })
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
}
