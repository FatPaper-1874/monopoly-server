const path = require("path");
const {
  workerData,
  isMainThread,
  Worker,
  parentPort
} = require("worker_threads");

class TSWorker extends Worker {
  constructor(path, opt = { workerData: {} }) {
    return new Worker(__filename, {
      ...opt,
      workerData: {
        path,
        ...opt.workerData
      }
    });
  }
}
if (isMainThread) {
  module.exports = { TSWorker };
} else {
  try {
    require("ts-node").register({
      project: path.resolve(__dirname, "tsconfig.json")
    });
    require(path.resolve(__dirname, workerData.path));
  } catch (e) {
    console.error(e);
    parentPort.postMessage(e);
  }
}