class Player {
  constructor(path, canvas) {
    this.path = path;
    this.canvas = canvas;
  }

  loadVideo(params) {
    var that = this;
    fetch("/data/I_ONLY.M1V").then(function (response) {
      return response.arrayBuffer();
    }).then(function (arrayBuffer) {
      that.buffer = new Uint8Array(arrayBuffer);
      console.log(that.buffer.length);
      if (params.autoplay) {
        that.play()
      }
    })
  }

  play() {
    var ctx = this.canvas.getContext('2d');
    ctx.fillStyle = "rgb(200,0,0)";
    ctx.fillRect (10, 10, 55, 50);
    ctx.fillStyle = "rgba(0, 0, 200, 0.5)";
    ctx.fillRect (30, 30, 55, 50);
  }
}
