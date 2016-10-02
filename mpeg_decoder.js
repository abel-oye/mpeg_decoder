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

  // 僅用於測試時創建測試資料
  loadFakeVideo(buffer) {
    this.buffer = buffer;
    this.pointer = 0;
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

  only_move_by_bit(num) {
    if (num > 0) {
      var bytes = Math.floor(num / 8);
      var bits = num % 8;
      this.bit_counter += bits;
      if (this.bit_counter >= 8) {
        bytes += 1;
        this.bit_counter -= 8;
      }
      this.pointer += bytes;
      this.byte_buf = this.buffer[this.pointer];
    } else if (num < 0) {
      num = -num;
      var bytes = Math.floor(num / 8);
      var bits = num % 8;
      this.bit_counter -= bits;
      if (this.bit_counter < 0) {
        bytes += 1;
        this.bit_counter += 8;
      }
      this.pointer -= bytes;
      this.byte_buf = this.buffer[this.pointer];
    }
  }

  read_vlc(table) {
    var s = this.readbits(NORMAL_SIZE_PER_LEVEL);
    var r = table[s];
    var times = 0;
    while (true) {
      times += 1;
      if (r == undefined) {
        // XXX: 尋找 javascript 中錯誤處理的方式
        console.error("fatal error: read vlc get undefined");
      } else if (!(r instanceof DecodeValue)) {
        s = this.readbits(NORMAL_SIZE_PER_LEVEL);
        r = r[s];
      } else {
        this.only_move_by_bit(-(times * NORMAL_SIZE_PER_LEVEL - r.length));
        return r;
      }
    }
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
    this.coding_type = coding_type;
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
      console.err("未處理 extra_information_slice");
    }
  }

  read_macroblock() {
    var address_increment = this.read_vlc(MACROBLOCK_ADDRESS_INCREMENT_TABLE);
    console.log('macroblock_address_increment is ' + address_increment.value + ', length ' + address_increment.length);
    if (address_increment.value == MACROBLOCK_STUFFING) {
      console.log("macroblock_stuffing");
    } else if (address_increment.value == MACROBLOCK_ESCAPE) {
      console.log("macroblock_escape");
    }
    // TODO: 判斷 picture_coding_type 之後再決定用哪個 table
    var type = this.read_vlc(MACROBLOCK_TYPE_I_TABLE)
    this.macroblock_intra = type.value.intra;
    if (type.value.quant == 1) {
      var quantizer_scale = this.read_and_log("quantizer_scale", 5);
    }
    if (type.value.motion_forward) {
      console.err("未處理 motion_forward");
    }
    if (type.value.motion_backward) {
      console.err("未處理 motion_backward");
    }
    if (type.value.pattern) {
      console.err("未處理 pattern");
    }
    this.pattern_code = [0, 0, 0, 0, 0, 0];
    for (let i = 0; i < 6; i++) {
      // TODO: 待 pattern 處理後，再加一層限制條件
      // if (code_block_pattern & (1 << (5-i))) {pattern_code[i] = 1;}
      if (type.value.intra == 1) {
        this.pattern_code[i] = 1;
      }
    }
    for (let i = 0; i < 6; i++) {
      if (this.pattern_code[i]) {
        // this.read_block(i);
      }
    }
  }

  read_dct_dc_differential(num) {
    var ret = this.readbits(num);
    if ((ret & (1 << (num - 1))) == 0) {
      console.log("modify");
      ret = -(~ret & ((1 << num) - 1));
    }
    return ret;
  }

  read_block(i) {
    if (this.macroblock_intra) {
      if (i < 4) {
        var dct_dc_size_luminance = this.read_vlc(DCT_DC_SIZE_LUMINANCE_TABLE);
        if (dct_dc_size_luminance != 0) {
        //   read dct_dc_differential
        }
      } else {
        var dct_dc_size_chrominance = this.read_vlc(DCT_DC_SIZE_CHROMINANCE_TABLE);
        if (dct_dc_size_chrominance != 0) {
        //   read dct_dc_differential
        }
      }
    } else {
      // read dct_coeff_first
    }
    if (this.coding_type != 4) {
    //   while (this.readbits_no_advance(2) != 2) {
        // read dct_coeff_next
    //   }
    //   this.readbits(2);
    }
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
