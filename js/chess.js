// TODO:
// 1. Figure out dragging mechanics for pieces
// 2. Random moves AI
// 3. UI for pawn promotion selection
// 4. Legal moves for piece indicators (with grey circle)

const utility = new JavascriptToolbox();

class State {
  ptm = "White";
  move_history = [];
  orientation = "White";
  delayed_moves = [];

  // [castle_left_avail, castle_right_avail]
  castle_avail = {'White' : [true, true], 'Black' : [true, true]};
  // [castle_ready, king_dest, change_index]
  castle_info = {'Left' : [false, [-1, -1]], 'Right' : [false, [-1, -1]]};

  constructor() {
    this.board = this.init_board();
  }

  checkmate_handler() {
    alert(`Checkmate! Winner is ${this.ptm}.`);
  }

  deep_copy() {
    let copy = new State();
    copy.ptm = this.ptm;
    copy.move_history = JSON.parse(JSON.stringify(this.move_history));
    copy.orientation = this.orientation;
    copy.board = [];
    for(let i = 0; i < this.board.length; i++) {
      let row = [];
      for(let j = 0; j < this.board[0].length; j++) {
        row.push(new Piece(this.board[i][j].type, this.board[i][j].color));
      }
      copy.board.push(row);
    }
    if(this.delayed_moves.length !== 0) {
      copy.delayed_moves = [];
      for(let move in this.delayed_moves) {
        copy.delayed_moves.push([JSON.parse(JSON.stringify(move[0])), new Piece(move[1].type, move[1].color)]);
      }
    }
    copy.castle_avail = JSON.parse(JSON.stringify(this.castle_avail));
    copy.castle_info = JSON.parse(JSON.stringify(this.castle_info));
    return copy;
  }

  init_board() {
    // Create board of empty pieces
    let board_size = [8, 8];
    let board = new Array(board_size[0]).fill(new Piece("Empty", "None")).map(
          () => new Array(board_size[1]).fill(new Piece("Empty", "None")));

    // Piece pattern
    let backline = ["Rook", "Knight", "Bishop", "Queen", "King", "Bishop", "Knight", "Rook"];

    // Place pieces
    board[0] = backline.map((type) => new Piece(type, "Black"));
    board[1] = backline.map((type) => new Piece("Pawn", "Black"));
    board[board_size[1] - 2] = backline.map((type) => new Piece("Pawn", "White"));
    board[board_size[1] - 1] = backline.map((type) => new Piece(type, "White"));

    return board;
  }

  flip_board() {
    this.board.map((row) => row.reverse());
    this.board = this.board.reverse();
    this.orientation = (this.orientation === "White") ? "Black" : "White";
  }

  reset() {
    this.board = this.init_board();
    this.ptm = "White";
    this.move_history = [];
    this.castle_avail = [[true, true], [true, true]];

    if(this.orientation === "Black") {
      this.flip_board();
      this.orientation = (this.orientation === "White") ? "Black" : "White";
    }
  }

