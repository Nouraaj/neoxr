exports.run = {
   async: async (m, {
      client,
      body,
      chats,
      users,
      setting,
      isOwner,
      env,
      Func,
      Scraper
   }) => {
      try {
         // clear first send : => db.chatbot = []
         global.db.chatbot = global.db.chatbot ? global.db.chatbot: []
         const session = global.db.chatbot.find(v => v.jid == m.sender && v.id)
         if (m.isGroup) {
            for (let jid of [...new Set([...(m.mentionedJid || [])])]) {
               if (jid != client.decodeJid(client.user.id)) continue
               if (!m.fromMe) {
                  const less = '@' + client.decodeJid(client.user.id).replace(/@.+/, '')
                  const text = body.replace(less, '').trim()
                  if (!text) return m.reply('?')
                  const json = await Api.neoxr('/gpt4-session', {
                     q: text,
                     session: session ? session.id : ''
                  })
                  if (!json.status) return m.reply(json.msg)
                  if (!session) {
                     global.db.chatbot.push({
                        jid: m.sender,
                        id: json.data.sessionId
                     })
                  }
                  m.reply(json.data.message)
               }
            }
         } else {
            if (!setting.chatbot || setting.except.includes(m.sender.replace(/@.+/, '')) || !/conversation|extended/.test(m.mtype)) return
            const json = await Api.neoxr('/gpt4-session', {
               q: body,
               session: session ? session.id : ''
            })
            if (!json.status) return m.reply(json.msg)
            if (!session) {
               global.db.chatbot.push({
                  jid: m.sender,
                  id: json.data.sessionId
               })
            }
            m.reply(json.data.message)
         }
      } catch (e) {
         client.reply(m.chat, Func.jsonFormat(e), m)
      }
   },
   error: false,
   cache: true,
   location: __filename
}