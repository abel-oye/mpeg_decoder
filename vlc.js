/*
  本檔案儲存各 variable length code 的表格以及解析函式
*/

// 每一層 table 的大小，若為 8 則 table 大小為 2^8 = 256
const NORMAL_SIZE_PER_LEVEL = 8;

function code_to_num(code) {
  var code_num = 0;
  for (let i = 0; i < code.length; i++) {
    code_num = code_num << 1;
    code_num += code[i];
  }
  return code_num;
}

class DecodeValue {
  constructor(length, value) {
    this.length = length;
    this.value = value;
  }
}

// code 為 一陣列
function *generate_all_prefix(code, length) {
  var post_len = length - code.length;
  var code_num = code_to_num(code);
  for (let i = 0; i < (1 << post_len); i++) {
    yield (code_num << post_len) + i;
  }
}

function create_match_table(info) {

  function insert_table(table, code, value, level) {
    if (code.length <= NORMAL_SIZE_PER_LEVEL) {
      for (let i of generate_all_prefix(code, NORMAL_SIZE_PER_LEVEL)) {
        table[i] = new DecodeValue(level*NORMAL_SIZE_PER_LEVEL + code.length, value);
      }
    } else {
      var index = code_to_num(code.slice(0, NORMAL_SIZE_PER_LEVEL));
      var next_table = table[index];
      if (next_table == undefined) {
        next_table = new Array(1 << NORMAL_SIZE_PER_LEVEL);
        table[index] = next_table;
      }
      var next_code = code.slice(NORMAL_SIZE_PER_LEVEL, code.length);
      insert_table(next_table, next_code, value, level + 1);
    }
  }

  var table = new Array(1 << NORMAL_SIZE_PER_LEVEL);
  for (let item of info.table) {
    var code = item[0];
    var value = item[1];
    insert_table(table, code, value, 0)
  }
  return table;
}


const MACROBLOCK_STUFFING = 34;
const MACROBLOCK_ESCAPE = 35;

const MACROBLOCK_ADDRESS_INCREMENT_INFO = {
  max_code_length: 11,
  table: [
    [[1], 1],
    [[0,1,1], 2],
    [[0,1,0], 3],
    [[0,0,1,1], 4],
    [[0,0,1,0], 5],

    [[0,0,0,1 ,1], 6],
    [[0,0,0,1 ,0], 7],
    [[0,0,0,0 ,1,1,1], 8],
    [[0,0,0,0 ,1,1,0], 9],
    [[0,0,0,0 ,1,0,1,1], 10],

    [[0,0,0,0 ,1,0,1,0], 11],
    [[0,0,0,0 ,1,0,0,1], 12],
    [[0,0,0,0 ,1,0,0,0], 13],
    [[0,0,0,0 ,0,1,1,1], 14],
    [[0,0,0,0 ,0,1,1,0], 15],

    [[0,0,0,0 ,0,1,0,1 ,1,1], 16],

    [[0,0,0,0 ,0,1,0,1 ,1,0], 17],
    [[0,0,0,0 ,0,1,0,1 ,0,1], 18],
    [[0,0,0,0 ,0,1,0,1 ,0,0], 19],
    [[0,0,0,0 ,0,1,0,0 ,1,1], 20],
    [[0,0,0,0 ,0,1,0,0 ,1,0], 21],

    [[0,0,0,0 ,0,1,0,0 ,0,1,1], 22],
    [[0,0,0,0 ,0,1,0,0 ,0,1,0], 23],
    [[0,0,0,0 ,0,1,0,0 ,0,0,1], 24],
    [[0,0,0,0 ,0,1,0,0 ,0,0,0], 25],
    [[0,0,0,0 ,0,0,1,1 ,1,1,1], 26],

    [[0,0,0,0 ,0,0,1,1 ,1,1,0], 27],
    [[0,0,0,0 ,0,0,1,1 ,1,0,1], 28],
    [[0,0,0,0 ,0,0,1,1 ,1,0,0], 29],
    [[0,0,0,0 ,0,0,1,1 ,0,1,1], 30],
    [[0,0,0,0 ,0,0,1,1 ,0,1,0], 31],

    [[0,0,0,0 ,0,0,1,1 ,0,0,1], 32],
    [[0,0,0,0 ,0,0,1,1 ,0,0,0], 33],
    [[0,0,0,0 ,0,0,0,1 ,1,1,1], MACROBLOCK_STUFFING], // macroblock_stuffing
    [[0,0,0,0 ,0,0,0,1 ,0,0,0], MACROBLOCK_ESCAPE], // macroblock_escape
  ],
};

const MACROBLOCK_TYPE_I_INFO = {
  max_code_length: 2,
  table: [
    [[1], {quant: 0, motion_forward: 0, motion_backward: 0, pattern: 0, intra: 1}],
    [[0, 1], {quant: 1, motion_forward: 0, motion_backward: 0, pattern: 0, intra: 1}],
  ]
};