  move_piece(coor1, coor2, is_simulation) {
    const piece1 = this.board[coor1[0]][coor1[1]];
    const piece2 = this.board[coor2[0]][coor2[1]];
    const _this = this;
    coor1 = [parseInt(coor1[0]), parseInt(coor1[1])];
    coor2 = [parseInt(coor2[0]), parseInt(coor2[1])];

    function castle_handler() {
      // Castling - Rook
      if(piece1.type === 'Rook') {
        const change_index_side = (coor2[1] === 0) ? 0 : 1;
        _this.castle_avail[piece1.color][change_index_side] = false;
      }
      // Castling - King
      else if(piece1.type === 'King') {
        // Left Castle
        if(_this.castle_info['Left'][0] && utility.arrays_equal(_this.castle_info['Left'][1], coor2)) {
          const king_dest = _this.castle_info['Left'][1];
          const rook = _this.board[king_dest[0]][0];
          _this.board[king_dest[0]][3] = rook;
          _this.board[king_dest[0]][0] = new Piece("Empty", "None");
          _this.castle_info['Left'] = [false, [-1, -1]];
        }
        // Right Castle
        else if(_this.castle_info['Right'][0] && utility.arrays_equal(_this.castle_info['Right'][1], coor2)) {
          const king_dest = _this.castle_info['Right'][1];
          const rook = _this.board[king_dest[0]][_this.board.length - 1];
          _this.board[king_dest[0]][_this.board.length - 3] = rook;
          _this.board[king_dest[0]][_this.board.length - 1] = new Piece("Empty", "None");
          _this.castle_info['Right'] = [false, [-1, -1]];
        }
        const change_index = (piece1.color === "White") ? 0 : 1;
        _this.castle_avail[change_index] = [false, false];
      }
    }

    function endgame_handler() {
      if(!is_simulation) {
        const enemy_ptm = (_this.ptm === 'White') ? 'Black' : 'White';
        const king_info = _this.find_king(_this.ptm);
        // If King is in check or worse...
        if(_this.is_in_danger(king_info[0].color, king_info[1])) {
          // Find all ally pieces...
          for(let y = 0; y < _this.board.length; y++) {
            for(let x = 0; x < _this.board[0].length; x++) {
              const check_piece = _this.board[y][x];
              if(check_piece.color === _this.ptm) {
                const legal_moves = _this.get_legal_moves([y, x], true);
                // Simulate all legal moves...
                for(let move of legal_moves) {
                  if(move !== undefined) {
                    let simulation = _this.deep_copy();
                    simulation.move_piece([y, x], move, true);
                    const sim_king_info = simulation.find_king(_this.ptm);
                    // If a legal move that removes the ally King from check is found...
                    if(!simulation.is_in_danger(sim_king_info[0].color, sim_king_info[1])) {
                      return false;
                    }
                  }
                }
              }
            }
          }
          return true;
        }
      }
    }

    function pawn_promotion_handler() {
      if(!is_simulation && piece1.type === 'Pawn') {
        if(coor2[0] === 0 || coor2[0] === _this.board.length - 1) {
          // TODO: UI for picking piece
          piece1.type = 'Queen';
        }
      }
    }

    if(piece1.color === this.ptm) {
      // Validity check
      const valid_moveset = this.get_legal_moves(coor1, is_simulation);
      if(!valid_moveset.find(ele => utility.arrays_equal(ele, coor2))) return false;

      // Legality check
      if(!is_simulation) if(!this.is_legal_move(coor1, coor2)) return false;

      // Castle info + Rook moving logic
      castle_handler();

      // Pawn promotion logic
      pawn_promotion_handler();

      // En passant helper
      this.delayed_moves.forEach(move => _this.board[move[0][0]][move[0][1]] = move[1]);
      this.delayed_moves = [];

      // Move Handler
      if(piece2.type === "Empty" && piece2.color === "None") {
        this.board[coor2[0]][coor2[1]] = piece1;
        this.board[coor1[0]][coor1[1]] = piece2;
      }
      // Capture Handler
      else {
        this.board[coor2[0]][coor2[1]] = piece1;
        this.board[coor1[0]][coor1[1]] = new Piece("Empty", "None");
      }

      // End of turn logic
      this.ptm = (this.ptm === "White") ? "Black" : "White";
      this.move_history.push([[piece1, coor1], [piece2, coor2]]);

      // Endgame detection & handler
      return endgame_handler();
    }
  }

