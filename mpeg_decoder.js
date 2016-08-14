class Player {
  constructor(path, canvas) {
      this.path = path;
      this.canvas = canvas;

      // readbits 所需
      this.bit_counter = 0;
      this.byte_buf = null;
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

  readbits(num) {
    var ret = 0;
    for (let i = 0; i < num; i++) {
      if (this.bit_counter == 0) {
        this.byte_buf = this.readbyte();
      }
      ret = (ret << 1) + ((this.byte_buf & (1 << (7 - this.bit_counter))) > 0 ? 1 : 0);
      this.bit_counter = this.bit_counter == 7 ? 0 : this.bit_counter + 1;
    }
    return ret;
  }

  reset_readbits() {
    this.bit_counter = 0;
  }

  readbits_no_advance(num) {
    var copy_bit_counter = this.bit_counter;
    var copy_byte_buf = this.byte_buf;
    var copy_pointer = this.pointer;

    var ret = 0;
    for (let i = 0; i < num; i++) {
      if (copy_bit_counter == 0) {
        copy_byte_buf = this.buffer[copy_pointer];
        copy_pointer += 1;
      }
      ret = (ret << 1) + ((copy_byte_buf & (1 << (7 - copy_bit_counter))) > 0 ? 1 : 0);
      copy_bit_counter = copy_bit_counter == 7 ? 0 : copy_bit_counter + 1;
    }
    return ret;
  }

  readbytes (num) {
    var ret = this.buffer.slice(this.pointer, this.pointer + num);
    this.pointer += num;
    return ret;
  }

  match_macroblock_address_increment() {
    // 先使用 readbits ，效率可能頗差

  }

  read_and_log (str, len) {
    var ret = this.readbits(len);
    console.log(str + " = " + ret);
    return ret;
  }

  read_start_code (match_code) {
    var code = this.readbytes(match_code.length);
    var ok = true;
    for (let i = 0; i < match_code.length; i++) {
      ok = ok && (code[i] == match_code[i]);
    }
    ok = ok && (code[0] == match_code[0]);
    ok = ok && (code[1] == match_code[1]);
    ok = ok && (code[2] == match_code[2]);
    ok = ok && (code[3] == match_code[3]);
    return ok;
  }

  // 讀取 sequence header ，正確回傳 true
  read_sequence_header () {
    if (this.read_start_code([0x00, 0x00, 0x01, 0xB3]) == false) {
      console.error("read sequence header error");
    } else {
      console.log("read sequence header success");
    }
    // 接著讀取的 24 bytes 中，前 12 bytes 為寬度，後 12 bytes 為高度
    var width = this.readbyte();
    var tmp = this.readbyte();
    width = width * 16 + (tmp >> 4);
    var height = (tmp % (1 << 4)) * 256 + this.readbyte();
    console.log("寬*高為 " + width + " * " + height);
    this.canvas.width = width;
    this.canvas.height = height;
    this.read_and_log("pel_aspect_rate", 4);
    this.read_and_log("picture_rate", 4);
    this.read_and_log("bit_rate", 18);
    this.read_and_log("marker_bit", 1);
    this.read_and_log("vbv_buffer_size ", 10);
    this.read_and_log("constrained_parameter_flag", 1);
    var should_load = this.read_and_log("load_intra_quantizer_matrix ", 1);
    if (should_load) {
      this.readbits(8*64);
      // TODO: 處理量化矩陣
    }
    should_load = this.read_and_log("load_non_intra_quantizer_matrix", 1);
    if (should_load) {
      this.readbits(8*64);
      // TODO: 處理量化矩陣
    }

    // TODO: 處理 extension_start_code
  }

  read_group_of_pictures() {
    if (this.read_start_code([0x00, 0x00, 0x01, 0xB8]) == false) {
      console.error("read picture start code error");
    } else {
      console.log("read picture start code success");
    }
    this.read_and_log("time_code", 25);
    this.read_and_log("closed_gap", 1);
    this.read_and_log("broken_link", 1);
    this.reset_readbits();
  }

  read_picture() {
    if (this.read_start_code([0x00, 0x00, 0x01, 0x00]) == false) {
      console.error("read picture start code error");
    } else {
      console.log("read picture start code success");
    }
    this.read_and_log("temporal_reference", 10);
    var coding_type = this.read_and_log("picture_coding_type", 3);
    this.read_and_log("vbv_delay", 16);
    if (coding_type == 2 || coding_type == 3) {
      // TODO: 讀取 full_pel_forward_vector, forward_f_code
    }
    if (coding_type == 3) {
      // TODO: 讀取 full_pel_backward_vector, backward_f_code
    }
    // TODO: extra_bit_picture
    this.reset_readbits();
  }

  read_slice() {
    if (this.read_start_code([0x00, 0x00, 0x01, 0x01]) == false) {
      console.error("read slice start code error");
    } else {
      console.log("read slice start code success");
    }
    this.read_and_log("quantizer_scale", 5);
    if (this.read_and_log("extra_bit_slice", 1) == 1) {
      // TODO: 讀取 extra_information_slice
    }
  }

  read_macroblock() {
    while (this.readbits_no_advance(11) == 0x00000001111) {
      console.log("macroblock_stuffing");
    }
    console.log("macroblock_stuffing end");
    while (this.readbits_no_advance(11) == 0x00000001000) {
      console.log("macroblock_escape");
    }
    console.log("macroblock_escape end");
  }

  play() {
    this.read_sequence_header();
    this.read_group_of_pictures();
    this.read_picture();
    this.read_slice();
    this.read_macroblock();
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
