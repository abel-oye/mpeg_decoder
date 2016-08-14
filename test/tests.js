var expect = chai.expect;

describe('測試 code_num', function() {
	it('[1, 0] = 2', function() {
		expect(code_to_num([1, 0])).to.be.equal(2);
	});
	it('[1, 1, 0] = 6', function() {
		expect(code_to_num([1, 1, 0])).to.be.equal(6);
	});
});

describe('測試 generate_all_prefix', function() {
	it('generate_all_prefix([1], 3) 配對 [4, 5, 6, 7] ', function() {
		var target = [4, 5, 6, 7];
		var index = 0;
		var ok = true;
		for (let item of generate_all_prefix([1], 3)) {
			ok = ok && (item == target[index++]);
		}
		expect(ok).to.be.equal(true);
	});
});
