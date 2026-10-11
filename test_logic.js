// Root : لفظ المعماري 2026-10-10 «عايز سيشن ابني اللعبه دي بس بمنهج و طريقه عاطف» — والتصميم اعتمده بالأداة 2026-10-10
// تشغيل: node test_logic.js
'use strict';
var assert = require('assert');
var L = require('./logic.js');
var N = L.SIZE;
var passed = 0, failed = 0;

function test(name, fn) {
  try { fn(); passed++; console.log('✓ ' + name); }
  catch (e) { failed++; console.log('✗ ' + name + '\n   ' + e.message); }
}
function seq(values) { var i = 0; return function () { return values[i++ % values.length]; }; }
function shapeIndex(cells) { return L.SHAPES.findIndex(function (s) { return JSON.stringify(s) === JSON.stringify(cells); }); }
function piece(cells) { return { shape: shapeIndex(cells), cells: cells, color: 1 }; }
var ONE = [[0, 0]];
var BIG = [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]];
function game(tray) {
  var g = L.newGame(seq([0.5]));
  g.tray = tray.map(piece);
  return g;
}

test('وضع قانوني وغير قانوني', function () {
  var b = L.emptyBoard();
  assert.ok(L.canPlace(b, L.SHAPES[10], 0, 0));
  assert.ok(!L.canPlace(b, L.SHAPES[10], 6, 6), 'خارج اللوح');
  assert.ok(!L.canPlace(b, ONE, -1, 0), 'خارج اللوح من فوق');
  b[0] = 1;
  assert.ok(!L.canPlace(b, ONE, 0, 0), 'فوق خلية مشغولة');
});

test('مسح صف + نقطه (خط واحد = 10 + الخلايا)', function () {
  var g = game([ONE, ONE, ONE]);
  for (var c = 1; c < N; c++) g.board[c] = 2;
  g.board[7 * N] = 3; // عشان اللوح ما يفضاش (وإلا Amazing)
  var res = L.place(g, 0, 0, 0);
  assert.strictEqual(res.lines, 1);
  assert.strictEqual(res.praise.word, 'Nice!');
  assert.deepStrictEqual(res.rows, [0]);
  assert.strictEqual(res.gained, 1 + 10);
  for (var c2 = 0; c2 < N; c2++) assert.strictEqual(g.board[c2], 0);
});

test('مسح عمود', function () {
  var g = game([ONE, ONE, ONE]);
  for (var r = 1; r < N; r++) g.board[r * N + 3] = 2;
  var res = L.place(g, 0, 0, 3);
  assert.deepStrictEqual(res.cols, [3]);
  for (var r2 = 0; r2 < N; r2++) assert.strictEqual(g.board[r2 * N + 3], 0);
});

test('صف وعمود مع بعض — الخلية المشتركة تتحسب مرة، والنقط 40', function () {
  var g = game([ONE, ONE, ONE]);
  for (var i = 0; i < N; i++) { g.board[2 * N + i] = 2; g.board[i * N + 5] = 2; }
  g.board[2 * N + 5] = 0;
  var res = L.place(g, 0, 2, 5);
  assert.strictEqual(res.lines, 2);
  assert.strictEqual(res.cleared.length, 15);
  assert.strictEqual(res.gained, 1 + 40 + 300, 'اللوح فضي ⇒ Amazing +300');
  assert.strictEqual(res.praise.word, 'Amazing!');
  assert.ok(g.board.every(function (v) { return v === 0; }));
});

test('الكومبو بيتراكم، ويرجع صفر بعد 3 قطع من غير مسح', function () {
  var g = game([ONE, ONE, ONE]);
  for (var c = 1; c < N; c++) { g.board[c] = 2; g.board[N + c] = 2; }
  var a = L.place(g, 0, 0, 0);
  assert.strictEqual(a.combo, 1);
  var b = L.place(g, 1, 1, 0);
  assert.strictEqual(b.combo, 2);
  assert.strictEqual(b.gained, 1 + 10 * 2 + 300, 'المسح التاني مضروب ×2، واللوح فضي');
  g.tray = [piece(ONE), piece(ONE), piece(ONE)];
  L.place(g, 0, 5, 0); assert.strictEqual(g.combo, 2);
  L.place(g, 1, 5, 2); assert.strictEqual(g.combo, 2);
  L.place(g, 2, 5, 4); assert.strictEqual(g.combo, 0, 'التالتة من غير مسح تصفّر');
});

test('صينية جديدة بعد ما التلاتة يتحطوا', function () {
  var g = game([ONE, ONE, ONE]);
  L.place(g, 0, 0, 0); L.place(g, 1, 0, 2);
  assert.strictEqual(g.tray[2].cells.length, 1);
  L.place(g, 2, 0, 4);
  assert.ok(g.tray[0] && g.tray[1] && g.tray[2]);
});

test('كشف النهاية: ما فيش مكان لأي قطعة باقية', function () {
  var g = game([BIG, BIG, ONE]);
  for (var i = 0; i < N * N; i++) g.board[i] = ((i % N) + Math.floor(i / N)) % 2 ? 1 : 0; // شطرنج: ما فيش 3×3 فاضي
  g.board[0] = 0;
  var res = L.place(g, 2, 0, 0);
  assert.ok(res);
  assert.ok(g.over, 'التلاتة الكبار ما ليهمش مكان');
  assert.ok(!L.isOver(game([ONE, BIG, BIG])), 'لوح فاضي مش نهاية');
});