  // Checks if move is within piece's possible movesets
  // valid_moveset is in format: (y, x)
  get_legal_moves(coor, is_simulation) {
    let piece = this.board[coor[0]][coor[1]];
    let valid_moveset = [];
    const _this = this;
    coor = [parseInt(coor[0]), parseInt(coor[1])]

    function valid_moveset_handler(trans) {
      return function(trans) {
        const trans_coor = utility.array_add(trans, coor);
        if(trans_coor[0] >= 0 && trans_coor[0] < _this.board.length &&
           trans_coor[1] >= 0 && trans_coor[1] < _this.board[0].length &&
           _this.board[trans_coor[0]][trans_coor[1]].color !== piece.color) {
             return trans_coor;
        }
      }
    }

    function en_passant_handler(checking_move) {
      // If first move, skip
      if(_this.move_history.length === 0) return;
      // If the last move was a 2 space pawn advance
      const last_move = _this.move_history[_this.move_history.length - 1];
      if(last_move[0][0].type === "Pawn" && Math.abs(last_move[0][1][0] - last_move[1][1][0]) === 2) {
        // and the desired move is in the correct spot
        const target_y = (_this.orientation === piece.color) ? last_move[1][1][0] - 1 : parseInt(last_move[1][1][0]) + 1;
        if(parseInt(last_move[1][1][1]) === checking_move[1] && target_y === checking_move[0]) {
          if(!is_simulation) _this.delayed_moves.push([[last_move[1][1][0], last_move[1][1][1]], new Piece("Empty", "None")]);
          return checking_move;
        }
      }
    }

    function rook_handler() {
      for(let y1 = coor[0] - 1; y1 >= 0; y1--) {
        const inspect_piece = _this.board[y1][coor[1]];
        if(inspect_piece.type === "Empty" || inspect_piece.color === "None") {
          valid_moveset.push([y1, coor[1]]);
        }
        else if(inspect_piece.type !== "Empty" || inspect_piece.color !== "None") {
          if(inspect_piece.color !== piece.color) {
            valid_moveset.push([y1, coor[1]]);
          }
          break;
        }
      }
      for(let y2 = coor[0] + 1; y2 < _this.board.length; y2++) {
        const inspect_piece = _this.board[y2][coor[1]];
        if(inspect_piece.type === "Empty" || inspect_piece.color === "None") {
          valid_moveset.push([y2, coor[1]]);
        }
        else if(inspect_piece.type !== "Empty" || inspect_piece.color !== "None") {
          if(inspect_piece.color !== piece.color) {
            valid_moveset.push([y2, coor[1]]);
          }
          break;
        }
      }
      for(let x1 = coor[1] - 1; x1 >= 0; x1--) {
        const inspect_piece = _this.board[coor[0]][x1];
        if(inspect_piece.type === "Empty" || inspect_piece.color === "None") {
          valid_moveset.push([coor[0], x1]);
        }
        else if(inspect_piece.type !== "Empty" || inspect_piece.color !== "None") {
          if(inspect_piece.color !== piece.color) {
            valid_moveset.push([coor[0], x1]);
          }
          break;
        }
      }
      for(let x2 = coor[1] + 1; x2 < _this.board[0].length; x2++) {
        const inspect_piece = _this.board[coor[0]][x2];
        if(inspect_piece.type === "Empty" || inspect_piece.color === "None") {
          valid_moveset.push([coor[0], x2]);
        }
        else if(inspect_piece.type !== "Empty" || inspect_piece.color !== "None") {
          if(inspect_piece.color !== piece.color) {
            valid_moveset.push([coor[0], x2]);
          }
          break;
        }
      }
      return valid_moveset;
    }

    function bishop_handler() {
      let valid_moveset = [];
      for(let cy = coor[0] + 1, cx = coor[1] - 1; cy < _this.board.length && cx >= 0; cy++, cx--) {
        const inspect_piece = _this.board[cy][cx];
        if(inspect_piece.type === "Empty" || inspect_piece.color === "None") {
          valid_moveset.push([cy, cx]);
        }
        else if(inspect_piece.type !== "Empty" || inspect_piece.color !== "None") {
          if(inspect_piece.color !== piece.color) {
            valid_moveset.push([cy, cx]);
          }
          break;
        }
      }
      for(let cy = coor[0] - 1, cx = coor[1] + 1; cy >= 0 && cx < _this.board.length; cy--, cx++) {
        const inspect_piece = _this.board[cy][cx];
        if(inspect_piece.type === "Empty" || inspect_piece.color === "None") {
          valid_moveset.push([cy, cx]);
        }
        else if(inspect_piece.type !== "Empty" || inspect_piece.color !== "None") {
          if(inspect_piece.color !== piece.color) {
            valid_moveset.push([cy, cx]);
          }
          break;
        }
      }
      for(let cy = coor[0] + 1, cx = coor[1] + 1; cy < _this.board.length && cx < _this.board.length; cy++, cx++) {
        const inspect_piece = _this.board[cy][cx];
        if(inspect_piece.type === "Empty" || inspect_piece.color === "None") {
          valid_moveset.push([cy, cx]);
        }
        else if(inspect_piece.type !== "Empty" || inspect_piece.color !== "None") {
          if(inspect_piece.color !== piece.color) {
            valid_moveset.push([cy, cx]);
          }
          break;
        }
      }
      for(let cy = coor[0] - 1, cx = coor[1] - 1; cy >= 0 && cx >= 0; cy--, cx--) {
        const inspect_piece = _this.board[cy][cx];
        if(inspect_piece.type === "Empty" || inspect_piece.color === "None") {
          valid_moveset.push([cy, cx]);
        }
        else if(inspect_piece.type !== "Empty" || inspect_piece.color !== "None") {
          if(inspect_piece.color !== piece.color) {
            valid_moveset.push([cy, cx]);
          }
          break;
        }
      }

      return valid_moveset;
    }

    function castle_info_update() {
      let castle_moveset = [[0, -2], [0, 2]];
      let king_dest = undefined, check_piece = undefined, castle_ready = true;
      let return_moveset = [];

      if(_this.castle_avail[piece.color][0]) {
        king_dest = utility.array_add(castle_moveset[0], coor);
        for(let i = coor[1] - 1; i >= 1; i--) {
          check_piece = _this.board[king_dest[0]][i];
          if(check_piece.type !== "Empty" || check_piece.color !== "None" ||
             _this.is_in_danger(piece.color, [king_dest[0], i])) {
               castle_ready = false;
               break;
          }
        }
        _this.castle_info['Left'] = [castle_ready, king_dest];
        if(castle_ready) return_moveset.push(king_dest);
      }
      king_dest = undefined, check_piece = undefined, castle_ready = true;
      if(_this.castle_avail[piece.color][1]) {
        king_dest = utility.array_add(castle_moveset[1], coor);
        for(let i = coor[1] + 1; i <= _this.board.length - 2; i++) {
          check_piece = _this.board[king_dest[0]][i];
          if(check_piece.type !== "Empty" || check_piece.color !== "None" ||
             _this.is_in_danger(piece.color, [king_dest[0], i])) {
               castle_ready = false;
               break;
          }
        }
        _this.castle_info['Right'] = [castle_ready, king_dest];
        if(castle_ready) return_moveset.push(king_dest);
      }
      return return_moveset;
    }

    switch(piece.type) {
      case 'Pawn':
        valid_moveset = [[1, 0], [2, 0], [1, 1], [1, -1]];
        if(this.orientation === piece.color) {
          valid_moveset = valid_moveset.map(trans => trans.map(x => x * -1));
        }
        valid_moveset = valid_moveset.map(valid_moveset_handler(valid_moveset));
        let return_moveset = [];

        // Normal move handlers
        if(valid_moveset[0] !== undefined) {
          const target_piece = this.board[valid_moveset[0][0]][valid_moveset[0][1]];
          if(target_piece.type === "Empty" && target_piece.color === "None") {
            return_moveset.push(valid_moveset[0]);
          }
        }
        if(valid_moveset[0] !== undefined && valid_moveset[1] !== undefined) {
          const blocking_piece = this.board[valid_moveset[0][0]][valid_moveset[0][1]];
          const target_piece = this.board[valid_moveset[1][0]][valid_moveset[1][1]];
          if(blocking_piece.type === "Empty" && blocking_piece.color === "None" &&
             target_piece.type === "Empty" && target_piece.color === "None") {
            return_moveset.push(valid_moveset[1]);
          }
        }

        // Capture & En passant logic
        if(valid_moveset[2] !== undefined) {
          return_moveset.push(en_passant_handler(valid_moveset[2]));
          const target_piece = this.board[valid_moveset[2][0]][valid_moveset[2][1]];
          if(target_piece.type !== "Empty" && target_piece.color !== "None") {
            return_moveset.push(valid_moveset[2]);
          }
        }
        if(valid_moveset[3] !== undefined) {
          return_moveset.push(en_passant_handler(valid_moveset[3]));
          const target_piece = this.board[valid_moveset[3][0]][valid_moveset[3][1]];
          if(target_piece.type !== "Empty" && target_piece.color !== "None") {
            return_moveset.push(valid_moveset[3]);
          }
        }

        return return_moveset;
        break;
      case 'Rook':
        return rook_handler();
        break;
      case 'Knight':
        valid_moveset = [[2, -1], [2, 1], [1, 2], [1, -2], [-1, 2], [-1, -2], [-2, -1], [-2, 1]];
        return valid_moveset.map(valid_moveset_handler(valid_moveset));
        break;
      case 'Bishop':
      return bishop_handler();
        break;
      case 'King':
        valid_moveset = [[ 1, -1], [ 1, 0], [ 1,  1],
                         [ 0, -1],          [ 0,  1],
                         [-1, -1], [-1, 0], [-1,  1]];
        valid_moveset = valid_moveset.map(valid_moveset_handler(valid_moveset));
        if(!is_simulation) valid_moveset = valid_moveset.concat(castle_info_update());
        return valid_moveset;
        break;
      case 'Queen':
        return bishop_handler().concat(rook_handler());
        break;
    }
    console.log("ERROR: Invalid piece type.");
  }

