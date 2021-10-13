const request = require("request");
const jsdom = require("jsdom");

let JSESSIONID = process.env.JSESSIONID;
let token = process.env.token;
const JIRA_URL = process.env.JIRA_URL;

const getQueryVariable = (variable, url) => {
  var query = url.substring(1);
  var vars = query.split("&");
  for (var i = 0; i < vars.length; i++) {
    var pair = vars[i].split("=");
    if (pair[0] == variable) {
      return pair[1];
    }
  }
  return false;
};
// 检查登录状态
const checkLogin = () => {
  return new Promise((resolve, reject) => {
    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
      cookie: [JSESSIONID, token],
    };
    const url = `${process.env.JIRA_URL}browse/TS-1`;
    request(
      {
        url,
        method: "GET",
        headers,
      },
      (err, response, body) => {
        if (!body) return resolve(false);
        resolve(!body.includes("<title>登录 - FindSoft JIRA</title>"));
      }
    );
  });
};
const login = () => {
  console.error("重新登录");
  return new Promise((resolve, reject) => {
    const url = `${JIRA_URL}/login.jsp`;
    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
    };
    const data = {
      url,
      headers,
    };
    request(data, async (err, response, body) => {
      headers.cookie = await response.headers["set-cookie"];
      // token = headers.cookie
      // .find((c) => c.includes("atlassian.xsrf.token="))
      // .replace("; Path=/", "");
      const data1 = {
        url: `${JIRA_URL}/login.jsp?os_username=${process.env.JIRA_CODE}&os_password=${process.env.JIRA_PASSWORD}&os_cookie=true&os_destination=&user_role=&atl_token=&login=%E7%99%BB%E5%BD%95`,
        method: "POST",
        headers,
      };
      request.post(data1, async (err, response1, body) => {
        const cookie = await response1.headers["set-cookie"];
        JSESSIONID = cookie
          .find((c) => c.includes("JSESSIONID"))
          .replace("; Path=/; HttpOnly", "");
        resolve();
      });
    });
  });
};
const jira = (name, task, task_h) => {
  return new Promise((resolve, reject) => {
    const monthList = [
      "一月",
      "二月",
      "三月",
      "四月",
      "五月",
      "六月",
      "七月",
      "八月",
      "九月",
      "十月",
      "十一月",
      "十二月",
    ];
    const t = new Date().getTime();
    // 86400000 一天的时间戳 * 2 计划完成时间推迟两天
    const date = new Date(t + 86400000 * 2);

    const year = date.getFullYear().toString().slice(2);
    const month = monthList[date.getMonth()];
    const day = date.getDate();
    const time = `${day}/${month}/${year}`;

    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
      cookie: [JSESSIONID, token],
    };
    const url = `${process.env.JIRA_URL}browse/${task}`;
    request(
      {
        url,
        method: "GET",
        headers,
      },
      (err, response, body) => {
        console.log(`开始分配${name}的任务一${task}`);
        const dom = new jsdom.JSDOM(body);

        const type = dom.window.document.getElementById("type-val");
        if (!type) {
          console.error(`${process.env.JIRA_URL}browse/${task}`, body);
          console.error(`分配失败--检查任务状态-type`);
          console.error(`分配${name}的任务一${task}失败。`);
          reject(`分配${name}的任务一${task}失败。`);
          return;
        }
        if (!dom.window.document.getElementById("action_id_711")) {
          console.error(`分配失败--检查任务状态`);
          console.error(`分配${name}的任务一${task}失败。`);
          reject(`分配${name}的任务一${task}失败。`);
          return;
        }
        const typeInfo = type.innerHTML;
        let toURl = dom.window.document.getElementById("action_id_711").href;
        toURl = toURl.slice(toURl.indexOf("?"));
        const token = getQueryVariable("atl_token", toURl);
        const id = getQueryVariable("id", toURl);
        const url = `${
          process.env.JIRA_URL
        }/secure/CommentAssignIssue.jspa?atl_token=${encodeURI(token)}`;
        const form = {
          inline: true,
          decorator: "dialog",
          action: 711,
          id: id,
          viewIssueKey: "",
          customfield_10905: time,
          customfield_10100: name,
          customfield_10101: task_h,
          comment: "",
          commentLevel: "",
          atl_token: token,
        };
        if (typeInfo.includes("缺陷")) {
          form.customfield_10600 = 10102;
        }

        request(
          {
            url,
            method: "POST",
            headers,
            form,
          },
          (err, response, body) => {
            if (body.includes("<h1>会话过期</h1>")) {
              console.error(`分配${name}的任务一${task}失败。- jira状态失效`);
              reject(`分配${name}的任务一${task}失败。- jira状态失效`);
              return;
            }
            if (err) {
              console.error(`分配${name}的任务一${task}失败。`);
              reject(`分配${name}的任务一${task}失败。`);
              return;
            }
            console.error(`分配${name}的任务一${task}成功。`);
            resolve(`分配${name}的任务一${task}成功。`);
          }
        );
      }
    );
  });
};
const init = async (userId, 任务号, 计划开发工时) => {
  return new Promise(async (resolve, reject) => {
    // 判断登录状态
    const state = await checkLogin();
    if (!state) {
      // 未登录 则登录
      await login();
    }
    jira(userId, 任务号, 计划开发工时)
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

module.exports = init;