const MACROBLOCK_PATTERN_INFO = {
  table: [
    [[1,1,1], 60],
    [[1,1,0,1], 4],
    [[1,1,0,0], 8],
    [[1,0,1,1], 16],
    [[1,0,1,0], 32],

    [[1,0,0,1 ,1], 12],
    [[1,0,0,1 ,0], 48],
    [[1,0,0,0 ,1], 20],
    [[1,0,0,0 ,0], 40],
    [[0,1,1,1 ,1], 28],

    [[0,1,1,1, 0], 44],
    [[0,1,1,0, 1], 52],
    [[0,1,1,0, 0], 56],
    [[0,1,0,1, 1], 1],
    [[0,1,0,1, 0], 61],

    [[0,1,0,0, 1], 2],
    [[0,1,0,0, 0], 62],
    [[0,0,1,1, 1,1], 24],
    [[0,0,1,1, 1,0], 36],
    [[0,0,1,1, 0,1], 3],

    [[0,0,1,1, 0,0], 63],
    [[0,0,1,0, 1,1,1], 5],
    [[0,0,1,0, 1,1,0], 9],
    [[0,0,1,0, 1,0,1], 17],
    [[0,0,1,0, 1,0,0], 33],

    [[0,0,1,0, 0,1,1], 6],
    [[0,0,1,0, 0,1,0], 10],
    [[0,0,1,0, 0,0,1], 18],
    [[0,0,1,0, 0,0,0], 34],
    [[0,0,0,1, 1,1,1,1], 7],

    [[0,0,0,1, 1,1,1,0], 11],
    [[0,0,0,1, 1,1,0,1], 19],

    [[0,0,0,1, 1,1,0,0], 35],
    [[0,0,0,1, 1,0,1,1], 13],
    [[0,0,0,1, 1,0,1,0], 49],
    [[0,0,0,1, 1,0,0,1], 21],
    [[0,0,0,1, 1,0,0,0], 41],

    [[0,0,0,1, 0,1,1,1], 14],
    [[0,0,0,1, 0,1,1,0], 50],
    [[0,0,0,1, 0,1,0,1], 22],
    [[0,0,0,1, 0,1,0,0], 42],
    [[0,0,0,1, 0,0,1,1], 15],

    [[0,0,0,1, 0,0,1,0], 51],
    [[0,0,0,1, 0,0,0,1], 23],
    [[0,0,0,1, 0,0,0,0], 43],
    [[0,0,0,0, 1,1,1,1], 25],
    [[0,0,0,0, 1,1,1,0], 37],

    [[0,0,0,0, 1,1,0,1], 26],
    [[0,0,0,0, 1,1,0,0], 38],
    [[0,0,0,0, 1,0,1,1], 29],
    [[0,0,0,0, 1,0,1,0], 45],
    [[0,0,0,0, 1,0,0,1], 53],

    [[0,0,0,0, 1,0,0,0], 57],
    [[0,0,0,0, 0,1,1,1], 30],
    [[0,0,0,0, 0,1,1,0], 46],
    [[0,0,0,0, 0,1,0,1], 54],
    [[0,0,0,0, 0,1,0,0], 58],

    [[0,0,0,0, 0,0,1,1, 1], 31],
    [[0,0,0,0, 0,0,1,1, 0], 47],
    [[0,0,0,0, 0,0,1,0, 1], 55],
    [[0,0,0,0, 0,0,1,0, 0], 59],
    [[0,0,0,0, 0,0,0,1, 1], 27],

    [[0,0,0,0, 0,0,0,1, 0], 39],
  ]
};

const DCT_DC_SIZE_LUMINANCE_INFO = {
  table: [
    [[1,0,0], 0],
    [[0,0], 1],
    [[0,1], 2],
    [[1,0,1], 3],
    [[1,1,0], 4],
    [[1,1,1,0], 5],
    [[1,1,1,1,0], 6],
    [[1,1,1,1,1,0], 7],
    [[1,1,1,1,1,1,0], 8]
  ]
};

const DCT_DC_SIZE_CHROMINANCE_INFO = {
  table: [
    [[0,0], 0],
    [[0,1], 1],
    [[1,0], 2],
    [[1,1,0], 3],
    [[1,1,1,0], 4],
    [[1,1,1,1,0], 5],
    [[1,1,1,1,1,0], 6],
    [[1,1,1,1,1,1,0], 7],
    [[1,1,1,1,1,1,1,0], 8]
  ]
};

var MACROBLOCK_ADDRESS_INCREMENT_TABLE = create_match_table(MACROBLOCK_ADDRESS_INCREMENT_INFO);
var MACROBLOCK_TYPE_I_TABLE = create_match_table(MACROBLOCK_TYPE_I_INFO);
var MACROBLOCK_PATTERN_TABLE = create_match_table(MACROBLOCK_PATTERN_INFO);
var DCT_DC_SIZE_LUMINANCE_TABLE = create_match_table(DCT_DC_SIZE_LUMINANCE_INFO);
var DCT_DC_SIZE_CHROMINANCE_TABLE = create_match_table(DCT_DC_SIZE_CHROMINANCE_INFO);