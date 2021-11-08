const giveTo = require('../../../lib/give_to')
const jiraUserList = require("../../../jira.userList.json");
const qqUserList = require("../../../qq.userList.json");
const qunList = require("../../../qun.json");

function allocation(event) {
    const data = event.raw_message.split(" ");
    if (data[0] !== "分配") return;
    event.reply(
        `开始分配 [CQ:at,qq=${qqUserList[data[1]]},text=@${data[1]}] 的任务`
    );
    let [action, name, ...tasks] = data;
    let promiseArr = [];
    for (let i = 0; i < tasks.length; i++) {
        promiseArr.push(
        giveTo.init(
            jiraUserList[data[1]],
            tasks[i].split(":")[0],
            tasks[i].split(":")[1]
        )
        );
    }
    Promise.all(promiseArr)
        .then((res) => {
        message += res.join("\n");
        })
        .catch((e) => {
        message += e;
        })
        .finally(() => {
        event.reply(message);
        message = "";
        });
    return;
}
module.exports = allocation