// TODO:
// 1. Figure out dragging mechanics for pieces --> Draggable JS library
// 2. Pawn promotion
// 3. Castling
// 4. Check/illegal move handler

const utility = new JavascriptToolbox();

class State {
  ptm = "White";
  move_history = [];
  orientation = "White";

  constructor() {
    this.board = this.init_board();
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

    if(this.orientation === "Black") {
      this.flip_board();
      this.orientation = (this.orientation === "White") ? "Black" : "White";
    }
  }

  move_piece(coor1, coor2) {
    const piece1 = this.board[coor1[0]][coor1[1]];
    const piece2 = this.board[coor2[0]][coor2[1]];

    if(piece1.color === this.ptm) {
      // Validity and Legality check
      if(!this.is_within_moveset(coor1, coor2) || !this.is_legal_move(coor1, coor2)) {
        return
      }

      if(piece2.type === "Empty" && piece2.color === "None") {
        // Move Handler
        this.board[coor2[0]][coor2[1]] = piece1;
        this.board[coor1[0]][coor1[1]] = piece2;
      } else {
        // Capture Handler
        this.board[coor2[0]][coor2[1]] = piece1;
        this.board[coor1[0]][coor1[1]] = new Piece("Empty", "None");
      }

      // End of turn logic
      this.ptm = (this.ptm === "White") ? "Black" : "White";
      this.move_history.push([[piece1, coor1], [piece2, coor2]]);
    }
  }

