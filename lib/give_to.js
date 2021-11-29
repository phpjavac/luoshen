require("dotenv").config();
const request = require("request");
const jsdom = require("jsdom");
const jiraUserList = require("../jira.userList.json");
const { parseString } = require("xml2js");
const fs = require("fs");
const dayjs = require('dayjs')
const axios = require('axios').default;
require('dayjs/locale/zh-cn')
dayjs.locale('zh-cn')
var customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)

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
  console.info("重新登录");
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
      headers.cookie = response.headers["set-cookie"];
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
  const keys = Object.keys(jiraUserList);
  const trueName = keys.find((ele) => name === jiraUserList[ele]);
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
        const dom = new jsdom.JSDOM(body); // summary-val

        const type = dom.window.document.getElementById("type-val");

        const taskName = dom.window.document.getElementById("summary-val");
        // console.log(`开始分配${name}的任务一${taskName.innerHTML}`);
        if (!taskName) {
          console.error(`${process.env.JIRA_URL}browse/${task}`, body);
          console.error(`分配失败--检查任务状态-taskName`);
          console.error(`分配${[trueName]}的任务-${task}失败。任务号不存在。`);
          // console.log(1)
          resolve(`分配${trueName}的任务-${task}失败。任务号不存在。`);
          return;
        }
        if (!type) {
          console.error(`${process.env.JIRA_URL}browse/${task}`, body);
          console.error(`分配失败--检查任务状态-type`);
          console.error(`分配${[trueName]}的任务一${taskName.innerHTML}失败。`);
          // console.log(1)
          resolve(
            `分配${trueName}的任务一${taskName.innerHTML}失败。-${process.env.JIRA_URL}browse/${task}`
          );
          return;
        }
        if (!dom.window.document.getElementById("action_id_711")) {
          console.error(`分配失败--检查任务状态`);
          console.error(`分配${trueName}的任务一${taskName.innerHTML}失败。`);
          // console.log(2)
          resolve(
            `分配${trueName}的任务一${taskName.innerHTML}失败。-${process.env.JIRA_URL}browse/${task}`
          );
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
              console.error(
                `分配${trueName}的任务一${taskName.innerHTML}失败。- jira状态失效`
              );
              resolve(
                `分配${trueName}的任务一${taskName.innerHTML}失败。- jira状态失效`
              );
              return;
            }
            if (err) {
              console.error(
                `分配${trueName}的任务一${taskName.innerHTML}失败。`
              );
              resolve(
                `分配${trueName}的任务一${taskName.innerHTML}失败。-${process.env.JIRA_URL}browse/${task}`
              );
              return;
            }
            console.error(`分配${trueName}的任务一${taskName.innerHTML}成功。`);
            resolve(
              `分配${trueName}的任务一${taskName.innerHTML}成功。-${process.env.JIRA_URL}browse/${task}`
            );
          }
        );
      }
    );
  });
};
const getTaskTitle = async (task) => {
  return new Promise(async (resolve, reject) => {
    // 判断登录状态
    const state = await checkLogin();
    if (!state) {
      // 未登录 则登录
      await login();
    }
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
        const dom = new jsdom.JSDOM(body); // summary-val

        const title = dom.window.document.getElementById("summary-val");
        resolve(title.innerHTML);
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

const SsrtoCsv = async (url) => {
  return new Promise(async (resolve, reject) => {
    // 判断登录状态
    const state = await checkLogin();
    if (!state) {
      // 未登录 则登录
      await login();
    }
    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",

      cookie: [JSESSIONID, token],
    };

    return request(
      {
        url,
        method: "GET",
        headers,
      },
      async (err, response, body) => {
        const csv = ["title,description"];
        parseString(body, (err, result) => {
          const item = result.rss.channel[0].item;
          item.forEach((i) => {
            csv.push(`${i.title[0]},${i.summary[0]}`);
          });
          console.log(csv);
          fs.writeFile(
            "./data.csv",
            `\ufeff${csv.join("\r\n")}`,
            "utf8",
            (err) => {
              resolve(err || "done");
            }
          );
        });
      }
    );
  });
};
const test = () => {
  return new Promise((resolve, rej) => {
    request(
      {
        url: "http://pt.aiisx.com/api/v2/app/version",
        method: "GET",
        headers: {
          cookie: ["SID=lZM8e2KLIk3kv9lzoWKqRHL37RxWErh7"],
        },
      },
      (err, res, body) => {
        resolve(body);
      }
    );
  });
};

/** 绩效 */
const achievements = async (url) => {
  return new Promise(async (resolve, reject) => {
    // 判断登录状态
    const state = await checkLogin();
    if (!state) {
      // 未登录 则登录
      await login();
    }
    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",

      cookie: [JSESSIONID, token],
    };

    return request(
      {
        url,
        method: "GET",
        headers,
      },
      async (err, response, body) => {
        parseString(body, (err, result) => {
          try {
            console.log("开始");
            const obj = {};
            const item = result.rss.channel[0].item;
            item.forEach((i) => {
             let isTask = true;

              const custom = i.customfields[0].customfield;
              const name = custom.find((cus)=> cus["$"].id === "customfield_10100").customfieldvalues[0].customfieldvalue[0]
              const working_hours = custom.find((cus)=> cus["$"].id === "customfield_10101").customfieldvalues[0].customfieldvalue[0]
              if(!custom.find((cus)=> cus["$"].id === "customfield_10800") || !custom.find((cus)=> cus["$"].id === "customfield_10905")){
                isTask = false;
              }
              const passing_rate =  isTask ? custom.find((cus)=> cus["$"].id === "customfield_10800").customfieldvalues[0].customfieldvalue[0] : 100
              const plan_on_time = isTask? custom.find((cus)=> cus["$"].id === "customfield_10905").customfieldvalues[0].customfieldvalue[0]: ''
              const first_on_time = isTask ? custom.find((cus)=> cus["$"].id === "customfield_10300").customfieldvalues[0].customfieldvalue[0]: ''

              if(!obj.hasOwnProperty(name)){
                obj[name] = {
                  /** 总工时 */
                  working_hours:0,
                  working_hours_score:0,
                  /** 总测试通过率 */
                  passing_rate:0,
                  passing_rate_score:0,
                  /** 任务超时 */
                  finish_on_time:0,
                  finish_on_time_score:0,
                  total:0,
                }
              }
              obj[name].total += 1;
              obj[name].working_hours += parseFloat(working_hours);
              obj[name].passing_rate += parseFloat(passing_rate);
              if(isTask){
                if(dayjs(first_on_time,'zh-cn').isAfter(dayjs(plan_on_time,'zh-cn'))){
                  obj[name].finish_on_time += 1;
                }
              }
            });
            for (const key in obj) {
              if (Object.hasOwnProperty.call(obj, key)) {
                const element = obj[key];
                element.passing_rate_score = ((element.passing_rate - ((element.total * 100 - element.passing_rate) * 4)) / element.total).toFixed(2)
                element.finish_on_time_score = ((element.total - element.finish_on_time) / element.total).toFixed(2)
              }
            }
            resolve(obj);
          } catch (error) {
            reject(error);
          }

        });
      }
    );
  });
};
module.exports = { init, getTaskTitle, SsrtoCsv, test, achievements };
