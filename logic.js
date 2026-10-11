// Root : لفظ المعماري 2026-10-10 «عايز سيشن ابني اللعبه دي بس بمنهج و طريقه عاطف» — والتصميم اعتمده بالأداة 2026-10-10 («موافق، ابنِ»)
// مكعبات رص — المنطق الصافي (بلا DOM). القواعد كلها معلنة في README.md وفي صفحة «إزاي بتشتغل».
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.RassLogic = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var SIZE = 8;
  var COLORS = 6;
  var RESET_AFTER = 3; // الكومبو يرجع صفر بعد 3 قطع ورا بعض من غير مسح

  function line(n, vertical) {
    var cells = [];
    for (var i = 0; i < n; i++) cells.push(vertical ? [i, 0] : [0, i]);
    return cells;
  }
  function square(n) {
    var cells = [];
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) cells.push([r, c]);
    return cells;
  }

  // كل شكل قائمة خلايا [صف، عمود]. لا دوران: كل اتجاه شكل مستقل.
  var SHAPES = [
    [[0, 0]],
    line(2, false), line(2, true),
    line(3, false), line(3, true),
    line(4, false), line(4, true),
    line(5, false), line(5, true),
    square(2), square(3),
    [[0, 0], [1, 0], [1, 1]], [[0, 0], [0, 1], [1, 0]], [[0, 0], [0, 1], [1, 1]], [[0, 1], [1, 0], [1, 1]],
    [[0, 0], [1, 0], [2, 0], [2, 1]], [[0, 1], [1, 1], [2, 1], [2, 0]], [[0, 0], [0, 1], [0, 2], [1, 0]], [[0, 0], [0, 1], [0, 2], [1, 2]],
    [[0, 0], [0, 1], [0, 2], [1, 1]], [[0, 1], [1, 0], [1, 1], [1, 2]]
  ];

  function emptyBoard() {
    var b = [];
    for (var i = 0; i < SIZE * SIZE; i++) b.push(0);
    return b;
  }

  function canPlace(board, cells, r, c) {
    for (var i = 0; i < cells.length; i++) {
      var rr = r + cells[i][0], cc = c + cells[i][1];
      if (rr < 0 || cc < 0 || rr >= SIZE || cc >= SIZE) return false;
      if (board[rr * SIZE + cc]) return false;
    }
    return true;
  }

  function fitsAnywhere(board, cells) {
    for (var r = 0; r < SIZE; r++) for (var c = 0; c < SIZE; c++) if (canPlace(board, cells, r, c)) return true;
    return false;
  }

  function randomPiece(rng) {
    var s = Math.floor(rng() * SHAPES.length);
    return { shape: s, cells: SHAPES[s], color: 1 + Math.floor(rng() * COLORS) };
  }

  // الشرط الوحيد المعلن: قطعة واحدة على الأقل ليها مكان وقت ما تظهر. مفيش تحكّم تاني.
  function dealTray(board, rng) {
    var tray;
    for (var attempt = 0; attempt < 50; attempt++) {
      tray = [randomPiece(rng), randomPiece(rng), randomPiece(rng)];
      for (var i = 0; i < 3; i++) if (fitsAnywhere(board, tray[i].cells)) return tray;
    }
    return tray; // ما لقيناش — الجولة هتخلص طبيعي
  }

  function clone(state) {
    return {
      board: state.board.slice(),
      tray: state.tray.slice(),
      score: state.score,
      combo: state.combo,
      noClear: state.noClear
    };
  }

  function newGame(rng) {
    rng = rng || Math.random;
    var board = emptyBoard();
    return {
      board: board, tray: dealTray(board, rng), score: 0, combo: 0, noClear: 0,
      undoUsed: false, snapshot: null, over: false, rng: rng
    };
  }

  function isOver(state) {
    for (var i = 0; i < state.tray.length; i++) {
      if (state.tray[i] && fitsAnywhere(state.board, state.tray[i].cells)) return false;
    }
    return true;
  }

  // يحط القطعة رقم idx عند (r,c). يرجّع null لو مش قانوني، أو تفاصيل الحركة.
  function place(state, idx, r, c) {
    var piece = state.tray[idx];
    if (state.over || !piece || !canPlace(state.board, piece.cells, r, c)) return null;
    state.snapshot = clone(state);

    var b = state.board, i;
    for (i = 0; i < piece.cells.length; i++) b[(r + piece.cells[i][0]) * SIZE + c + piece.cells[i][1]] = piece.color;
    state.tray[idx] = null;

    var rows = [], cols = [];
    for (var k = 0; k < SIZE; k++) {
      var rowFull = true, colFull = true;
      for (var j = 0; j < SIZE; j++) {
        if (!b[k * SIZE + j]) rowFull = false;
        if (!b[j * SIZE + k]) colFull = false;
      }
      if (rowFull) rows.push(k);
      if (colFull) cols.push(k);
    }
    var clearedCells = {};
    rows.forEach(function (rr) { for (var j = 0; j < SIZE; j++) clearedCells[rr * SIZE + j] = true; });
    cols.forEach(function (cc) { for (var j = 0; j < SIZE; j++) clearedCells[j * SIZE + cc] = true; });
    Object.keys(clearedCells).forEach(function (key) { b[key] = 0; });

    var lines = rows.length + cols.length;
    var gained = piece.cells.length;
    if (lines > 0) {
      state.combo += 1;
      state.noClear = 0;
      gained += 10 * lines * lines * state.combo;
    } else {
      state.noClear += 1;
      if (state.noClear >= RESET_AFTER) state.combo = 0;
    }
    state.score += gained;

    if (!state.tray[0] && !state.tray[1] && !state.tray[2]) state.tray = dealTray(b, state.rng);
    state.over = isOver(state);

    return { lines: lines, rows: rows, cols: cols, cleared: Object.keys(clearedCells).map(Number), gained: gained, combo: state.combo };
  }

  // التراجع مرة واحدة ببلاش في الجولة.
  function undo(state) {
    if (state.undoUsed || !state.snapshot) return false;
    var s = state.snapshot;
    state.board = s.board; state.tray = s.tray; state.score = s.score; state.combo = s.combo; state.noClear = s.noClear;
    state.snapshot = null; state.undoUsed = true; state.over = false;
    return true;
  }

  return {
    SIZE: SIZE, SHAPES: SHAPES, RESET_AFTER: RESET_AFTER,
    emptyBoard: emptyBoard, canPlace: canPlace, fitsAnywhere: fitsAnywhere,
    dealTray: dealTray, newGame: newGame, place: place, undo: undo, isOver: isOver
  };
});
