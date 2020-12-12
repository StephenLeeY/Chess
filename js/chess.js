// Chess logic handlers

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
}

// type of piece, color, number of points, etc.
class Piece {
  constructor(type, color) {
    this.type = type;
    this.color = color;
  }
}

class UIHandler {
  constructor(state, parent_div, board_dims, dark_color, light_color) {
    this.state = state;
    this.parent_div = parent_div;
    this.board_dims = board_dims;
    this.dark_color = dark_color;
    this.light_color = light_color;
    this.square_size = this.calc_square_size();
  }

  calc_square_size() {
    let boundary = (window.innerWidth > window.innerHeight) ? window.innerHeight : window.innerWidth;
    boundary *= 0.8;
    let largest_dim = (this.board_dims[0] > this.board_dims[1]) ? this.board_dims[0] : this.board_dims[1];

    this.parent_div.style.width = boundary + "px";
    this.parent_div.style.height = boundary + "px";

    return boundary / largest_dim;
  }

  draw_board() {
    for(let x = 0; x < this.board_dims[0]; x++) {
      const row = document.createElement("div");
      row.className = "chess-row";

      for(let y = 0; y < this.board_dims[1]; y++) {
        const square = document.createElement("div");
        square.className = ((x + y) % 2 === 0) ? "lightSquare" : "darkSquare";
        square.style.width = this.square_size + "px";
        square.style.height = this.square_size + "px";

        row.appendChild(square);
      }
      this.parent_div.appendChild(row);
    }
  }

  draw_pieces() {
    for(let x = 0; x < this.board_dims[0]; x++) {
      for(let y = 0; y < this.board_dims[1]; y++) {
        const piece = document.createElement("img");
        piece.className = "chess-piece";
        piece.style.width = this.square_size + "px";
        piece.style.height = this.square_size + "px";

        const piece_object = this.state.board[x][y];
        if(piece_object.type === "Empty" || piece_object.color === "None") {
          continue;
        }
        piece.src = "Resources/Pieces/" + piece_object.color + "_" + piece_object.type + ".png";

        this.parent_div.children[x].children[y].appendChild(piece);
      }
    }
  }
}

function main(board_div) {
  let init_state = new State();
  let drawer = new UIHandler(init_state, document.getElementById("board"), [8, 8], "#8b6914", "#deb887");
  drawer.draw_board();
  drawer.draw_pieces();
}
