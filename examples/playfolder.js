const DFPlayerMini = require('../dfplayer-mini');
const Obniz = require("obniz");

const obniz = new Obniz("Obniz ID");
obniz.onconnect = async function () {
  console.log('Obniz connected');
  Obniz.PartsRegistrate(DFPlayerMini);
  const dfplayer = obniz.wired("dfplayermini", { tx:0, rx:1, busy: 2, busy_pull: '5v'} );
  await dfplayer.config();
  await dfplayer.volume(5);
  await dfplayer.playFolder(2, 1);
  await obniz.wait(30*1000);
  await dfplayer.stop();
  await dfplayer.playFolder(2, 2);
  await obniz.wait(30*1000);
  await dfplayer.stop();
  await dfplayer.playFolder(2, 3);
  await obniz.wait(30*1000);
  await dfplayer.stop();
}