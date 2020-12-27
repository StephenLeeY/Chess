// TODO:
// 1. Bug - Promoted piece is highlighted. Likely because of multiple event listeners? Maybe not?

class AI {
  constructor(game, player) {
    this.game = game;
    this.player = player;
    this.utility = new JavascriptToolbox();

    this.piece_values = {'Pawn' : 1, 'Rook' : 5, 'Bishop' : 3, 'Knight' : 3, 'Queen' : 9, 'King' : 0};
  }

  evaluate_state(state) {
    let score = 0;
    for(let y = 0; y < state.board.length; y++) {
      for(let x = 0; x < state.board[0].length; x++) {
        const piece = state.board[y][x];
        if(piece.color !== 'None') {
          const piece_multiplier = (piece.color !== this.player) ? -1 : 1;
          score += piece_multiplier * this.piece_values[piece.type];
        }
      }
    }
    return score;
  }

  greedy_bot(state) {
    const legal_moves = state.ai_branch(state);
    const base_value = this.evaluate_state(this.game);

    if(legal_moves.length !== 0) {
      let best_value = Number.NEGATIVE_INFINITY;
      let best_move = null;

      for(let move of legal_moves) {
        const next_state = this.game.simulate_move(move[0], move[1]);
        const curr_value = this.evaluate_state(next_state);
        if(curr_value > best_value) {
          best_value = curr_value;
          best_move = move;
        }
      }

      if(base_value === best_value) return legal_moves[Math.floor(Math.random() * legal_moves.length)];
      return best_move;
    } else {
      return 'No valid moves';
    }
  }

  async make_move() {
    if(this.game.ptm === this.player) {
      // await this.utility.sleep(1000);
      return this.greedy_bot(this.game);
    } else {
      throw new Error('AI asked to make move on opponent\'s turn.');
    }
  }
}

class State {
  ptm = "White";
  move_history = [];
  orientation = "White";
  delayed_moves = [];
  castle_avail = {'White' : [true, true], 'Black' : [true, true]};
  castle_info = {'Left' : [false, [-1, -1]], 'Right' : [false, [-1, -1]]};

  constructor() {
    this.board = this.init_board();
    this.utility = new JavascriptToolbox();
  }

  simulate_move(coor1, coor2) {
    if(coor1 !== undefined && coor2 !== undefined) {
      let simulation = this.deep_copy();
      if(simulation.move_piece(coor1, coor2) !== false) {
        return simulation;
      } else {
        return 'Bad Move';
      }
    }
  }

  // Return set of valid states and their respective actions
  ai_branch(state) {
    let valid_moves = [];
    for(let y = 0; y < state.board.length; y++) {
      for(let x = 0; x < state.board[0].length; x++) {
        const piece = state.board[y][x];
        if(piece.type !== 'Empty' && piece.color === state.ptm) {
          const legal_moves = state.get_legal_moves([y, x]);
          for(let move of legal_moves) {
            if(move !== undefined) {
              const simulation_code = this.simulate_move([y, x], move);
              if(simulation_code !== 'Bad Move') valid_moves.push([[y, x], move]);
            }
          }
        }
      }
    }
    return valid_moves;
  }