  // Returns true if piece is in danger
  is_in_danger(color, coor) {
    for(let y = 0; y < this.board.length; y++) {
      for(let x = 0; x < this.board[0].length; x++) {
        const check_piece = this.board[y][x];
        if(check_piece.type !== "Empty" && check_piece.color !== color) {
          if(this.get_legal_moves([y, x], true).find(loc => utility.arrays_equal(loc, coor))) {
            return true;
          }
        }
      }
    }
    return false;
  }

  // Returns king piece object, coordinates
  find_king(color) {
    for(let y = 0; y < this.board.length; y++) {
      for(let x = 0; x < this.board[0].length; x++) {
        const check_piece = this.board[y][x];
        if(check_piece.type === "King" && check_piece.color === color) {
          return [check_piece, [y, x]];
        }
      }
    }
  }

  // Simulates a turn and checks if move puts king in dange
  is_legal_move(coor1, coor2) {
    let simulation = this.deep_copy();
    simulation.move_piece(coor1, coor2, true);

    const king_info = simulation.find_king(this.ptm);
    return !simulation.is_in_danger(king_info[0].color, king_info[1]);
  }
}

// type of piece, color, number of points, etc.
class Piece {
  constructor(type, color) {
    this.type = type;
    this.color = color;
  }
}

class UIHandler {
  constructor(state, board_dims, dark_color, light_color) {
    this.board_div = document.getElementById('board');
    this.state = state;
    this.board_dims = board_dims;
    this.dark_color = dark_color;
    this.light_color = light_color;
    this.square_size = this.calc_square_size();
    this.highlighted_square = [null, ""];
    this.history = [this.state.deep_copy()];
    this.turn_num = 0;

    this.draw_board();
    this.draw_pieces();
  }

