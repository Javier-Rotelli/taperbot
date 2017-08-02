import GoogleSpreadsheet from 'google-spreadsheet'
import promisify from 'es6-promisify'
import table from 'text-table'

import commandParser from './../commandParser'
import { getUsers } from '../slackUtils'

export default (config, emitter, log) => {
  const doc = new GoogleSpreadsheet('1fW46QXKO4XDd-L8hoYFR30AzzVVDe4mL1xhZthbDgtI')

  promisify(doc.getInfo, doc)().then((info) => {
    log(`Loaded doc: ${info.title}`)
    const sheet = info.worksheets[0]

    emitter.on('received:message', processMessage(emitter, sheet, log))
  })
}

const easterEgg = (emitter, channel) => {
  const messages = [
    'Buscando proveedor...',
    'Llamando...',
    'Realizando pedido...',
    'Total: $800. llega en ~30 minutos'
  ]
  const sendmsg = () => {
    const msg = messages.shift()
    emitter.emit('send:message', msg, channel)
    if (messages.length > 0) {
      setTimeout(sendmsg, 2000)
    }
  }
  sendmsg()
}
const processMessage = (emitter, sheet, log) => async (message) => {
  const command = commandParser(message.text)
  if (command === null) {
    return
  }
  if (message.text.includes('tabla de quesos')) {
    easterEgg(emitter, message.channel)
    return
  }

  let response = null
  switch (command.command) {
    case 'tabla':
      const text = command.text || ''
      const params = text.trim().split(' ')
      response = await getTable(sheet, params, log)
      break
    case 'manijeala':
      const users = await getUsersDict(emitter)
      response = await quienMeFalta(sheet, users[message.user], log)
      break
  }

  if (response !== null) {
    emitter.emit('send:message', response, message.channel)
  }
}

const ligas = {
  'ELITE': {},
  'LOC': {},
  'SOTOLIGA': {},
  'PARALIGA': {}
}

export const getTable = async (sheet, params, log) => {
  const ligaBuscada = params[0] || ''
  const extendida = params.indexOf('extendida') !== -1
  const liga = ligaBuscada.trim().toUpperCase()
  const categoria = ligas[liga]

  if (categoria === undefined) {
    return 'No se de que me estas hablando'
  }
  const getCells = promisify(sheet.getCells, sheet)

  // necesito ubicar la tabla en la hoja
  if (categoria.tabla === undefined) {
    categoria.tabla = await getCells({
      'min-row': 1,
      'max-row': 50,
      'min-col': 1,
      'max-col': 1,
      'return-empty': true
    }).then((cells) => {
      const start = cells.find((cell) => cell.value === liga).row
      const end = cells.slice(start).find((cell) => cell.value === '').row

      return {
        'min-row': start + 2,
        'max-row': end,
        'min-col': 9,
        'max-col': 20,
        'return-empty': true
      }
    })
  }
  const range = (n) => Array.apply(null, new Array(n)).map((x, i) => i)

  const tabla = await getCells(categoria.tabla).then((cells) => {
    const rows = range(Math.ceil(cells.length / 11)).map((x, i) => cells.slice(i * 12, i * 12 + 12))
    if (extendida) {
      return '```' + table(rows.map(row => row.map(cell => cell.value))) + '```'
    } else {
      return '```' + table(rows.map(row => row.slice(0, 6).map(cell => cell.value))) + '```'
    }
  })

  return tabla
}

let usuarios
const getUsersDict = async (emitter) => {
  if (usuarios === undefined) {
    const users = await getUsers(emitter)
    usuarios = users.reduce((dict, curr) => {
      dict[curr.id] = curr.name
      return dict
    }, {})
  }
  return usuarios
}

const quienMeFalta = async (sheet, user, log) => {
  const getCells = promisify(sheet.getCells, sheet)
  return await getCells({
    'min-row': 1,
    'max-row': 50,
    'min-col': 1,
    'max-col': 3,
    'return-empty': true
  }).then((cells) => {
    const playerIndex = cells.findIndex((cell) => cell.value.trim() === `@${user}` && cell.col === 1)
    if (playerIndex === -1) {
      return 'y vos quien sos?'
    }
    log(cells[playerIndex + 2].value)
    return getLetsPlayFriendlyMessage(cells[playerIndex + 2].value)// .split(",").reduce((str, curr) => str + curr.trim(), "")
  })
}

export const getLetsPlayFriendlyMessage = function (rivals) {
  const multiRivalsMessages = [
    '<rivals>, vengan a jugar amigos de la federal.',
    '<rivals>, bajen ya o pido :escritorio:.',
    '<rivals> vengan de a uno que me los como crudos.',
    '<rivals>, les llegó la hora.',
    '<rivals>, vengan a perder.'
  ]
  const singleRivalMessages = [
    '<rivals> dale que me quedás solo vos',
    'Te voy a comer crudo <rivals>',
    'Si no te la bancás ya mismo pido :escritorio:, <rivals>',
    '<rivals> en cinco abajo o te pido los puntos. :escritorio:'
  ]
  const customSingleRivalMessages = {
    'aspero': [
      '<rivals> prepará los gluteos y bajá.'
    ]
  }
  const singleRival = getSingleRival(rivals)
  const messages = isSingleRival(rivals)
    ? (!Object.keys(customSingleRivalMessages).includes(singleRival) || Math.random() > 0.5
      ? singleRivalMessages
      : customSingleRivalMessages[singleRival])
    : multiRivalsMessages
  return messages[Math.floor(Math.random() * messages.length)].replace('<rivals>', rivals)
}

const isSingleRival = function (rivals) {
  return rivals.indexOf(',') === -1
}

const getSingleRival = function (rivals) {
  const startIndex = rivals.indexOf('@') + 1
  const endIndex = rivals.indexOf('(')
  return rivals.substring(startIndex, endIndex)
}
