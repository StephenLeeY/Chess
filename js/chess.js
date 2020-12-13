// TODO:
// 1. Figure out dragging mechanics for pieces

// locations of all pieces, player to move, history of moves
class State {
  ptm = 0;
  move_history = [];

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
  }

  move_piece(coor1, coor2) {
    [this.board[coor1[0]][coor1[1]], this.board[coor2[0]][coor2[1]]] = [this.board[coor2[0]][coor2[1]], this.board[coor1[0]][coor1[1]]];
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
    boundary *= 0.8;
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
}