  reset() {
    // Reset the UI Handler
    this.highlighted_square = [null, ""];
    this.history = this.history.splice(0, 1);
    this.turn_num = 1;

    // Reset the state
    this.state.reset();

    // Erase the board
    const board = document.getElementById('board');
    while (board.firstChild) { board.firstChild.remove(); }

    // Redraw everything
    this.draw_board();
    this.draw_pieces();
  }

  undo() {
    if(this.turn_num > 0) {
      this.state = this.history[this.turn_num - 1].deep_copy();
      this.turn_num -= 1;
      this.draw_pieces();
    }
  }

  calc_square_size() {
    let boundary = (window.innerWidth > window.innerHeight) ? window.innerHeight : window.innerWidth;
    boundary *= 0.75;
    let largest_dim = (this.board_dims[0] > this.board_dims[1]) ? this.board_dims[0] : this.board_dims[1];

    this.board_div.style.width = boundary + "px";
    this.board_div.style.height = boundary + "px";

    return boundary / largest_dim;
  }

  draw_board() {
    for(let y = 0; y < this.board_dims[0]; y++) {
      const row = document.createElement("div");
      row.className = "chess-row";

      for(let x = 0; x < this.board_dims[1]; x++) {
        const square = document.createElement("div");
        square.className = ((x + y) % 2 === 0) ? "lightSquare" : "darkSquare";
        square.id = y + "," + x;
        square.style.width = this.square_size + "px";
        square.style.height = this.square_size + "px";

        // Move handler
        let _this = this;
        square.addEventListener('click',
          function() {
            if(_this.highlighted_square[0] !== null) {
              // Move piece
              const coor1 = _this.highlighted_square[0].id.split(",");
              const coor2 = this.id.split(",");
              const checkmate = _this.state.move_piece(coor1, coor2, false);

              // Move history logic
              if(_this.history.length > _this.turn_num + 1) {
                _this.history = _this.history.splice(0, _this.turn_num + 1);
              }
              _this.history.push(_this.state.deep_copy());
              _this.turn_num += 1;

              _this.draw_pieces();

              // This is triggering before state update. Figre out why?
              if(checkmate) _this.state.checkmate_handler();

              // Unhighlight square
              _this.highlighted_square[0].className = _this.highlighted_square[1];

              // Reset
              _this.highlighted_square = [null, ""];
            } else if(this.children.length > 0) {
              // Store highlighted square information
              _this.highlighted_square = [this, this.className];
              this.className = "highlightedSquare";
            }
          },
        false);

        row.appendChild(square);
      }
      this.board_div.appendChild(row);
    }
  }

