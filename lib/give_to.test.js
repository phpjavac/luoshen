const giveTo = require("./give_to");
// test("测试获取任务名称", () => {
//   return giveTo.getTaskTitle("TS-1146").then((data) => {
//     expect(data).toBe("组件库添加一个useAwaitDom函数");
//   });
// });
// test("测试jira转csv", () => {
//   return giveTo
//     .SsrtoCsv(
//       "http://9hg49hgn32rh20jira.findsoft.com.cn:8888/sr/jira.issueviews:searchrequest-xml/temp/SearchRequest.xml?jqlQuery=project+%3D+%22%E5%85%AC%E5%85%B1%E7%AE%A1%E7%90%86%E6%A1%88%E4%BE%8B%E5%BA%93%28%E7%A0%94%E5%8F%91%29%22+AND+fixVersion+%3D+3.5.0+AND+resolution+is+EMPTY&tempMax=1000"
//     )
//     .then((res) => {
//       expect(res).toBe("done");
//     });
// });
jest.setTimeout(1000000)
test("测试", () => {
  return giveTo
    .achievements("http://intranet.jira.findsoft.com.cn:8888/sr/jira.issueviews:searchrequest-xml/temp/SearchRequest.xml?jqlQuery=%E9%A6%96%E6%AC%A1%E8%A7%A3%E5%86%B3%E6%97%B6%E9%97%B4+%3E%3D+startOfMonth%28%29+AND+%E9%A6%96%E6%AC%A1%E8%A7%A3%E5%86%B3%E6%97%B6%E9%97%B4+%3C%3D+endOfMonth%28%29+AND+%E5%BC%80%E5%8F%91%E8%80%85+in+%28membersOf%28%E5%89%8D%E7%AB%AF%E7%BB%84%29%29+ORDER+BY+cf%5B10100%5D+ASC&tempMax=1000")
    .then((res) => {
      expect(res).toBe("v4.3.0.1");
    });
});
