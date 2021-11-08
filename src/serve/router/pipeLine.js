module.exports = async (req, res) => {
  const { status } = req.body.object_attributes;
  const { message } = req.body.commit;
  const pattern = /\[.*\]/;
  try {
    const task = message.match(pattern)[0].replace("[", "").replace("]", "");
    const testName = deleteNum(task.replace("-", ""));
    const taskUrl = `${JIRA_URL}browse/${task}`;
    const qunNumber = qunList[testName];
    const testNumber = testList[testName];
    let mess = "";
    switch (status) {
      case "success":
        const taskTitle = await giveTo.getTaskTitle(task);
        mess = `[CQ:at,qq=${testNumber},text=@${testNumber}] 前端更新项目成功 可以开始测试了 任务： ${task}-${taskTitle} ; jira链接： ${taskUrl}`;
        break;

      default:
        break;
    }
    client.sendGroupMsg(qunNumber, mess);
  } catch (error) { }
  res.send("success");
}