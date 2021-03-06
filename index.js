const { create, Client } = require('@open-wa/wa-automate')
const welcome = require('./lib/welcome')
const left = require('./lib/left')
const cron = require('node-cron')
const color = require('./lib/color')
const fs = require('fs')
// const msgHndlr = require ('./angga23')
const figlet = require('figlet')
const options = require('./options')
//const fs = require('fs-extra')
const {
		prefix
} = JSON.parse(fs.readFileSync('./lib/database/setting.json'))


// AUTO UPDATE BY NURUTOMO
// THX FOR NURUTOMO
// Cache handler and check for file change
require('./angga23.js')
nocache('./angga23.js', module => console.log(`'${module}' Updated!`))

const adminNumber = JSON.parse(fs.readFileSync('./lib/database/admin.json'))
const setting = JSON.parse(fs.readFileSync('./lib/database/setting.json'))
const isWhite = (chatId) => adminNumber.includes(chatId) ? true : false

let { 
    limitCount,
    memberLimit, 
    groupLimit,
    mtc: mtcState,
    banChats,
    restartState: isRestart
    } = setting

function restartAwal(angga23){
    setting.restartState = false
    isRestart = false
    angga23.sendText(setting.restartId, 'Restart Succesfull!')
    setting.restartId = 'undefined'
    fs.writeFileSync('./lib/setting.json', JSON.stringify(setting, null,2));
}

const start = async (angga23 = new Client()) => {
        console.log('------------------------------------------------')
        console.log(color(figlet.textSync('Wiko BOT', { horizontalLayout: 'full' })))
        console.log('------------------------------------------------')
        console.log('[DEV] YUDZ')
        console.log('[SERVER] Wiko IS ONLINE!')
        //angga23.onAnyMessage((fn) => messageLog(fn.fromMe, fn.type))
        // Force it to keep the current session
        angga23.onStateChanged((state) => {
            console.log('[Client State]', state)
            if (state === 'CONFLICT' || state === 'UNLAUNCHED') angga23.forceRefocus()
        })
        // listening on message
        angga23.onAnyMessage((async (message) => {

        angga23.getAmountOfLoadedMessages() // Cut message Cache if cache more than 3K
            .then((msg) => {
                if (msg >= 1000) {
                    console.log('[CLIENT]', color(`Loaded Message Reach ${msg}, cuting message cache...`, 'yellow'))
                    angga23.cutMsgCache()
                }
            })
        // msgHndlr(angga23, message)
        // Message Handler (Loaded from recent cache)
        require('./angga23.js')(angga23, message)
    }))
           

        angga23.onGlobalParicipantsChanged((async (heuh) => {
            await welcome(angga23, heuh) 
            left(angga23, heuh)
            }))
        
        angga23.onAddedToGroup(async (chat) => {
            if(isWhite(chat.id)) return angga23.sendText(chat.id, `Halo aku Wiko, Ketik ${prefix}help Untuk Melihat List Command Ku...`)
            if(mtcState === false){
                const groups = await angga23.getAllGroups()
                // BOT group count less than
                if(groups.length > groupLimit){
                    await angga23.sendText(chat.id, 'Maaf, Batas group yang dapat Wiko tampung sudah penuh').then(async () =>{
                        angga23.deleteChat(chat.id)
                        angga23.leaveGroup(chat.id)
                    })
                }else{
                    if(chat.groupMetadata.participants.length < memberLimit){
                        await angga23.sendText(chat.id, `Maaf, BOT keluar jika member group tidak melebihi ${memberLimit} orang`).then(async () =>{
                            angga23.deleteChat(chat.id)
                            angga23.leaveGroup(chat.id)
                        })
                    }else{
                        if(!chat.isReadOnly) angga23.sendText(chat.id, `Halo aku Wiko, Ketik ${prefix}help Untuk Melihat List Command Ku...`)
                    }
                }
            }else{
                await angga23.sendText(chat.id, 'Wiko sedang maintenance, coba lain hari').then(async () => {
                    angga23.deleteChat(chat.id)
                    angga23.leaveGroup(chat.id)
                })
            }
        })

        /*angga23.onAck((x => {
            const { from, to, ack } = x
            if (x !== 3) angga23.sendSeen(to)
        }))*/

        // listening on Incoming Call
        angga23.onIncomingCall(( async (call) => {
            await angga23.sendText(call.peerJid, 'Maaf, saya tidak bisa menerima panggilan. nelfon = block!.\nJika ingin membuka block harap chat Owner!')
            .then(() => angga23.contactBlock(call.peerJid))
        }))
    }

/**
 * Uncache if there is file change
 * @param {string} module Module name or path
 * @param {function} cb <optional> 
 */
function nocache(module, cb = () => { }) {
    console.log('Module', `'${module}'`, 'is now being watched for changes')
    fs.watchFile(require.resolve(module), async () => {
        await uncache(require.resolve(module))
        cb(module)
    })
}

/**
 * Uncache a module
 * @param {string} module Module name or path
 */
function uncache(module = '.') {
    return new Promise((resolve, reject) => {
        try {
            delete require.cache[require.resolve(module)]
            resolve()
        } catch (e) {
            reject(e)
        }
    })
}

create(options(true, start))
    .then(angga23 => start(angga23))
    .catch((error) => console.log(error))
