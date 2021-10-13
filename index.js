require("dotenv").config();
const { default: axios } = require("axios");
const { createClient } = require("oicq");
const express = require("express");
const app = express();
const giveTo = require("./lib/give_to");
const schedule = require("node-schedule");

const account = process.env.qq;;
const client = createClient(account);
//监听上线事件
client.on("system.online", () => {
  console.log("Logged in!");
  app.listen(1234, () => {
    console.log(`Example app listening at http://localhost:${1234}`);
  });
});
app.all("/", (res, req, next) => {
  console.log(res.query, req);
  
  next();
});
//监听消息并回复
client.on("message", async (event) => {
  console.log(event.group_id);
  if (event.message_type === "group") {
    const userMemberList = await client.getGroupMemberList(event.group_id);
    if (event.raw_message.includes("分配")) {
      const data = event.raw_message.split(" ");
      event.reply(`开始分配${data[2]}的任务`);
      giveTo(data[1], data[2], data[3])
        .then((res) => {
          event.reply(res);
        })
        .catch((err) => {
          event.reply(err);
        });
      return;
    } else if (event.raw_message.includes("拍一拍")) {
      userMemberList.data.forEach((item) => {
        client.sendGroupPoke(event.group_id, item.user_id);
      });
    } else if (event.raw_message.includes("一言")) {
      const message = await axios.get("https://v1.jinrishici.com/rensheng.txt");
      client.sendGroupMsg(event.group_id, message.data);
    } else if (event.raw_message === "天气预报") {
      const message = await getWeather();
      client.sendGroupMsg(event.group_id, message);
    }
    // else if (event.raw_message.includes("沉默")) {
    //   await client.setGroupWholeBan(event.group_id, true);
    //   if (event.raw_message.includes("解除")) {
    //     await client.setGroupWholeBan(event.group_id, false);
    //   }
    // }
  }
});

/****************************************
 * 手机QQ扫描二维码登录(与下面的密码登录二选一)
 * 优点是不需要过滑块和设备锁
 * 缺点是万一token失效，无法自动登录，需要重新扫码
 */
client
  .on("system.login.qrcode", function (event) {
    process.stdin.once("data", () => {
      this.login(); //扫码后按回车登录
    });
  })
  .login(); //这里不填写密码

// const job = schedule.scheduleJob('01 20 * * *', async () => {
//   const message = await getWeather()
//   client.sendGroupMsg("706809115", message)
// });

// const job1 = schedule.scheduleJob('30 7 * * *', async () => {
//   const message = await getWeather()
//   client.sendGroupMsg("706809115", message)
// });


const getWeather = () => {
  return new Promise((resolve, reject) => {
    axios
      .get("http://www.weather.com.cn/data/cityinfo/101020300.html")
      .then((res) => {
        const { weatherinfo } = res.data;
        const message = `哥哥 哥哥~ 未来24小时上海最高气温 ${weatherinfo.temp2}度 最低气温${weatherinfo.temp1} , 天气情况 ${weatherinfo.weather} 呢，话说我天天缠着你 你女朋友不会生气吧~ [CQ:face,id=21,text=可爱] [CQ:face,id=21,text=可爱]`;
        resolve(message);
      })
      .catch((err) => {
        resolve(err);
      });
  });
};

//-------------------------------------------------------------------------

/****************************************
 * 密码登录
 * 缺点是需要过滑块，可能会报环境异常
 * 优点是一劳永逸
 */
// client.on("system.login.slider", function (event) { //监听滑动验证码事件
//   process.stdin.once("data", (input) => {
//     this.sliderLogin(input); //输入ticket
//   });
// }).on("system.login.device", function (event) { //监听登录保护验证事件
//   process.stdin.once("data", () => {
//     this.login(); //验证完成后按回车登录
//   });
// }).login("password"); //需要填写密码或md5后的密码
