module.exports = (req,res) => {
  const {client} = require("../../qq/login")
  client.sendPrivateMsg(891356554,'express给您发送了一个消息')
  res.send("success");
}
