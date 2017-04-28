let i = 1

export const getNextId = () => {
  return i++
}

export const isFromUser = (mess, uid) => mess.user === uid
export const mentionsUser = (mess, uid) => mess.text && mess.text.includes(`<@${uid}>`)
export const isFromChannels = (mess, channels) => channels.includes(mess.channel)

export const shouldProcess = (message, userId) => !isFromUser(message, userId) &&
mentionsUser(message, userId)
