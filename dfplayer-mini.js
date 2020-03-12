const START_BYTE = 0x7e;
const VERSION_BYTE = 0xff;
const COMMAND_LENGTH = 0x06;
const ACKNOWLEDGE = 0x00;
const END_BYTE = 0xef;

function split(num) {
  return [num >> 8, num & 0xff];
}

/**
 * DFPlayer miniのシリアル通信フォーマットのバイト配列を生成する関数
 */
function buildCmdArray(cmd, para1 = 0, para2 = 0) {
  const checksum = -(
    VERSION_BYTE +
    COMMAND_LENGTH +
    cmd +
    ACKNOWLEDGE +
    para1 +
    para2
  );
  const checksumSplited = split(checksum);
  const highByte = checksumSplited[0];
  const lowByte = checksumSplited[1];
  const commandLine = [
    START_BYTE & 0xff,
    VERSION_BYTE & 0xff,
    COMMAND_LENGTH & 0xff,
    cmd & 0xff,
    ACKNOWLEDGE & 0xff,
    para1 & 0xff,
    para2 & 0xff,
    highByte & 0xff,
    lowByte & 0xff,
    END_BYTE & 0xff
  ];
  return commandLine;
}

/**
 * obniz custom parts for DFPlayer mini
 */
class DFPlayerMini {

  constructor() {
    this.keys = ['tx', 'rx', 'busy', 'busy_pull', 'baud'];
    this.requiredKeys = ['tx', 'rx'];

    this.CONFIG_LATENCY = 1000;
    this.CMD_LATENCY = 100;

    this.CMD = {
      CONFIG: 0x3f, // 初期化コマンド
      VOLUME: 0x06, // ボリューム設定
      PLAY: 0x03, // トラックを指定再生
      PLAY_FOLDER: 0x0f, // フォルダ、トラックを指定して再生
      STOP: 0x16, // 停止
    }
  }

  static info() {
    return {
      name: 'dfplayermini',
    };
  }

  wired(obniz) {
    this.obniz = obniz;

    const uart = this.obniz.getFreeUart();
    const baud = this.params.baud || 9600;
    uart.start({ tx: this.params.tx, rx: this.params.rx, baud: baud });
    this.uart = uart;

    if (this.params.busy) {
      const busy = obniz.getIO(this.params.busy);
      const busy_pull = this.params.busy_pull || '3v';
      busy.pull(busy_pull);
      this.busy = busy;
    }

  }

  config() {
    return new Promise(async (resolve, reject) => {
      this.uart.send(buildCmdArray(this.CMD.CONFIG));
      await this.obniz.wait(this.CONFIG_LATENCY);
      resolve();
    });
  }

  isPlaying() {
    return new Promise(async (resolve, reject) => {
      let ret = await this.busy.inputWait();
      resolve(ret === false);
    });
  }

  volume(val) {
    return new Promise(async (resolve, reject) => {
      this.uart.send(buildCmdArray(this.CMD.VOLUME, 0, val));
      await this.obniz.wait(this.CMD_LATENCY);
      resolve();
    });
  }

  play(truckNum) {
    return new Promise(async (resolve, reject) => {
      this.uart.send(buildCmdArray(this.CMD.PLAY, 0, truckNum));
      await this.obniz.wait(this.CMD_LATENCY);
      resolve();
    });
  }

  playFolder(folder, truck) {
    return new Promise(async (resolve, reject) => {
      this.uart.send(buildCmdArray(this.CMD.PLAY_FOLDER, folder, truck));
      await this.obniz.wait(this.CMD_LATENCY);
      resolve();
    });
  }

  stop() {
    return new Promise(async (resolve, reject) => {
      this.uart.send(buildCmdArray(this.CMD.STOP));
      await this.obniz.wait(this.CMD_LATENCY);
      resolve();
    });
  }
}

if (typeof module === 'object') {
  module.exports = DFPlayerMini;
}