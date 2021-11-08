module.exports = () => {
    const {client} = require('../../qq/login')
    if (req.body.webhookEvent === "jira:issue_updated") {
        const data = req.body;
        if (
          data.changelog.items[0].fromString === "开发完成" &&
          data.changelog.items[0].toString === "开发中"
        ) {
          const mess = `${data.user.displayName}的${data.issue.key
            }任务被重新打开了，请及时处理！
                [CQ:at,qq=${qqUserList[data.user.displayName]},text=@${qqUserList[data.user.displayName]
            }] ${JIRA_URL}browse/${data.issue.key}
                `;
          console.log(mess);
          client.sendGroupMsg(706809115, mess);
        }
      }
}