const { createClient } = require("oicq");

const account = process.env.qq;
// const password = process.env.password;
const client = createClient('1410382913');

function login() {
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


  /****************************************
  * 密码登录
  * 缺点是需要过滑块，可能会报环境异常
  * 优点是一劳永逸
  */
  // client
  //   .on("system.login.slider", function (event) {
  //     //监听滑动验证码事件
  //     process.stdin.once("data", (input) => {
  //       this.sliderLogin(input); //输入ticket
  //     });
  //   })
  //   .on("system.login.device", function (event) {
  //     //监听登录保护验证事件
  //     process.stdin.once("data", () => {
  //       this.login(); //验证完成后按回车登录
  //     });
  //   })
  //   .login(password); //需要填写密码或md5后的密码
}





module.exports = { client,login }