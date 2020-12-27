// TODO:
// 1. Bug - Promoted piece is highlighted. Hacky fix, figure out real reason later?
// 2. Add AI behavior for pawn promotion events.

class AI {
  constructor(game, player) {
    this.game = game;
    this.player = player;
    this.utility = new JavascriptToolbox();

    this.piece_values = {'Pawn' : 1, 'Rook' : 5, 'Bishop' : 3, 'Knight' : 3, 'Queen' : 9, 'King' : 0};
  }

  simulate_move(state, coor1, coor2) {
    let simulation = state.deep_copy();
    const simulation_code = simulation.move_piece(coor1, coor2);
    if(simulation_code !== 'Bad' && simulation_code !== 'Checkmate') {
      return simulation;
    } else {
      return 'Bad Simulation';
    }
  }

  // Return set of valid states and their respective actions
  ai_branch(state) {
    let valid_moves = [];
    for(let y = 0; y < state.board.length; y++) {
      for(let x = 0; x < state.board[0].length; x++) {
        const piece = state.board[y][x];
        if(!piece.is_empty() && piece.color === state.ptm) {
          const legal_moves = state.get_valid_moves([y, x]);
          for(let move of legal_moves) {
            const next_state = this.simulate_move(state, [y, x], move);
            if(next_state !== 'Bad Simulation') valid_moves.push([[y, x], move]);
          }
        }
      }
    }
    return valid_moves;
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
    const legal_moves = this.ai_branch(state);
    const base_value = this.evaluate_state(this.game);

    if(legal_moves.length !== 0) {
      let best_value = Number.NEGATIVE_INFINITY;
      let best_move = null;

      for(let move of legal_moves) {
        const next_state = this.simulate_move(state, move[0], move[1]);
        const curr_value = this.evaluate_state(next_state);
        if(curr_value > best_value) {
          best_value = curr_value;
          best_move = move;
        }
      }

      if(base_value === best_value) {
        return [legal_moves[Math.floor(Math.random() * legal_moves.length)], best_value];
      } else {
        return [best_move, best_value];
      }
    } else {
      return [null, (state.ptm === this.player) ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY];
    }
  }

  branch_out(branches, depth) {
    if(depth > 0) {
      let next_branches = [];
      for(let node of branches) {
        const state = node[0];
        let path = node[1];
        const legal_moves = this.ai_branch(state);

        for(let move of legal_moves) {
          const next_state = this.simulate_move(state, move[0], move[1]);
          next_branches.push([next_state, path.concat([[move]])]);
        }
      }
      return this.branch_out(next_branches, depth - 1);
    } else if(branches.length === 1) {
      const legal_moves = this.ai_branch(state);
      return legal_moves[Math.floor(Math.random() * legal_moves.length)];
    } else {
      let best_value = Number.NEGATIVE_INFINITY;
      let best_move = null;
      for(let node of branches) {
        const state = node[0];
        let path = node[1];
        const ai_result = this.greedy_bot(state);
        if(ai_result[1] > best_value) {
          best_value = ai_result[1];
          best_move = path[0];
        }
      }
      return best_move[0];
    }
  }