  checkmate_handler() {
    alert(`Checkmate! Winner is ${(this.ptm === 'White') ? 'Black' : 'White'}.`);
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
      for(let move of this.delayed_moves) {
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

    let board_len = this.board.length - 1;
    function flip_coor(coor) {
      return [board_len - coor[0], board_len - coor[1]];
    }

    for(let i = 0; i < this.move_history.length; i++) {
      this.move_history[i][0][1] = flip_coor(this.move_history[i][0][1]);
      this.move_history[i][1][1] = flip_coor(this.move_history[i][1][1]);
    }
  }

  reset() {
    this.board = this.init_board();
    this.ptm = "White";
    this.move_history = [];
    this.delayed_moves = [];
    this.castle_avail = {'White' : [true, true], 'Black' : [true, true]};
    this.castle_info = {'Left' : [false, [-1, -1]], 'Right' : [false, [-1, -1]]};

    if(this.orientation === "Black") {
      this.flip_board();
      this.orientation = (this.orientation === "White") ? "Black" : "White";
    }
  }

  freq_move_history(piece) {
    let counter = 0;
    for(let move of this.move_history) {
      if(move[0][0] === piece) {
        counter++;
      }
    }
    return counter;
  }

  move_piece(coor1, coor2, is_simulation=false, ignore_pawn_promotion=false) {
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
        if(_this.castle_info['Left'][0] && _this.utility.arrays_equal(_this.castle_info['Left'][1], coor2)) {
          const king_dest = _this.castle_info['Left'][1];
          const rook = _this.board[king_dest[0]][0];
          _this.board[king_dest[0]][3] = rook;
          _this.board[king_dest[0]][0] = new Piece("Empty", "None");
          _this.castle_info['Left'] = [false, [-1, -1]];
        }
        // Right Castle
        else if(_this.castle_info['Right'][0] && _this.utility.arrays_equal(_this.castle_info['Right'][1], coor2)) {
          const king_dest = _this.castle_info['Right'][1];
          const rook = _this.board[king_dest[0]][_this.board.length - 1];
          _this.board[king_dest[0]][_this.board.length - 3] = rook;
          _this.board[king_dest[0]][_this.board.length - 1] = new Piece("Empty", "None");
          _this.castle_info['Right'] = [false, [-1, -1]];
        }
        _this.castle_avail[piece1.color] = [false, false];
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
                      return;
                    }
                  }
                }
              }
            }
          }
          return 'Checkmate';
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
      if(!valid_moveset.find(ele => this.utility.arrays_equal(ele, coor2))) return false;

      // Legality check
      if(!is_simulation) if(!this.is_legal_move(coor1, coor2)) return false;

      // Pawn promotion logic
      if(!is_simulation && piece1.type === 'Pawn' && !ignore_pawn_promotion) {
        if(coor2[0] === 0 || coor2[0] === _this.board.length - 1) {
          return "Promotion";
        }
      }

      // Castle info + Rook moving logic
      castle_handler();

      // En passant helper
      if(this.delayed_moves.length !== 0) {
        const delete_piece = this.board[coor1[0]][coor1[1] + coor2[1] - coor1[1]];
        if(piece1.type === 'Pawn' && piece2.type === 'Empty' &&
           delete_piece.type === 'Pawn' && delete_piece.color !== piece1.color) {
          this.delayed_moves.forEach(move => _this.board[move[0][0]][move[0][1]] = move[1]);
          this.delayed_moves = [];
        }
      }

      if(!is_simulation && piece2 === undefined) console.log(coor2);
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
      this.delayed_moves = [];

      // Endgame detection & handler
      return endgame_handler();
    }
  }

  // Checks if move is within piece's possible movesets
  // valid_moveset is in format: (y, x)
  get_legal_moves(coor, is_simulation=false) {
    let piece = this.board[coor[0]][coor[1]];
    let valid_moveset = [];
    const _this = this;
    coor = [parseInt(coor[0]), parseInt(coor[1])]

    function valid_moveset_handler(trans) {
      return function(trans) {
        const trans_coor = _this.utility.array_add(trans, coor);
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
        king_dest = _this.utility.array_add(castle_moveset[0], coor);
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
        king_dest = _this.utility.array_add(castle_moveset[1], coor);
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
            if(this.freq_move_history(piece) === 0) return_moveset.push(valid_moveset[1]);
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
          if(this.get_legal_moves([y, x], true).find(loc => this.utility.arrays_equal(loc, coor))) {
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

  deep_copy() {
    let copy = new Piece();
    copy.type = this.type;
    copy.color = this.color;
    return copy;
  }
}

class UIHandler {
  constructor(state, ai) {
    const _this = this;

    function calc_square_size() {
      let boundary = (window.innerWidth > window.innerHeight) ? window.innerHeight : window.innerWidth;
      boundary *= 0.75;
      let largest_dim = (_this.board_dims[0] > _this.board_dims[1]) ? _this.board_dims[0] : _this.board_dims[1];

      _this.board_div.style.width = boundary + "px";
      _this.board_div.style.height = boundary + "px";

      return boundary / largest_dim;
    }

    this.board_div = document.getElementById('board');
    this.output_div = document.getElementById('output');
    this.state = state;
    this.board_dims = [state.board.length, state.board[0].length];
    this.dark_color = "#8b6914";
    this.light_color = "#deb887";
    this.square_size = calc_square_size();
    this.highlighted_square = [null, ""];
    this.indicated_squares = [];
    this.history = [this.state.deep_copy()];
    this.turn_num = 0;
    this.ai = ai;

    this.draw_board();
    this.draw_pieces();
    this.draw_display();

    // Switch Sides handler
    document.getElementById('switch').addEventListener('click', function() {
      if(_this.highlighted_square[0] === null) {
        _this.state.flip_board(); _this.draw_pieces();
      } else {
        alert('Cannot switch sides mid-move!');
        _this.unhighlight();
      }
    }, false);
    document.getElementById('reset').addEventListener('click', function() { _this.reset(); }, false);
    document.getElementById('undo').addEventListener('click', function() { _this.undo(); _this.unhighlight(); }, false);
  }

  reset() {
    // Reset the UI Handler
    this.highlighted_square = [null, ""];
    this.indicated_squares = [];
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

  unhighlight() {
    // Reset highlighted square
    this.highlighted_square = [null, ""];

    // Erase the board
    const board = document.getElementById('board');
    while (board.firstChild) { board.firstChild.remove(); }

    // Redraw everything
    this.draw_board();
    this.draw_pieces();
  }

  create_indicator() {
    let circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.appendChild(circle);
    return svg;
  }

  // Remove click event handlers for everything except the promotion UI
  // TODO: If possible, find a better method of doing this.
  disable_board() {
    for(let y = 0; y < this.board_dims[0]; y++) {
      for(let x = 0; x < this.board_dims[1]; x++) {
        const square = this.board_div.children[y].children[x];
        const square_clone = square.cloneNode(true);
        square.parentNode.replaceChild(square_clone, square);
      }
    }
  }

  // Add click event handlers to everything again.
  enable_board() {
    const _this = this;
    for(let y = 0; y < this.board_dims[0]; y++) {
      for(let x = 0; x < this.board_dims[1]; x++) {
        const square = this.board_div.children[y].children[x];
        square.addEventListener('click', async function() {
          if(_this.move_click_handler(square) === 'Finished') {
            const move = await _this.ai.make_move();
            if(move !== 'No valid moves') {
              _this.move_click_handler(_this.board_div.children[move[0][0]].children[move[0][1]]);
              _this.move_click_handler(_this.board_div.children[move[1][0]].children[move[1][1]]);
            }
          }
        }, false);
      }
    }
  }

  promotion_handler(coor1, coor2, move_history_len) {
    // Dereference all board squares and update 'square' variable reference
    this.disable_board();
    let square = this.board_div.children[coor2[0]].children[coor2[1]];

    // Save and remove piece on promotion square
    const previous_piece = this.state.board[coor2[0]][coor2[1]].deep_copy();
    square.removeChild(square.lastChild);

    const piece_color = this.state.ptm;
    const promotion_selection = ['Queen', 'Rook', 'Bishop', 'Knight'];

    // Create promotion UI
    let promotion_ui = document.createElement('div');
    promotion_ui.className = 'promotionUI';
    promotion_ui.id = 'promotionUI';
    promotion_ui.width = this.square_size + "px";
    promotion_ui.height = this.square_size * 4 + "px";
    promotion_ui.border = '0.1 px solid black';
    if(piece_color !== this.state.orientation) {
      promotion_ui.style.position = 'relative';
      promotion_ui.style.top = this.square_size * -3 + "px";
    }

    // Display promotion UI
    for(let piece_name of promotion_selection) {
      let promotion_square = document.createElement('div');
      promotion_square.className = 'promotionSquare';
      promotion_square.width = this.square_size + "px";
      promotion_square.height = this.square_size + "px";

      const _this = this;
      promotion_square.addEventListener('click',
        async function() {
          // Update pieces
          const promote_piece_info = promotion_square.firstChild.id.split(",");
          const target_spot = square.id.split(",");

          // Setup board to make promotion a valid move
          const previous_pawn = _this.state.board[coor1[0]][coor1[1]].deep_copy();
          _this.state.board[target_spot[0]][target_spot[1]] = previous_piece;
          _this.state.board[coor1[0]][coor1[1]] = new Piece(promote_piece_info[1], promote_piece_info[0]);

          // Make move
          const code = _this.state.move_piece(coor1, target_spot, false, true);

          // Promotion was invalid
          if(code === false) {
            _this.state.board[target_spot[0]][target_spot[1]] = previous_piece;
            _this.state.board[coor1[0]][coor1[1]] = previous_pawn;
          }

          // Move history logic
          if(code !== false) {
            // Move history logic
            if(_this.history.length > _this.turn_num + 1) {
              _this.history = _this.history.splice(0, _this.turn_num + 1);
            }
            _this.history.push(_this.state.deep_copy());
            _this.turn_num += 1;

            _this.draw_pieces();
            if(code === 'Checkmate') _this.state.checkmate_handler();
          }

          if(move_history_len + 1 === _this.state.move_history.length) {
            const piece = _this.state.board[coor2[0]][coor2[1]];
            _this.output_div.innerText += `\
            [${_this.state.move_history.length}]\
            ${piece.color} ${piece.type} to\
            ${String.fromCharCode(parseInt(coor2[1]) + 65)}` +
            `${parseInt(8 - coor2[0])}\n`;
          }

          // Fix board
          _this.enable_board();
          square.style.zIndex = undefined;

          const move = await _this.ai.make_move();
          if(move !== 'No valid moves') {
            _this.move_click_handler(_this.board_div.children[move[0][0]].children[move[0][1]]);
            _this.move_click_handler(_this.board_div.children[move[1][0]].children[move[1][1]]);
          }
        });

      let promotion_piece = document.createElement("img");
      promotion_piece.className = "promotion-piece";
      promotion_piece.style.width = this.square_size + "px";
      promotion_piece.style.height = this.square_size + "px";

      const piece_object = this.state.board[coor1[0]][coor1[1]];
      promotion_piece.src = "Resources/Pieces/" + piece_color + "_" + piece_name + ".png";
      promotion_piece.id = piece_color + "," + piece_name;

      promotion_square.appendChild(promotion_piece);
      if(piece_color === this.state.orientation) {
        promotion_ui.appendChild(promotion_square);
      } else {
        promotion_ui.insertBefore(promotion_square, promotion_ui.firstChild);
      }
    }
    square.style.zIndex = '1';
    square.appendChild(promotion_ui);

    // Unhighlight square
    const highlight_coor = this.highlighted_square[0].id.split(',');
    const highlighted_square = this.board_div.children[highlight_coor[0]].children[highlight_coor[1]];
    highlighted_square.className = this.highlighted_square[1];
    this.highlighted_square = [null, ""];

    return 'Promoted';
  }

  move_click_handler(square) {
    if(this.highlighted_square[0] !== null) {
      // Move piece
      const coor1 = this.highlighted_square[0].id.split(",");
      const coor2 = square.id.split(",");
      const move_history_len = this.state.move_history.length;
      const code = this.state.move_piece(coor1, coor2, false);

      // Pawn promotion logic
      if(code === 'Promotion') {
        return this.promotion_handler(coor1, coor2, move_history_len);
      }

      // Move history logic
      if(this.history.length > this.turn_num + 1) {
        this.history = this.history.splice(0, this.turn_num + 1);
      }
      this.history.push(this.state.deep_copy());
      this.turn_num += 1;

      this.draw_pieces();

      // This is triggering before state update. Figre out why?
      if(code === 'Checkmate') this.state.checkmate_handler();

      // Unhighlight square
      this.highlighted_square[0].className = this.highlighted_square[1];

      // Reset
      this.highlighted_square = [null, ""];
      this.indicated_squares = [];

      if(move_history_len + 1 === this.state.move_history.length) {
        const piece = this.state.board[coor2[0]][coor2[1]];
        this.output_div.innerText += `\
        [${this.state.move_history.length}]\
        ${piece.color} ${piece.type} to\
        ${String.fromCharCode(parseInt(coor2[1]) + 65)}` +
        `${parseInt(8 - coor2[0])}\n`;

        return 'Finished';
      }
    } else if(square.children.length > 0) {
      // Store highlighted square information
      this.highlighted_square = [square, square.className];
      square.className = "highlightedSquare";

      // Show legal moves
      const square_coor = square.id.split(',');
      const legal_moves = this.state.get_legal_moves([square_coor[0], square_coor[1]], true);
      for(let move of legal_moves) {
        if(move !== undefined && this.state.board[move[0]][move[1]].type === 'Empty') {
          this.indicated_squares.push(move);
          this.board_div.children[move[0]].children[move[1]].appendChild(this.create_indicator());
        }
      }
      return 'Selected';
    }
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

        const _this = this;
        square.addEventListener('click', async function() {
          if(_this.move_click_handler(square) === 'Finished') {
            const move = await _this.ai.make_move();
            if(move !== 'No valid moves') {
              _this.move_click_handler(_this.board_div.children[move[0][0]].children[move[0][1]]);
              _this.move_click_handler(_this.board_div.children[move[1][0]].children[move[1][1]]);
            }
          }
        }, false);

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

  draw_display() {
    const game_display_div = document.getElementById('game-display')
    const info_display_div = document.getElementById('info-display');
    info_display_div.style.height = game_display_div.offsetHeight + 'px';
    info_display_div.style.width = (window.innerWidth - game_display_div.offsetWidth) / 2 + 'px';

    this.output_div.style.height = this.board_div.offsetHeight;
  }
}

let state = undefined;
let ai = undefined;
let drawer = undefined;

function main() {
  state = new State();
  ai = new AI(state, (state.orientation === 'White') ? 'Black' : 'White');
  drawer = new UIHandler(state, ai);
}