  // Checks if move is within piece's possible movesets
  // valid_moveset is in format: (y, x)
  is_within_moveset(coor1, coor2) {
    let piece = this.board[coor1[0]][coor1[1]];
    let target = this.board[coor2[0]][coor2[1]];
    let valid_moveset = [];
    let _this = this;
    coor1 = [parseInt(coor1[0]), parseInt(coor1[1])]
    coor2 = [parseInt(coor2[0]), parseInt(coor2[1])]

    function valid_moveset_handler(trans) {
      return function(trans) {
        const trans_coor = [trans[0] + coor1[0], trans[1] + coor1[1]];
        if(trans_coor[0] >= 0 && trans_coor[0] < _this.board.length &&
           trans_coor[1] >= 0 && trans_coor[1] < _this.board[0].length &&
           _this.board[trans_coor[0]][trans_coor[1]].color !== piece.color) {
             return trans_coor;
        }
      }
    }

    function rook_handler() {
      for(let y1 = coor1[0] - 1; y1 >= 0; y1--) {
        const inspect_piece = _this.board[y1][coor1[1]];
        if(inspect_piece.type === "Empty" || inspect_piece.color === "None") {
          valid_moveset.push([y1, coor1[1]]);
        }
        else if(inspect_piece.type !== "Empty" || inspect_piece.color !== "None") {
          if(inspect_piece.color !== piece.color) {
            valid_moveset.push([y1, coor1[1]]);
          }
          break;
        }
      }
      for(let y2 = coor1[0] + 1; y2 < _this.board.length; y2++) {
        const inspect_piece = _this.board[y2][coor1[1]];
        if(inspect_piece.type === "Empty" || inspect_piece.color === "None") {
          valid_moveset.push([y2, coor1[1]]);
        }
        else if(inspect_piece.type !== "Empty" || inspect_piece.color !== "None") {
          if(inspect_piece.color !== piece.color) {
            valid_moveset.push([y2, coor1[1]]);
          }
          break;
        }
      }
      for(let x1 = coor1[1] - 1; x1 >= 0; x1--) {
        const inspect_piece = _this.board[coor1[0]][x1];
        if(inspect_piece.type === "Empty" || inspect_piece.color === "None") {
          valid_moveset.push([coor1[0], x1]);
        }
        else if(inspect_piece.type !== "Empty" || inspect_piece.color !== "None") {
          if(inspect_piece.color !== piece.color) {
            valid_moveset.push([coor1[0], x1]);
          }
          break;
        }
      }
      for(let x2 = coor1[1] + 1; x2 < _this.board[0].length; x2++) {
        const inspect_piece = _this.board[coor1[0]][x2];
        if(inspect_piece.type === "Empty" || inspect_piece.color === "None") {
          valid_moveset.push([coor1[0], x2]);
        }
        else if(inspect_piece.type !== "Empty" || inspect_piece.color !== "None") {
          if(inspect_piece.color !== piece.color) {
            valid_moveset.push([coor1[0], x2]);
          }
          break;
        }
      }
      return valid_moveset;
    }

    function bishop_handler() {
      let valid_moveset = [];
      for(let cy = coor1[0] + 1, cx = coor1[1] - 1; cy < _this.board.length && cx >= 0; cy++, cx--) {
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
      for(let cy = coor1[0] - 1, cx = coor1[1] + 1; cy >= 0 && cx < _this.board.length; cy--, cx++) {
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
      for(let cy = coor1[0] + 1, cx = coor1[1] + 1; cy < _this.board.length && cx < _this.board.length; cy++, cx++) {
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
      for(let cy = coor1[0] - 1, cx = coor1[1] - 1; cy >= 0 && cx >= 0; cy--, cx--) {
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

    switch(piece.type) {
      case 'Pawn':
        valid_moveset = [[1, 0], [2, 0], [1, 1], [1, -1]];
        if(this.orientation === piece.color) {
          valid_moveset = valid_moveset.map(trans => trans.map(x => x * -1));
        }
        valid_moveset = valid_moveset.map(valid_moveset_handler(valid_moveset));

        // Normal move handlers
        if(utility.arrays_equal(valid_moveset[0], coor2)) {
          return target.type === "Empty" && target.color === "None";
        }
        else if(utility.arrays_equal(valid_moveset[1], coor2)) {
          const blocking_piece = this.board[valid_moveset[0][0]][valid_moveset[0][1]];
          return blocking_piece.type === "Empty" && blocking_piece.color === "None" &&
                 target.type === "Empty" && target.color === "None";
        }
        // Capture handler
        else if(utility.arrays_equal(valid_moveset[2], coor2) || utility.arrays_equal(valid_moveset[3], coor2)) {
          // En passant handler
          const last_move = this.move_history[this.move_history.length - 1];
          // If the last move was a 2 space pawn advance
          if(last_move[0][0].type === "Pawn" && Math.abs(last_move[0][1][0] - last_move[1][1][0]) === 2) {
            // and the desired move is in the correct spot
            const target_y = (this.orientation === piece.color) ? last_move[1][1][0] - 1 : parseInt(last_move[1][1][0]) + 1;
            if(parseInt(last_move[1][1][1]) === coor2[1] && target_y === coor2[0]) {
              this.board[last_move[1][1][0]][last_move[1][1][1]] = new Piece("Empty", "None");
              return true;
            }
          }

          return target.type !== "Empty" && target.color !== "None";
        }
        break;
      case 'Rook':
        valid_moveset = rook_handler();
        return valid_moveset.find(ele => utility.arrays_equal(ele, coor2));
        break;
      case 'Knight':
        valid_moveset = [[2, -1], [2, 1], [1, 2], [1, -2], [-1, 2], [-1, -2], [-2, -1], [-2, 1]];
        valid_moveset = valid_moveset.map(valid_moveset_handler(valid_moveset));
        return valid_moveset.find(ele => utility.arrays_equal(ele, coor2));
        break;
      case 'Bishop':
        valid_moveset = bishop_handler();
        return valid_moveset.find(ele => utility.arrays_equal(ele, coor2));
        break;
      case 'King':
        valid_moveset = [[ 1, -1], [ 1, 0], [ 1,  1],
                         [ 0, -1],          [ 0,  1],
                         [-1, -1], [-1, 0], [-1, -1]];
        valid_moveset = valid_moveset.map(valid_moveset_handler(valid_moveset));
        return valid_moveset.find(ele => utility.arrays_equal(ele, coor2));
        break;
      case 'Queen':
        valid_moveset = bishop_handler().concat(rook_handler());
        return valid_moveset.find(ele => utility.arrays_equal(ele, coor2));
        break;
    }

    return false;
  }

  // Simulates a turn and checks if move puts king in dange
  is_legal_move(coor1, coor2) {
    let piece = this.board[coor1[0]][coor1[1]];

    return true;
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

    this.draw_board();
    this.draw_pieces();
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
              _this.state.move_piece(coor1, coor2);
              _this.draw_pieces();

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
  document.getElementById('switch').addEventListener('click', function() { state.flip_board(); drawer.draw_pieces(); }, false);
  document.getElementById('reset').addEventListener('click', function() { state.reset(); drawer.draw_pieces(); }, false);
}
