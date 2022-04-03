const process = require('process');
const cp = require('child_process');
const path = require('path');

// shows how the runner will run a javascript action with env / stdout protocol
test('test runs', () => {
  process.env['SOURCE_FOLDER'] = "../OctoPrintPlugin";
  const ip = path.join(__dirname, 'index.js');
  //const result = cp.execSync(`node ${ip}`, {env: process.env}).toString();
  const result = 0
  console.log(result);
})
