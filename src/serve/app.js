const express = require("express");
const {client} = require("../qq/login")
const port = 1234;

const app = express();
app.use(express.json());

//监听上线事件
client.on("system.online", () => {
  app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
  });
});
app.all("/", (res, req, next) => {
  console.log(res.query, req);
  next();
});
app.post("/v1/api/gitlab/hooks/Pipeline", require("./router/pipeLine"));
app.post("/v1/api/jira/hooks", require("./router/jiraHooks"));
app.get('/test', require("./router/test"))


