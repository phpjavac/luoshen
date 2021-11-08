const {client} = require('./login')

const list =
    {
        '分配': (event) =>require('./handle/allocation')(event),
        'csv': (event) => require('./handle/csv')(event),
        'test': (event) => {event.reply(
            `你好啊，我是宓妃`
        );}
    }

function cmd(event) {
    const command = event.raw_message.split(" ")[0]
    return command
}


client.on('message', async (event) => {
    if (event.message_type === "group") {
    // 监听群消息
        list[cmd(event)](event)
        return;
    }
    if(event.message_type === "private"){
    // 监听私发消息
        list[cmd(event)](event)
        return;
    }
})