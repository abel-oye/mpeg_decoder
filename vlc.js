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

var t = create_match_table(MACROBLOCK_TYPE_I_INFO)
console.log(t[0]);
console.log(t[1]);
console.log(t[2]);
console.log(t[3]);
var t2 = create_match_table(MACROBLOCK_ADDRESS_INCREMENT_INFO);
