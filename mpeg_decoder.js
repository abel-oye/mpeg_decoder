class Player {
  constructor(path, canvas) {
      this.path = path;
      this.canvas = canvas;
  }

  loadVideo(params) {
    var params = params || {};
    var that = this;
    fetch(this.path).then(function (response) {
      return response.arrayBuffer();
    }).then(function (arrayBuffer) {
      that.buffer = new Uint8Array(arrayBuffer);
      that.pointer = 0;
      console.log(that.buffer.length);
      for (let i = 0; i < 10; i++) {
        console.log(that.buffer[i]);
      }
      if (params.autoplay) {
        console.log("start play");
        that.play();
      }
    })
  }

  readbyte () {
    var ret = this.buffer[this.pointer];
    this.pointer += 1;
    return ret;
  }

  readbytes (num) {
    var ret = this.buffer.slice(this.pointer, this.pointer + num);
    this.pointer += num;
    return ret;
  }

  // 讀取 sequence header ，正確回傳 true
  read_sequence_header () {
    var header = this.readbytes(4);
    var ok = true;
    ok = ok && (header[0] == 0x00);
    ok = ok && (header[1] == 0x00);
    ok = ok && (header[2] == 0x01);
    ok = ok && (header[3] == 0xB3);
    return ok;
  }

  play() {
    if (this.read_sequence_header() == false) {
      console.error("read sequence header error");
    } else {
      console.log("read sequence header success");
    }
    // 接著讀取前十二 byte 為高度
    var height = this.readbyte();
    var mid = this.readbyte();
    height = height * 16 + (mid >> 4);
    var width = (mid % 16) * 256 + this.readbyte();
    console.log("長寬為 " + height + " * " + width);
    var ctx = this.canvas.getContext('2d');
    ctx.fillStyle = "rgb(200,0,0)";
    ctx.fillRect (10, 10, 55, 50);
    ctx.fillStyle = "rgba(0, 0, 200, 0.5)";
    ctx.fillRect (30, 30, 55, 50);
  }


  // 進階功能

  access_to (time) {

  }

  resume () {

  }

  stop () {

  }

  fast_forward (times) {

  }

  backward () {

  }

}