  async make_move() {
    if(this.game.ptm === this.player) {
      const result = this.branch_out([[this.game, []]], 1);
      return result;
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

  /**
   * Represents the chess board and all relevant information.
   *
   * @param {String}     ptm - Player to move. Ex: 'White', 'Black'.
   * @param {Array}      move_history - History of moves in format
                         [[piece1, coor1], [piece2, coor2]].
   * @param {String}     orientation - Orientation of board.
                         Ex: 'White', 'Black'.
   * @param {Array}      delayed_moves - En passant moves to make in format
                         [Target coordinate, Piece to put at target].
   * @param {Dictionary} castle_avail - Availability of castling in format
                         [Left Castle Availability, Right Castle Availability].
   * @param {Dictionary} castle_info - Castling information for making moves in
                         format [Castle Availability, [Left, Right]].
   */
  constructor() {
    this.board = this.init_board();
    this.utility = new JavascriptToolbox();
  }

  /* --------------------------- HELPER FUNCTIONS --------------------------- */
  /**
   * Gets a piece at a coordinate from board.
   *
   * @param {Array} coor - 2 element array for target coordinate in format
                    [y, x].
   *
   * @return {Piece} Piece at target coordinate in board.
   */
  get_piece(coor) {
    return this.board[coor[0]][coor[1]];
  }

  /**
   * Finds the coordinates of a piece from board.
   *
   * @param {Piece} piece - Piece to find from board.
   *
   * @return {Array} 2 element array of piece on board in format [y, x].
   */
  find_piece(piece) {
    for(let y = 0; y < this.board.length; y++) {
      for(let x = 0; x < this.board[0].length; x++) {
        if(this.board[y][x] === piece) {
          return [y, x];
        }
      }
    }
  }

  /**
   * Returns opponent player's color.
   *
   * @return {String} Opposing player's color.
   */
  enemy_color() {
    return (this.ptm === 'White') ? 'Black' : 'White';
  }

  /* ------------------------------------------------------------------------ */

  // TODO: Checkmate handler.
  checkmate_handler() {
    alert(`Checkmate! Winner is ${(this.ptm === 'White') ? 'Black' : 'White'}.`);
  }

  /**
   * Dereferences and passes information to copy of object.
   *
   * @return {State} Deep copy of object.
   */
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

  /**
   * Initializes board with empty and non-empty pieces.
   *
   * @return {Array} Board of size 8 x 8 filled with pieces.
   */
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

  /**
   * Rotates board 180 degrees and updates fields accordingly.
   */
  flip_board() {
    // Rotate 180 degrees
    this.board.map((row) => row.reverse());
    this.board = this.board.reverse();

    // Updates orientation
    this.orientation = (this.orientation === "White") ? "Black" : "White";

    // Updates coordinate for 180 degree flip.
    let board_len = this.board.length - 1;
    function flip_coor(coor) {
      return [board_len - coor[0], board_len - coor[1]];
    }

    // Updates move history
    for(let i = 0; i < this.move_history.length; i++) {
      this.move_history[i][0][1] = flip_coor(this.move_history[i][0][1]);
      this.move_history[i][1][1] = flip_coor(this.move_history[i][1][1]);
    }
  }

  /**
   * Completely reset board to original state. Does not change orientation.
   */
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

  /**
   * Calculates how many times a specific piece has been moved in move history.
   *
   * @param  {Piece}  piece - Piece to look for in move history.
   *
   * @return {Number} Number of times piece has been detcted in move_history.
   */
  freq_move_history(piece) {
    let counter = 0;
    for(let move of this.move_history) {
      if(move[0][0] === piece) {
        counter++;
      }
    }
    return counter;
  }

  /**
   * Moves piece from coor1 to coor2 and updates board accordingly.
   *
   * @param {Array}   coor1 - 2 element array for the start coordinate in format
                      [y, x].
   * @param {Array}   coor2 - 2 element array for the end coordinate in format
                      [y, x].
   * @param {Boolean} is_simulation - Whether move is being simulated or not.
                      If so, move_piece will skip checking for legality of move.
   * @param {Boolean} ignore_pawn_promotion - Whether a pawn promotion is
                      occurring or not. If it is, stop updating board and return
                      early with 'Promotion' code.
   *
   * @return {String} Code for move_piece result.
                      Types:
                        'Good' - Valid Move.
                        'Bad' - Invalid Move.
                        'Checkmate' - Checkmate Detected.
                        'Promotion' - Pawn Promotion Detected.
   */
  move_piece(coor1, coor2, is_simulation=false, ignore_pawn_promotion=false) {
    const _this = this;
    const piece1 = this.get_piece(coor1);
    const piece2 = this.get_piece(coor2);
    coor1 = [parseInt(coor1[0]), parseInt(coor1[1])];
    coor2 = [parseInt(coor2[0]), parseInt(coor2[1])];

    /**
     * Handles secondary piece movements in castling and handles castle_avail
     * and castle_info updates.
     */
    function castle_handler() {
      // Castling - Rook.
      if(piece1.type === 'Rook') {
        const change_index_side = (coor2[1] === 0) ? 0 : 1;
        _this.castle_avail[piece1.color][change_index_side] = false;
      }
      // Castling - King.
      else if(piece1.type === 'King') {
        // Left Castle.
        if(_this.castle_info['Left'][0] && _this.utility.arrays_equal(_this.castle_info['Left'][1], coor2)) {
          const king_dest = _this.castle_info['Left'][1];
          const rook = _this.board[king_dest[0]][0];
          _this.board[king_dest[0]][3] = rook;
          _this.board[king_dest[0]][0] = new Piece("Empty", "None");
          _this.castle_info['Left'] = [false, [-1, -1]];
        }
        // Right Castle.
        else if(_this.castle_info['Right'][0] && _this.utility.arrays_equal(_this.castle_info['Right'][1], coor2)) {
          const king_dest = _this.castle_info['Right'][1];
          const rook = _this.board[king_dest[0]][_this.board.length - 1];
          _this.board[king_dest[0]][_this.board.length - 3] = rook;
          _this.board[king_dest[0]][_this.board.length - 1] = new Piece("Empty", "None");
          _this.castle_info['Right'] = [false, [-1, -1]];
        }
        // Disable castling for current piece's color.
        _this.castle_avail[piece1.color] = [false, false];
      }
    }

    /**
     * Handles secondary piece movements in en passant scenarios and delayed
       moves updates.
     */
    function en_passant_handler() {
      if(_this.delayed_moves.length !== 0) {
        const delete_piece = _this.board[coor1[0]][coor2[1]];
        if(piece1.type === 'Pawn' && piece2.type === 'Empty' &&
           delete_piece.type === 'Pawn' && delete_piece.color !== piece1.color) {
          _this.delayed_moves.forEach(move => _this.board[move[0][0]][move[0][1]] = move[1]);
        }
      }
    }

    /**
     * Searches for checkmate.
     *
     * @return {String} 'Checkmate' if checkmate is detected, 'Good' if not.
     */
    function endgame_handler() {
      if(!is_simulation) {
        const king = _this.find_king(_this.enemy_color());
        // If King is in check or worse...
        if(_this.is_in_danger(king)) {
          // Find all ally pieces...
          for(let y = 0; y < _this.board.length; y++) {
            for(let x = 0; x < _this.board[0].length; x++) {
              const check_piece = _this.board[y][x];
              const start_coor = [y, x];
              if(check_piece.color === _this.ptm) {
                const legal_moves = _this.get_valid_moves(start_coor, is_simulation=true);
                // Simulate all legal moves...
                for(let move of legal_moves) {
                  let simulation = _this.deep_copy();
                  simulation.move_piece(start_coor, move, is_simulation=true);
                  const sim_king = simulation.find_king(_this.ptm);
                  // If a legal move that removes the ally King from check is found...
                  if(!simulation.is_in_danger(sim_king)) {
                    return 'Good';
                  }
                }
              }
            }
          }
          return 'Checkmate';
        }
        return 'Good';
      }
    }

    // Is valid turn check.
    if(piece1.color === this.ptm) {
      // Within moveset check.
      const valid_moveset = this.get_valid_moves(coor1, is_simulation);
      const move_is_valid = valid_moveset.find(ele => this.utility.arrays_equal(ele, coor2));
      if(!move_is_valid) return 'Bad';

      if(!is_simulation) {
        // Legality check.
        if(!this.is_legal_move(coor1, coor2)) return 'Bad';
        // Pawn promotion early return.
        if(!ignore_pawn_promotion && piece1.type === 'Pawn') {
          if(coor2[0] === 0 || coor2[0] === _this.board.length - 1) {
            return "Promotion";
          }
        }
      }

      // Edge rule checks.
      castle_handler();
      en_passant_handler();

      // Moving pieces.
      if(piece2.is_empty()) {
        this.board[coor2[0]][coor2[1]] = piece1;
        this.board[coor1[0]][coor1[1]] = piece2;
      }
      // Capturing pieces.
      else {
        this.board[coor2[0]][coor2[1]] = piece1;
        this.board[coor1[0]][coor1[1]] = new Piece("Empty", "None");
      }

      // End of turn logic.
      this.ptm = this.enemy_color();
      this.move_history.push([[piece1, coor1], [piece2, coor2]]);
      this.delayed_moves = [];

      // Endgame detection & handler
      return endgame_handler();
    }
  }

  /**
   * Finds all valid moves for a piece at a given coordinate at current state.
   *
   * @param {Array}   coor - 2 element array for target coordinate in format
                      [y, x].
   * @param {Boolean} is_simulation - Whether move is being simulated or not.
                      If so, valid_moves will skip legality checks for King.
   *
   * @return {Array} Set of valid moves for piece at coordinate.
   */
  get_valid_moves(coor, is_simulation=false) {
    const _this = this;
    let valid_moveset = [];
    let piece = this.get_piece(coor);
    coor = [parseInt(coor[0]), parseInt(coor[1])]

    /**
     * Checks that a set of transformations on a coordinate are valid and
       returns the transformed coordinate.
     *
     * @param {Array}    valid_moveset - Set of additive transformations on
                         piece's coordinate to get valid movesets.
     * @param {Boolean}  filter_undefined - Filter out undefined if true.
     *
     * @return {Array} Set of transformed coordinates.
     */
    function transformer(valid_moveset, filter_undefined=true) {
      valid_moveset = valid_moveset.map(
        function(trans) {
          const trans_coor = _this.utility.array_add(trans, coor);
          if(trans_coor[0] >= 0 && trans_coor[0] < _this.board.length &&
             trans_coor[1] >= 0 && trans_coor[1] < _this.board[0].length &&
             _this.board[trans_coor[0]][trans_coor[1]].color !== piece.color) {
               return trans_coor;
          }
        });
      if(filter_undefined) {
        valid_moveset = valid_moveset.filter(ele => ele);
      }
      return valid_moveset;
    }

    /**
     * Finds valid moves for a 'Rook' piece including capture locations.
     *
     * @return {Array} Set of valid moves for 'Rook'.
     */
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

    /**
     * Finds valid moves for a 'Bishop' piece including capture locations.
     *
     * @return {Array} Set of valid moves for 'Bishop'.
     */
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

    /**
     * Updates delayed moves if an en passant is available.
     *
     * @param {Array} pawn_move - 2 element array for target coordinate of
                      'Pawn' piece.
     *
     * @return {Boolean} Whether en passant is possible or not.
     */
    function en_passant_handler(pawn_move) {
      // If first move of game, skip.
      if(_this.move_history.length === 0) return;
      // If the last move was a 2 space pawn advance
      const last_move = _this.move_history[_this.move_history.length - 1];
      if(last_move[0][0].type === "Pawn" && Math.abs(last_move[0][1][0] - last_move[1][1][0]) === 2) {
        // and the desired move is in the correct spot
        const target_y = (_this.orientation === piece.color) ? last_move[1][1][0] - 1 : parseInt(last_move[1][1][0]) + 1;
        if(parseInt(last_move[1][1][1]) === pawn_move[1] && target_y === pawn_move[0]) {
          if(!is_simulation) _this.delayed_moves.push([[last_move[1][1][0], last_move[1][1][1]], new Piece("Empty", "None")]);
          return true;
        }
      }
      return false;
    }

    /**
     * Updates castle_avail and castle_info if a castle is available.
     *
     * @return {Array} King's valid castle coordinates.
     */
    function castle_info_update() {
      let castle_moveset = [[0, -2], [0, 2]];
      let king_dest = undefined, check_piece = undefined, castle_ready = true;
      let return_moveset = [];

      if(_this.castle_avail[piece.color][0]) {
        king_dest = _this.utility.array_add(castle_moveset[0], coor);
        for(let i = coor[1] - 1; i >= 1; i--) {
          check_piece = _this.get_piece([king_dest[0], i]);
          if(!check_piece.is_empty() || _this.is_in_danger(check_piece, piece.color)) {
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
          check_piece = _this.get_piece([king_dest[0], i]);
          if(!check_piece.is_empty() || _this.is_in_danger(check_piece, piece.color)) {
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
        let return_moveset = [];
        valid_moveset = [[1, 0], [2, 0], [1, 1], [1, -1]];
        // Invert transformations if orientation is 'Black'.
        if(this.orientation === piece.color) {
          valid_moveset = valid_moveset.map(trans => trans.map(x => x * -1));
        }
        valid_moveset = transformer(valid_moveset, false);

        // Move forward one.
        if(valid_moveset[0] !== undefined) {
          const target_piece = this.board[valid_moveset[0][0]][valid_moveset[0][1]];
          if(target_piece.type === "Empty" && target_piece.color === "None") {
            return_moveset.push(valid_moveset[0]);
          }
        }
        // Move forward two.
        if(valid_moveset[0] !== undefined && valid_moveset[1] !== undefined) {
          const blocking_piece = this.board[valid_moveset[0][0]][valid_moveset[0][1]];
          const target_piece = this.board[valid_moveset[1][0]][valid_moveset[1][1]];
          if(blocking_piece.type === "Empty" && blocking_piece.color === "None" &&
             target_piece.type === "Empty" && target_piece.color === "None") {
            if(this.freq_move_history(piece) === 0) return_moveset.push(valid_moveset[1]);
          }
        }
        // Capture diagonally right.
        if(valid_moveset[2] !== undefined) {
          const target_piece = this.board[valid_moveset[2][0]][valid_moveset[2][1]];
          if((target_piece.type !== "Empty" && target_piece.color !== "None") ||
             en_passant_handler(valid_moveset[2])) {
            return_moveset.push(valid_moveset[2]);
          }
        }
        // Capture diagonally left.
        if(valid_moveset[3] !== undefined) {
          const target_piece = this.board[valid_moveset[3][0]][valid_moveset[3][1]];
          if((target_piece.type !== "Empty" && target_piece.color !== "None") ||
             en_passant_handler(valid_moveset[3])) {
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
        valid_moveset = transformer(valid_moveset);
        return valid_moveset;
        break;
      case 'Bishop':
      return bishop_handler();
        break;
      case 'King':
        valid_moveset = [[ 1, -1], [ 1, 0], [ 1,  1],
                         [ 0, -1],          [ 0,  1],
                         [-1, -1], [-1, 0], [-1,  1]];
        valid_moveset = transformer(valid_moveset);
        if(!is_simulation) valid_moveset = valid_moveset.concat(castle_info_update());
        return valid_moveset;
        break;
      case 'Queen':
        return bishop_handler().concat(rook_handler());
        break;
    }
    throw new Error("get_valid_moves: Invalid piece type.");
  }

  /**
   * Determines if piece is under attack.
   *
   * @param {Piece}  piece - Piece to check if under attack.
   * @param {String} color - Enemy piece's color.
   *
   * @return {Boolean} Whether piece is under attack or not.
   */
  is_in_danger(piece, color=piece.color) {
    const coor = this.find_piece(piece);
    for(let y = 0; y < this.board.length; y++) {
      for(let x = 0; x < this.board[0].length; x++) {
        const check_piece = this.board[y][x];
        if(!check_piece.is_empty() && check_piece.color !== color &&
           this.get_valid_moves([y, x], true).find(loc => this.utility.arrays_equal(loc, coor))) {
            return true;
        }
      }
    }
    return false;
  }

  /**
   * Finds 'color' King in board and returns King object.
   *
   * @param {String} color - Color of desired King.
   *
   * @return {Piece} King object of color 'color'.
   */
  find_king(color) {
    for(let y = 0; y < this.board.length; y++) {
      for(let x = 0; x < this.board[0].length; x++) {
        const check_piece = this.board[y][x];
        if(check_piece.type === "King" && check_piece.color === color) {
          return check_piece;
        }
      }
    }
  }

  /**
   * Simulates a turn and checks if king is in danger.
   *
   * @param {Array} coor1 - Start coordinate for simulation of format [y, x].
   * @param {Array} coor2 - Target coordinate for simulation of format [y, x].
   *
   * @return {Boolean} Whether current player's King is in danger or not.
   */
  is_legal_move(coor1, coor2) {
    let simulation = this.deep_copy();
    simulation.move_piece(coor1, coor2, true);

    const king_info = simulation.find_king(this.ptm);
    return !simulation.is_in_danger(king_info);
  }
}

class Piece {
  /**
   * Represents a piece in the chessboard.
   *
   * @param {String} type - Type of piece. Ex: 'King', 'Queen', etc.
   * @param {String} color - Color of piece. Ex: 'White', 'Black'.
   */
  constructor(type, color) {
    this.type = type;
    this.color = color;
  }

  /**
   * Checks if piece is an empty piece.
   *
   * @return {Boolean} Whether piece is empty or not.
   */
  is_empty() {
    return this.type === 'Empty' && this.color === 'None';
  }

  /**
   * Checks equality between this and piece2.
   *
   * @param {Piece} piece2 - Piece to check against.
   *
   * @return {Boolean} Whether pieces are equal.
   */
  is_equal(piece2) {
    return (piece.constructor.name === 'Piece' &&
            this.type === piece2.type &&
            this.color === piece2.color);
  }

  /**
   * Creates a dereferenced copy of piece object.
   *
   * @return {Piece} Deep copy of piece.
   */
  deep_copy() {
    let copy = new Piece();
    copy.type = this.type;
    copy.color = this.color;
    return copy;
  }
}

class UIHandler {
  /**
   * Handles all visual aspects of displaying the Chess game.
   *
   * @param {State} state - Backend board information.
   */
  constructor(state, player_one, player_two) {
    const _this = this;

    function calc_square_size() {
      const board_dims = [state.board.length, state.board[0].length];
      let boundary = (window.innerWidth > window.innerHeight) ? window.innerHeight : window.innerWidth;
      boundary *= 0.75;
      let largest_dim = (board_dims[0] > board_dims[1]) ? board_dims[0] : board_dims[1];

      _this.board_div.style.width = boundary + "px";
      _this.board_div.style.height = boundary + "px";

      return boundary / largest_dim;
    }

    this.state = state;
    this.player_one = player_one;
    this.player_two = player_two;

    this.board_div = document.getElementById('board');
    this.output_div = document.getElementById('output');
    this.square_size = calc_square_size();
    this.history = [this.state.deep_copy()];
    this.highlighted_square = [null, ""];
    this.indicated_squares = [];
    this.turn_num = 0;
    this.promoted = false;
    this.curr_player = this.player_one;

    this.init_handler();
  }

  init_handler() {
    this.draw_board();
    this.draw_pieces();
    this.draw_display();

    // Utility button listeners.
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

  /**
   * Resets the entire board while keeping orientation.
   */
  reset() {
    // Reset the UI Handler
    this.history = this.history.splice(0, 1);
    this.highlighted_square = [null, ""];
    this.indicated_squares = [];
    this.turn_num = 1;
    this.promoted = false;

    // Reset the state
    this.state.reset();

    // Erase the board
    const board = document.getElementById('board');
    while (board.firstChild) { board.firstChild.remove(); }

    // Redraw everything
    this.draw_board();
    this.draw_pieces();
  }

  /**
   * Undos one move.
   */
  undo() {
    if(this.turn_num > 0) {
      this.state = this.history[this.turn_num - 1].deep_copy();
      this.turn_num -= 1;
      this.draw_pieces();
    }
  }

  /**
   * Erases the highlighted square.
   */
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

  /**
   * Creates an indicator SVG.
   *
   * @return {Element} Indicator SVG element.
   */
  create_indicator() {
    let circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.appendChild(circle);
    return svg;
  }

  /**
   * Switches players and waits for their move.
   */
  async player_switch(square) {
    const player_code = this.move_click_handler(square);
    if(player_code === 'Finished') {
      this.curr_player = (this.curr_player === this.player_one)
                         ? this.player_two
                         : this.player_one;
      if(this.curr_player !== 'Human' && this.curr_player.constructor.name === 'AI') {
        const move = await this.curr_player.make_move();
        await this.move_click_handler(this.board_div.children[move[0][0]].children[move[0][1]]);
        await this.move_click_handler(this.board_div.children[move[1][0]].children[move[1][1]]);
        this.curr_player = (this.curr_player === this.player_one)
                           ? this.player_two
                           : this.player_one;
      }
    }
  }

  /**
   * Disables entire board by removing all event handlers.
   */
  disable_board() {
    for(let y = 0; y < this.state.board.length; y++) {
      for(let x = 0; x < this.state.board[0].length; x++) {
        const square = this.board_div.children[y].children[x];
        const square_clone = square.cloneNode(true);
        square.parentNode.replaceChild(square_clone, square);
      }
    }
  }

  /**
   * Enables entire board by readding all event handlers.
   */
  enable_board() {
    const _this = this;
    for(let y = 0; y < this.state.board.length; y++) {
      for(let x = 0; x < this.state.board[0].length; x++) {
        const square = this.board_div.children[y].children[x];
        square.addEventListener('click', function() {
          _this.player_switch(square);
        }, false);
      }
    }
  }

  /**
   * Handles the logic for a pawn promotion event.
   *
   * @param {Array}  coor1 - 2 element array for start coordinate in format
                     [y, x].
   * @param {Array}  coor2 - 2 element array for target coordinate in format
                     [y, x].
   * @param {Number} move_history_len - Length of history before promotion.
   *
   * @return {String} 'Promoted' for successful promotion.
   */
  promotion_handler(coor1, coor2, move_history_len) {
    const _this = this;

    // Dereference all board squares and update 'square' variable reference
    this.disable_board();
    let square = this.board_div.children[coor2[0]].children[coor2[1]];

    // Save and remove piece on promotion square
    const previous_piece = this.state.board[coor2[0]][coor2[1]].deep_copy();
    square.removeChild(square.lastChild);

    async function promotion_square_click_handler(promotion_square) {
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

      // TODO: Fix this! Add AI behavior for promotion events.
      _this.curr_player = (_this.curr_player === _this.player_one)
                          ? _this.player_two
                          : _this.player_one;
      const move = await _this.curr_player.make_move();
      await _this.move_click_handler(_this.board_div.children[move[0][0]].children[move[0][1]]);
      await _this.move_click_handler(_this.board_div.children[move[1][0]].children[move[1][1]]);
      _this.curr_player = (_this.curr_player === _this.player_one)
                          ? _this.player_two
                          : _this.player_one;

      _this.promoted = true;
    }

    function create_promotion_ui() {
      const piece_color = _this.state.ptm;
      const promotion_selection = ['Queen', 'Rook', 'Bishop', 'Knight'];

      // Create promotion UI
      let promotion_ui = document.createElement('div');
      promotion_ui.className = 'promotionUI';
      promotion_ui.id = 'promotionUI';
      promotion_ui.width = _this.square_size + "px";
      promotion_ui.height = _this.square_size * 4 + "px";
      promotion_ui.border = '0.1 px solid black';
      if(piece_color !== _this.state.orientation) {
        promotion_ui.style.position = 'relative';
        promotion_ui.style.top = _this.square_size * -3 + "px";
      }

      // Display promotion UI
      for(let piece_name of promotion_selection) {
        let promotion_square = document.createElement('div');
        promotion_square.className = 'promotionSquare';
        promotion_square.width = _this.square_size + "px";
        promotion_square.height = _this.square_size + "px";

        promotion_square.addEventListener('click',
          function() {
            promotion_square_click_handler(promotion_square);
          });

        let promotion_piece = document.createElement("img");
        promotion_piece.className = "promotion-piece";
        promotion_piece.style.width = _this.square_size + "px";
        promotion_piece.style.height = _this.square_size + "px";

        const piece_object = _this.state.board[coor1[0]][coor1[1]];
        promotion_piece.src = "Resources/Pieces/" + piece_color + "_" + piece_name + ".png";
        promotion_piece.id = piece_color + "," + piece_name;

        promotion_square.appendChild(promotion_piece);
        if(piece_color === _this.state.orientation) {
          promotion_ui.appendChild(promotion_square);
        } else {
          promotion_ui.insertBefore(promotion_square, promotion_ui.firstChild);
        }
      }
      return promotion_ui;
    }

    const promotion_ui = create_promotion_ui();
    square.style.zIndex = '1';
    square.appendChild(promotion_ui);

    // Unhighlight square
    const highlight_coor = this.highlighted_square[0].id.split(',');
    const highlighted_square = this.board_div.children[highlight_coor[0]].children[highlight_coor[1]];
    highlighted_square.className = this.highlighted_square[1];
    this.highlighted_square = [null, ""];

    return 'Promoted';
  }

  /**
   * Handles the logic for clicking on a square on the board.
   *
   * @param {Element} square - Div element of square on board.
   *
   * @return {String} 'Finished' if second click is successful. 'Selected' if
                      first click is scucessful.
   */
  move_click_handler(square) {
    // Hacky fix. Rethink later.
    if(this.promoted) { this.promoted = false; return; }

    // Second click.
    if(this.highlighted_square[0] !== null) {
      const coor1 = this.highlighted_square[0].id.split(",");
      const coor2 = square.id.split(",");
      const move_history_len = this.state.move_history.length;
      const code = this.state.move_piece(coor1, coor2);

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

      // Update output log.
      if(move_history_len + 1 === this.state.move_history.length) {
        const piece = this.state.board[coor2[0]][coor2[1]];
        this.output_div.innerText += `\
        [${this.state.move_history.length}]\
        ${piece.color} ${piece.type} to\
        ${String.fromCharCode(parseInt(coor2[1]) + 65)}` +
        `${parseInt(8 - coor2[0])}\n`;

        return 'Finished';
      }
    }
    // First click.
    else if(square.children.length > 0) {
      // Store highlighted square information
      this.highlighted_square = [square, square.className];
      square.className = "highlightedSquare";

      // Show legal moves
      const square_coor = square.id.split(',');
      const legal_moves = this.state.get_valid_moves([square_coor[0], square_coor[1]], true);
      for(let move of legal_moves) {
        if(move !== undefined && this.state.board[move[0]][move[1]].type === 'Empty') {
          this.indicated_squares.push(move);
          this.board_div.children[move[0]].children[move[1]].appendChild(this.create_indicator());
        }
      }
      return 'Selected';
    }
  }

  /**
   * Draws board onto board div.
   */
  draw_board() {
    for(let y = 0; y < this.state.board.length; y++) {
      const row = document.createElement("div");
      row.className = "chess-row";

      for(let x = 0; x < this.state.board[0].length; x++) {
        const square = document.createElement("div");
        square.className = ((x + y) % 2 === 0) ? "lightSquare" : "darkSquare";
        square.id = y + "," + x;
        square.style.width = this.square_size + "px";
        square.style.height = this.square_size + "px";

        const _this = this;
        square.addEventListener('click', function() {
          _this.player_switch(square);
        }, false);

        row.appendChild(square);
      }
      this.board_div.appendChild(row);
    }
  }

  /**
   * Removes all children of board div.
   */
  clear_board() {
    for(let x = 0; x < this.state.board.length; x++) {
      for(let y = 0; y < this.state.board[0].length; y++) {
        const square = this.board_div.children[x].children[y];
        if(square.lastChild !== null) {
          square.removeChild(square.lastChild);
        }
      }
    }
  }

  /**
   * Draw all pieces onto board.
   */
  draw_pieces() {
    this.clear_board();
    for(let y = 0; y < this.state.board.length; y++) {
      for(let x = 0; x < this.state.board[0].length; x++) {
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

  /**
   * Sizes the information display on the right of the board.
   */
  draw_display() {
    const game_display_div = document.getElementById('game-display')
    const info_display_div = document.getElementById('info-display');
    info_display_div.style.height = game_display_div.offsetHeight + 'px';
    info_display_div.style.width = (window.innerWidth - game_display_div.offsetWidth) / 2 + 'px';

    this.output_div.style.height = this.board_div.offsetHeight;
  }
}

// These variables are outside of main for debugging purposes.
let state = undefined;
let ai = undefined;
let drawer = undefined;

function main() {
  state = new State();
  ai = new AI(state, state.enemy_color());
  drawer = new UIHandler(state, 'Human', ai);
}
