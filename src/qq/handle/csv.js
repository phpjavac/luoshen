const giveTo = require('../../../lib/give_to')

function csv(event){
    const data = event.raw_message.split(" ");
    if (data[0] !== "csv") return;
    giveTo.SsrtoCsv(data[1]).then(async (res) => {
      if (res === "done") {
        const gfs = client.acquireGfs(706809115);
        await gfs.upload("./data.csv");
        gfs.ls().then(async (r) => {
          const data = r.find((rf) => rf.name === "data.csv");
          const downUrl = await gfs.download(data.fid);
          event.reply(downUrl.url);
          setTimeout(() => {
            gfs.rm(data.fid);
          }, 1000 * 60 * 10);
        });
      }
    });
}

module.exports = csv