  clear_board() {
    for(let x = 0; x < this.board_dims[0]; x++) {
      for(let y = 0; y < this.board_dims[1]; y++) {
        const square = this.board_div.children[x].children[y];
        if(square.lastChild !== null) {
          square.removeChild(square.lastChild);
        }
      }
    }
  }

  draw_pieces() {
    this.clear_board();
    for(let y = 0; y < this.board_dims[0]; y++) {
      for(let x = 0; x < this.board_dims[1]; x++) {
        const piece = document.createElement("img");
        piece.className = "chess-piece";
        piece.style.width = this.square_size + "px";
        piece.style.height = this.square_size + "px";

        const piece_object = this.state.board[y][x];
        if(piece_object.type === "Empty" || piece_object.color === "None") {
          continue;
        }
        piece.src = "Resources/Pieces/" + piece_object.color + "_" + piece_object.type + ".png";

        // Temporary
        piece.setAttribute('draggable', false);

        this.board_div.children[y].children[x].appendChild(piece);
      }
    }
  }
}

function main() {
  let state = new State();
  let drawer = new UIHandler(state, [8, 8], "#8b6914", "#deb887");

  // Switch Sides handler
  document.getElementById('switch').addEventListener('click', function() {
    if(drawer.highlighted_square[0] === null) {
      drawer.state.flip_board(); drawer.draw_pieces();
    } else {
      alert('Cannot switch sides mid-move!');
    }
  }, false);
  document.getElementById('reset').addEventListener('click', function() { drawer.reset(); }, false);
  document.getElementById('undo').addEventListener('click', function() { drawer.undo(); }, false);
}