test('شرط التوليد: لوح ما فيهوش غير خانة واحدة ⇒ الصينية فيها قطعة تدخل', function () {
  var b = L.emptyBoard();
  for (var i = 0; i < N * N; i++) b[i] = 1;
  b[27] = 0;
  var one = (shapeIndex(ONE) + 0.5) / L.SHAPES.length;
  var big = (shapeIndex(BIG) + 0.5) / L.SHAPES.length;
  // أول 49 محاولة كلها مربعات 3×3، والمحاولة الخمسين فيها مربع واحد
  var vals = [];
  for (var k = 0; k < 49 * 3; k++) vals.push(big, 0);
  vals.push(one, 0, big, 0, big, 0);
  var tray = L.dealTray(b, seq(vals));
  assert.ok(tray.some(function (p) { return L.fitsAnywhere(b, p.cells); }));
});

test('التراجع يرجّع كل حاجة مرة واحدة بس — حتى بعد النهاية', function () {
  var g = game([ONE, ONE, ONE]);
  for (var c = 1; c < N; c++) g.board[c] = 2;
  var before = JSON.stringify({ b: g.board, s: g.score, c: g.combo, n: g.noClear, t: g.tray });
  L.place(g, 0, 0, 0);
  g.over = true;
  assert.ok(L.undo(g));
  assert.strictEqual(g.lines, 0); assert.strictEqual(g.level, 1);
  assert.strictEqual(JSON.stringify({ b: g.board, s: g.score, c: g.combo, n: g.noClear, t: g.tray }), before);
  assert.ok(!g.over);
  L.place(g, 0, 0, 0);
  assert.ok(!L.undo(g), 'المرة التانية ممنوعة');
});

test('جولات عشوائية كاملة ما بتكسرش القواعد', function () {
  for (var round = 0; round < 200; round++) {
    var g = L.newGame(Math.random), moves = 0;
    while (!g.over && moves < 2000) {
      var done = false;
      for (var t = 0; t < 3 && !done; t++) {
        if (!g.tray[t]) continue;
        for (var r = 0; r < N && !done; r++) for (var c = 0; c < N && !done; c++) {
          if (L.canPlace(g.board, g.tray[t].cells, r, c)) { assert.ok(L.place(g, t, r, c)); done = true; }
        }
      }
      assert.ok(done, 'لو مش نهاية لازم يبقى في حركة');
      moves++;
    }
    assert.ok(g.board.every(function (v) { return v >= 0 && v <= 6; }));
    assert.ok(g.score >= 0);
  }
});

test('الليفلات: ليفل 1 قطع سهلة بس، وبتطلع بعد 3 خطوط', function () {
  var b = L.emptyBoard();
  for (var k = 0; k < 300; k++) {
    var tray = L.dealTray(b, Math.random, 1);
    tray.forEach(function (p) { assert.ok(L.POOLS[0].indexOf(p.shape) >= 0, 'شكل ' + p.shape + ' مش من ليفل 1'); assert.ok(p.cells.length <= 4); });
  }
  assert.strictEqual(L.levelFor(0), 1); assert.strictEqual(L.levelFor(3), 2); assert.strictEqual(L.levelFor(8), 3);
  assert.strictEqual(L.levelFor(15), 4); assert.strictEqual(L.levelFor(25), 5);
  var g = game([ONE, ONE, ONE]);
  for (var r = 0; r < 3; r++) for (var c = 1; c < N; c++) g.board[r * N + c] = 2;
  g.board[7 * N + 7] = 3; // عشان اللوح ما يفضاش
  L.place(g, 0, 0, 0); L.place(g, 1, 1, 0);
  var res = L.place(g, 2, 2, 0);
  assert.ok(res.leveledUp); assert.strictEqual(g.level, 2);
});

test('التشجيع والبونس', function () {
  assert.strictEqual(L.praiseFor(1, false).word, 'Nice!');
  assert.strictEqual(L.praiseFor(2, false).bonus, 20);
  assert.strictEqual(L.praiseFor(3, false).word, 'Very good!');
  assert.strictEqual(L.praiseFor(5, false).word, 'Excellent!');
  assert.strictEqual(L.praiseFor(0, false), null);
  var g = game([ONE, ONE, ONE]);
  for (var i = 0; i < N; i++) { g.board[2 * N + i] = 2; g.board[i * N + 5] = 2; }
  g.board[2 * N + 5] = 0; g.board[7 * N + 0] = 4;
  var res = L.place(g, 0, 2, 5);
  assert.strictEqual(res.praise.word, 'Good!');
  assert.strictEqual(res.gained, 1 + 40 + 20);
});

test('الأشكال الجديدة بتظهر من ليفل 5 بس', function () {
  var b = L.emptyBoard(), seen4 = {}, seen5 = {};
  for (var k = 0; k < 600; k++) {
    L.dealTray(b, Math.random, 4).forEach(function (p) { seen4[p.shape] = 1; });
    L.dealTray(b, Math.random, 5).forEach(function (p) { seen5[p.shape] = 1; });
  }
  assert.ok(Object.keys(seen4).every(function (i) { return +i <= 20; }), 'ليفل 4 ما فيهوش الجداد');
  assert.ok(Object.keys(seen5).some(function (i) { return +i > 20; }), 'ليفل 5 فيه الجداد');
  assert.strictEqual(L.SHAPES.length, 34);
});

console.log('\n' + passed + ' نجح · ' + failed + ' فشل');
process.exit(failed ? 1 : 0);
