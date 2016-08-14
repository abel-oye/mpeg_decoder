// 本檔案儲存各 variable length code 的表格以及解析函式

// 每一層 table 的大小，若為 8 則 table 大小為 2^8 = 256
const NORMAL_SIZE_PER_LEVEL = 8;

// code 為 一陣列
function *generate_all_prefix(code, length) {
  var post_len = length - code.length;
  var code_num = 0;
  for (let i = 0; i < code.length; i++) {
    code_num = code_num << 1;
    code_num += code[i];
  }
  for (let i = 0; i < (1 << post_len); i++) {
    yield (code_num << post_len) + i;
  }
}

function createMatcher(info, size_per_level) {
  var len = size_per_level > info.max_code_length ? size_per_level : info.max_code_length;
  var table = new Array(1 << len);
  for (let item of info.table) {
    let code = item[0];
    let value = item[1];

  }
}
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
    [[0,0,0,0 ,0,0,0,1 ,1,1,1], 34], // macroblock_stuffing
    [[0,0,0,0 ,0,0,0,1 ,0,0,0], 35], // macroblock_escape
  ],

};

const MACROBLOCK_TYPE_I_INFO = {
  max_code_length: 2,
  table: [
    [[1], {quant: 0, motion_forward: 0, motion_backward: 0, pattern: 0, intra: 1}],
    [[0, 1], {quant: 1, motion_forward: 0, motion_backward: 0, pattern: 0, intra: 1}],
  ]
};
