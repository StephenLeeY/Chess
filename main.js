/*
  TODO
  1. White start/Black start implementation
  2. move canvas & ctx & other variables to chess class
  3. Extremely weird bug with move history display
  4. Bug where capturing pieces don't update correctly on color
*/

var canvas = document.getElementById('myCanvas')
var ctx = canvas.getContext('2d')

// Increases resolution of canvas
var scale = 10
canvas.width = 750 * scale
canvas.height = 750 * scale
var size = 937.5 // (Size of canvas (CSS) * scale) / Number of columns (8)

class Board {
  turn_number = 1
  castling = false
  en_passant = new Coordinate(-1, -1)
  pawn_promotion = new Pawn("", new Coordinate(-1, -1))
  pawn_promotion_options = []
  move_history = new Map()
  pieces = new Map()

  constructor(drawFlag) {
    this.init_board(drawFlag)
  }

  // Returns a deep copy of this object
  deepCopy() {
    let copy = new Board(false)
    copy.turn_number = this.turn_number
    copy.castling = this.castling
    copy.en_passant = this.en_passant.deepCopy()
    copy.pawn_promotion = this.pawn_promotion.deepCopy()
    let copy_pawn_promotion_options = []
    for(let pawn_promotion_option of this.pawn_promotion_options) {
      copy_pawn_promotion_options.push(pawn_promotion_option)
    }
    copy.pawn_promotion_options = copy_pawn_promotion_options
    let copy_move_history = new Map()
    for(let [piece, move_list] of this.move_history) {
      let copy_piece = piece.deepCopy()
      let copy_move_list = []
      for(let move of move_list) {
        copy_move_list.push(move.deepCopy())
      }
      copy_move_history.set(copy_piece, copy_move_list)
    }
    copy.move_history = copy_move_history
    let copy_pieces = new Map()
    for(let [piece, image] of this.pieces) {
      let copy_piece = piece.deepCopy()
      let copy_image = new Image()
      copy_image.src = image.src
      copy_pieces.set(copy_piece, copy_image)
    }
    copy.pieces = copy_pieces
    return copy
  }

  select_pawn_promotion_handler(clicked_coordinate, canx, cany) {
    let board = this
    for(let pawn_promotion_option of this.pawn_promotion_options) {
      pawn_promotion_option = null
    }
    this.pawn_promotion_options = []
    this.drawBoard([])
    if(clicked_coordinate.equals(this.pawn_promotion.coordinate)) {
      let pawn_coordinate = new Coordinate(
        ((canx / size * 10) - clicked_coordinate.x).toFixed(1),
        ((cany / size * 10) - clicked_coordinate.y).toFixed(1))
      if(pawn_coordinate.x <= 0.5) {
        if(pawn_coordinate.y <= 0.5) {
          let promoted_queen = new Image()
          promoted_queen.src = 'Pieces/' + this.pawn_promotion.color + '_Queen.png'
          promoted_queen.onload = function() {
            ctx.drawImage(promoted_queen, board.pawn_promotion.coordinate.x * size,
              board.pawn_promotion.coordinate.y * size, size, size)
          }
          this.pieces.set(
            new Queen(this.pawn_promotion.color + "_Queen", clicked_coordinate),
            promoted_queen
          )
          return false
        } else {
          let promoted_knight = new Image()
          promoted_knight.src = 'Pieces/' + this.pawn_promotion.color + '_Knight.png'
          promoted_knight.onload = function() {
            ctx.drawImage(promoted_knight, board.pawn_promotion.coordinate.x * size,
              board.pawn_promotion.coordinate.y * size, size, size)
          }
          this.pieces.set(
            new Knight(this.pawn_promotion.color + "_Knight", clicked_coordinate),
            promoted_knight
          )
          return false
        }
      } else {
        if(pawn_coordinate.y <= 0.5) {
          let promoted_bishop = new Image()
          promoted_bishop.src = 'Pieces/' + this.pawn_promotion.color + '_Bishop.png'
          promoted_bishop.onload = function() {
            ctx.drawImage(promoted_bishop, board.pawn_promotion.coordinate.x * size,
              board.pawn_promotion.coordinate.y * size, size, size)
          }
          this.pieces.set(
            new Bishop(this.pawn_promotion.color + "_Bishop", clicked_coordinate),
            promoted_bishop
          )
          return false
        } else {
          let promoted_rook = new Image()
          promoted_rook.src = 'Pieces/' + this.pawn_promotion.color + '_Rook.png'
          promoted_rook.onload = function() {
            ctx.drawImage(promoted_rook, board.pawn_promotion.coordinate.x * size,
              board.pawn_promotion.coordinate.y * size, size, size)
          }
          this.pieces.set(
            new Rook(this.pawn_promotion.color + "_Rook", clicked_coordinate),
            promoted_rook
          )
          return false
        }
      }
    }
    return true
  }

  // Draw pawn promotion options
  draw_pawn_promotion_options(clicked_coordinate) {
    if(this.pawn_promotion.piece_name === "") {
      return false
    }
    let promoting_pawn = this.getPieceByCoordinate(clicked_coordinate)
    let queen_option = new Image()
    queen_option.src = 'Pieces/' + promoting_pawn.color + '_Queen.png'
    queen_option.onload = function() {
      ctx.drawImage(queen_option, promoting_pawn.coordinate.x * size,
        promoting_pawn.coordinate.y * size, size / 2, size / 2)
    }
    this.pawn_promotion_options.push(queen_option)
    let bishop_option = new Image()
    bishop_option.src = 'Pieces/' + promoting_pawn.color + '_Bishop.png'
    bishop_option.onload = function() {
      ctx.drawImage(bishop_option, (promoting_pawn.coordinate.x + 0.5) * size,
      promoting_pawn.coordinate.y * size, size / 2, size / 2)
    }
    this.pawn_promotion_options.push(bishop_option)
    let knight_option = new Image()
    knight_option.src = 'Pieces/' + promoting_pawn.color + '_Knight.png'
    knight_option.onload = function() {
      ctx.drawImage(knight_option, promoting_pawn.coordinate.x * size,
        (promoting_pawn.coordinate.y + 0.5) * size, size / 2, size / 2)
    }
    this.pawn_promotion_options.push(knight_option)
    let rook_option = new Image()
    rook_option.src = 'Pieces/' + promoting_pawn.color + '_Rook.png'
    rook_option.onload = function() {
      ctx.drawImage(rook_option, (promoting_pawn.coordinate.x + 0.5) * size,
      (promoting_pawn.coordinate.y + 0.5) * size, size / 2, size / 2)
    }
    this.pawn_promotion_options.push(rook_option)
    this.deletePiece(promoting_pawn.coordinate)
    return true
  }

  // Detects checkmate
  checkmateHandler() {
    // Find king
    let ally_color = (this.turn_number % 2 != 0) ? "White" : "Black"
    let enemy_color = (ally_color === "White") ? "Black" : "White"
    let king = ""
    for(let [piece, image] of this.pieces) {
      if(piece.piece_name === ally_color + "_King") {
        king = piece
      }
    }
    if(king.getLegalMoves(this, false).length !== 0) {
      return false
    }
    // See if any ally move results in getting out of check
    for(let [piece, image] of this.pieces) {
      if(piece.color === king.color && !piece.piece_name.includes("King")) {
        let piece_moves = piece.getLegalMoves(this, false)
        valid_move:
        for(let move of piece_moves) {
          let future_board = this.deepCopy()
          future_board.updateMoveHistory(piece.coordinate, move)
          future_board.updatePieces(piece.coordinate, move)
          future_board.turn_number += 1

          if(king.getCheckingPieces(future_board, king.coordinate).length !== 0) {
            continue valid_move
          } else {
            return false
          }
        }
      }
    }

    // Stalemate vs. Checkmate
    if((king.getLegalMoves(this, false).length === 0) &&
    (king.getCheckingPieces(this, king.coordinate).length === 0)) {
      alert("Stalemate. Draw.")
    } else {
      alert("Checkmate. " + enemy_color + " wins.")
    }
    this.turn_number = undefined
    this.castling = undefined
    this.en_passant = undefined
    return true
  }

  // Removes any moves that will put ally king in check
  removeIllegalMoves(board, target_piece, target_legal_moves) {
    // Already handled by king getLegalMoves
    if(target_piece.piece_name.includes("King")) {
      return target_legal_moves
    }

    let ally_king = "", enemy_king = ""
    let enemy_color = (target_piece.color === "White") ? "Black" : "White"
    let legal_moves = []
    for(let [piece, image] of this.pieces) {
      if(piece.piece_name.includes("King")) {
        if(piece.color === target_piece.color) {
          ally_king = piece
        } else {
          enemy_king = piece
        }
      }
    }
    king_checker:
    for(let move of target_legal_moves) {
      let future_board = board.deepCopy()
      future_board.updateMoveHistory(target_piece.coordinate, move)
      future_board.updatePieces(target_piece.coordinate, move)
      future_board.turn_number += 1

      if(ally_king.getCheckingPieces(future_board, ally_king.coordinate).length === 0) {
        legal_moves.push(move)
      }
    }
    return legal_moves
  }

  // Checks if board has piece at new_coordinate.
  // If so, return piece. Else if invalid coordinate, return -2. Else, return -1.
  getPieceByCoordinate(target_coordinate) {
    if(target_coordinate.x == -1) { return -2 }
    for(let [piece, image] of this.pieces) {
      if(piece.coordinate.equals(target_coordinate)) {
        return piece
      }
    }
    return -1
  }

  // Returns move history of a piece at a target coordinate or by piece name.
  getMoveHistory(target_coordinate) {
    for(let [piece, move_list] of this.move_history) {
      if(piece.coordinate.equals(target_coordinate)) {
        return move_list
      }
    }
    return []
  }

  // Updates move history
  updateMoveHistory(previous_coordinate, target_coordinate) {
    for(let [piece, move_list] of this.move_history) {
      if(piece.coordinate.equals(previous_coordinate)) {
        move_list.push(target_coordinate)
        return
      }
    }
    this.move_history.set(this.getPieceByCoordinate(previous_coordinate), [target_coordinate])
  }

  // Deletes a piece from pieces
  deletePiece(target_coordinate) {
    let replaceMap = new Map()
    for(let [piece, image] of this.pieces) {
      if(!piece.coordinate.equals(target_coordinate)) {
        replaceMap.set(piece, image)
      }
    }
    this.pieces = replaceMap
  }

  // Updates pieces on board
  updatePieces(previous_coordinate, target_coordinate) {
    let target_piece = this.getPieceByCoordinate(target_coordinate)
    if(target_piece !== -1) {
      this.deletePiece(target_piece.coordinate)
    }
    let previous_piece = this.getPieceByCoordinate(previous_coordinate)
    previous_piece.coordinate = target_coordinate

    if(this.castling && previous_piece.piece_name.includes("King")) {
      // King's side vs. Queen's side castling
      if(target_coordinate.x === 6) {
        let rook = this.getPieceByCoordinate(new Coordinate(7, target_coordinate.y))
        rook.coordinate = new Coordinate(5, target_coordinate.y)
      } else if(target_coordinate.x === 2) {
        let rook = this.getPieceByCoordinate(new Coordinate(0, target_coordinate.y))
        rook.coordinate = new Coordinate(3, target_coordinate.y)
      }
      this.castling = false
    }
  }

  // Draws a single square in chess bord
  drawSquare(i, j, light_color, dark_color) {
    ctx.beginPath()
    ctx.rect(i * size, j * size, size, size)
    if(i & 1) {
      if(j & 1) {
        ctx.fillStyle = light_color
        ctx.strokeStyle = 'rgb(222,184,135)'
      } else {
        ctx.fillStyle = dark_color
        ctx.strokeStyle = 'rgb(133,94,96)'
      }
    } else {
      if(j & 1) {
        ctx.fillStyle = dark_color
        ctx.strokeStyle = 'rgb(133,94,96)'
      } else {
        ctx.fillStyle = light_color
        ctx.strokeStyle = 'rgb(222,184,135)'
      }
    }
    ctx.fill()
    ctx.stroke()
  }

  // Initialize board
  init_board(drawFlag) {
    for(let i = 0; i < 8; i++) {
      let white_pawn = new Image()
      white_pawn.src = 'Pieces/White_Pawn.png'
      let black_pawn = new Image()
      black_pawn.src = 'Pieces/Black_Pawn.png'
      this.pieces.set(new Pawn("White_Pawn", new Coordinate(i, 6)), white_pawn)
      this.pieces.set(new Pawn("Black_Pawn", new Coordinate(i, 1)), black_pawn)
    }
    let white_king = new Image()
    white_king.src = 'Pieces/White_King.png'
    this.pieces.set(new King("White_King", new Coordinate(4, 7)), white_king)
    let white_queen = new Image()
    white_queen.src = 'Pieces/White_Queen.png'
    this.pieces.set(new Queen("White_Queen", new Coordinate(3, 7)), white_queen)
    let white_bishop1 = new Image()
    white_bishop1.src = 'Pieces/White_Bishop.png'
    this.pieces.set(new Bishop("White_Bishop", new Coordinate(2, 7)), white_bishop1)
    let white_bishop2 = new Image()
    white_bishop2.src = 'Pieces/White_Bishop.png'
    this.pieces.set(new Bishop("White_Bishop", new Coordinate(5, 7)), white_bishop2)
    let white_knight1 = new Image()
    white_knight1.src = 'Pieces/White_Knight.png'
    this.pieces.set(new Knight("White_Knight", new Coordinate(1, 7)), white_knight1)
    let white_knight2 = new Image()
    white_knight2.src = 'Pieces/White_Knight.png'
    this.pieces.set(new Knight("White_Knight", new Coordinate(6, 7)), white_knight2)
    let white_rook1 = new Image()
    white_rook1.src = 'Pieces/White_Rook.png'
    this.pieces.set(new Rook("White_Rook", new Coordinate(0, 7)), white_rook1)
    let white_rook2 = new Image()
    white_rook2.src = 'Pieces/White_Rook.png'
    this.pieces.set(new Rook("White_Rook", new Coordinate(7, 7)), white_rook2)

    let black_king = new Image()
    black_king.src = 'Pieces/Black_King.png'
    this.pieces.set(new King("Black_King", new Coordinate(4, 0)), black_king)
    let black_queen = new Image()
    black_queen.src = 'Pieces/Black_Queen.png'
    this.pieces.set(new Queen("Black_Queen", new Coordinate(3, 0)), black_queen)
    let black_bishop1 = new Image()
    black_bishop1.src = 'Pieces/Black_Bishop.png'
    this.pieces.set(new Bishop("Black_Bishop", new Coordinate(2, 0)), black_bishop1)
    let black_bishop2 = new Image()
    black_bishop2.src = 'Pieces/Black_Bishop.png'
    this.pieces.set(new Bishop("Black_Bishop", new Coordinate(5, 0)), black_bishop2)
    let black_knight1 = new Image()
    black_knight1.src = 'Pieces/Black_Knight.png'
    this.pieces.set(new Knight("Black_Knight", new Coordinate(1, 0)), black_knight1)
    let black_knight2 = new Image()
    black_knight2.src = 'Pieces/Black_Knight.png'
    this.pieces.set(new Knight("Black_Knight", new Coordinate(6, 0)), black_knight2)
    let black_rook1 = new Image()
    black_rook1.src = 'Pieces/Black_Rook.png'
    this.pieces.set(new Rook("Black_Rook", new Coordinate(0, 0)), black_rook1)
    let black_rook2 = new Image()
    black_rook2.src = 'Pieces/Black_Rook.png'
    this.pieces.set(new Rook("Black_Rook", new Coordinate(7, 0)), black_rook2)

    if(drawFlag) {
      for(let i = 0; i < 8; i++) {
        for(let j = 0; j < 8; j++) {
          this.drawSquare(i, j, '#deb887', '#8b6914')
        }
      }
      for(let [piece, image] of this.pieces) {
        image.onload = function() {
          ctx.drawImage(image, piece.coordinate.x * size, piece.coordinate.y * size, size, size)
        }
      }
    }
  }

  // Draw current board along with indicators for legal moves
  drawBoard(legal_moves) {
    for(let i = 0; i < 8; i++) {
     for(let j = 0; j < 8; j++) {
       this.drawSquare(i, j, '#deb887', '#8b6914')
     }
   }
   for(let move of legal_moves) {
     this.drawSquare(move.x, move.y, '#beb4a7', '#5b5443')
   }
   for(let [piece, image] of this.pieces) {
     ctx.drawImage(image, piece.coordinate.x * size, piece.coordinate.y * size, size, size)
   }
 }
}

class Coordinate {
  constructor(x, y) {
    this.x = x
    this.y = y
    if(x < 0 || x > 7 || y < 0 || y > 7) {
      this.x = -1, this.y = -1
    }
  }
  deepCopy() {
    return new Coordinate(this.x, this.y)
  }
  equals(new_coordinate) {
    return (new_coordinate.x !== undefined && new_coordinate.y !== undefined &&
      new_coordinate.x === this.x && new_coordinate.y === this.y)
  }
  reset() {
    this.x = -1, this.y = -1
  }
}

class Pawn {
  constructor(piece_name, coordinate) {
    this.piece_name = piece_name
    this.coordinate = coordinate
    this.color = piece_name.split("_")[0]
    this.move_history = []
  }

  deepCopy() {
    let copy = new Pawn(this.piece_name, this.coordinate)
    let copy_move_history = []
    for(let [pos1, pos2] of this.move_history) {
      copy_move_history.push([pos1, pos2])
    }
    copy.move_history = copy_move_history
    return copy
  }

  getLegalMoves(board, ignore_turn_number) {
    let legal_moves = []
    let x = this.coordinate.x, y = this.coordinate.y
    if(this.color == "White") {
      if(!ignore_turn_number && (board.turn_number % 2 == 0)) {
        return legal_moves
      }
      let move_check = board.getPieceByCoordinate(new Coordinate(x, y - 2))
      if(this.move_history.length === 0 && (move_check === -1)) {
        legal_moves.push(new Coordinate(x, y - 2))
      }
      // En-passant
      let left_pawn = board.getPieceByCoordinate(new Coordinate(x - 1, y))
      let right_pawn = board.getPieceByCoordinate(new Coordinate(x + 1, y))
      if((left_pawn !== -1) && (left_pawn.color === "Black")) {
        if(left_pawn.move_history.length === 1 &&
          left_pawn.move_history[0][0].y - left_pawn.move_history[0][1].y === -2) {
          legal_moves.push(new Coordinate(x - 1, y - 1))
          board.en_passant = left_pawn.coordinate
        }
      }
      if((right_pawn !== -1) && (right_pawn.color === "Black")) {
        if(right_pawn.move_history.length === 1 &&
          right_pawn.move_history[0][0].y - right_pawn.move_history[0][1].y === -2) {
          legal_moves.push(new Coordinate(x + 1, y - 1))
          board.en_passant = right_pawn.coordinate
        }
      }
      // Capture
      let capture_check = board.getPieceByCoordinate(new Coordinate(x + 1, y - 1))
      if((capture_check !== -1) && (capture_check.color == "Black")) {
          legal_moves.push(new Coordinate(x + 1, y - 1))
      }
      capture_check = board.getPieceByCoordinate(new Coordinate(x - 1, y - 1))
      if((capture_check !== -1) && (capture_check.color == "Black")) {
          legal_moves.push(new Coordinate(x - 1, y - 1))
      }
      capture_check = board.getPieceByCoordinate(new Coordinate(x, y - 1))
      if(capture_check === -1) {
        legal_moves.push(new Coordinate(x, y - 1))
      }
      // Pawn Promotion
      for(let move of legal_moves) {
        if(move.y === 0) {
          board.pawn_promotion = this
        }
      }
      return legal_moves
    } else if(this.color == "Black") {
      if(!ignore_turn_number && (board.turn_number % 2 != 0)) {
        return legal_moves
      }
      let move_check = board.getPieceByCoordinate(new Coordinate(x, y + 2))
      if(this.move_history.length === 0 && (move_check === -1)) {
        legal_moves.push(new Coordinate(x, y + 2))
      }
      // En-passant
      let left_pawn = board.getPieceByCoordinate(new Coordinate(x - 1, y))
      let right_pawn = board.getPieceByCoordinate(new Coordinate(x + 1, y))
      if((left_pawn !== -1) && (left_pawn.color === "White")) {
        if(left_pawn.move_history.length === 1 &&
          left_pawn.move_history[0][0].y - left_pawn.move_history[0][1].y === 2) {
          legal_moves.push(new Coordinate(x - 1, y + 1))
          board.en_passant = left_pawn.coordinate
        }
      }
      if((right_pawn !== -1) && (right_pawn.color === "White")) {
        if(right_pawn.move_history.length === 1 &&
          right_pawn.move_history[0][0].y - right_pawn.move_history[0][1].y === 2) {
          legal_moves.push(new Coordinate(x + 1, y + 1))
          board.en_passant = right_pawn.coordinate
        }
      }
      // Capture
      let capture_check = board.getPieceByCoordinate(new Coordinate(x + 1, y + 1))
      if((capture_check !== -1) && (capture_check.color == "White")) {
          legal_moves.push(new Coordinate(x + 1, y + 1))
      }
      capture_check = board.getPieceByCoordinate(new Coordinate(x - 1, y + 1))
      if((capture_check !== -1) && (capture_check.color == "White")) {
          legal_moves.push(new Coordinate(x - 1, y + 1))
      }
      capture_check = board.getPieceByCoordinate(new Coordinate(x, y + 1))
      if(capture_check === -1) {
        legal_moves.push(new Coordinate(x, y + 1))
      }
      // Pawn Promotion
      for(let move of legal_moves) {
        if(move.y === 7) {
          board.pawn_promotion = this
        }
      }
      return legal_moves
    } else {
      throw "ERROR: Pawn error!"
    }
  }
}

class King {
  constructor(piece_name, coordinate) {
    this.piece_name = piece_name
    this.coordinate = coordinate
    this.color = piece_name.split("_")[0]
    this.move_history = []
  }

  deepCopy() {
    let copy = new King(this.piece_name, this.coordinate)
    let copy_move_history = []
    for(let [pos1, pos2] of this.move_history) {
      copy_move_history.push([pos1, pos2])
    }
    copy.move_history = copy_move_history
    return copy
  }

  // Castle helper for getLegalMoves
  castlingHelper(board) {
    let legal_moves = []
    if(this.move_history.length === 0) {
      let right_castle_available = true, left_castle_available = true
      let rook_name = this.color + "_Rook"
      let castle_y = (this.color === "White") ? 7 : 0
      for(let [piece, move_list] of board.move_history) {
        if(piece.piece_name === rook_name) {
          if(piece.side === "Right") {
            right_castle_available = false
          } else {
            left_castle_available = false
          }
        }
      }
      if(right_castle_available &&
        (board.getPieceByCoordinate(new Coordinate(6, castle_y)) === -1) &&
        (board.getPieceByCoordinate(new Coordinate(5, castle_y)) === -1)) {
          board.castling = true
          legal_moves.push(new Coordinate(6, castle_y))
      }
      if(left_castle_available &&
        (board.getPieceByCoordinate(new Coordinate(1, castle_y)) === -1) &&
        (board.getPieceByCoordinate(new Coordinate(2, castle_y)) === -1) &&
        (board.getPieceByCoordinate(new Coordinate(3, castle_y)) === -1)) {
          board.castling = true
          legal_moves.push(new Coordinate(2, castle_y))
      }
    }
    return legal_moves
  }

  // Returns list of pieces putting king in check
  getCheckingPieces(board, king_coordinate) {
    let checkList = []
    let king = board.getPieceByCoordinate(king_coordinate)
    let enemy_color = (king.color === "White") ? "Black" : "White"
    for(let [piece, image] of board.pieces) {
      if(piece.color === enemy_color && !piece.piece_name.includes("King")) {
        legal_check:
        for(let move of piece.getLegalMoves(board, true)) {
          if(move.equals(king_coordinate)) {
            checkList.push(piece)
            break legal_check
          }
        }
      }
    }
    return checkList
  }

  // // Removes illegal moves from legal_moves
  illegalMovesHelper(board, legal_moves, king) {
    let legal_king_moves = []
    king_checker:
    for(let move of legal_moves) {
      let future_board = board.deepCopy()
      future_board.updateMoveHistory(this.coordinate, move)
      future_board.updatePieces(this.coordinate, move)
      future_board.turn_number += 1

      // Check if king is in check
      if(this.getCheckingPieces(future_board, move).length === 0) {
        // Check that move is not in range of enemy king
        let enemy_king = -1
        let enemy_color = (king.color === "White") ? "Black" : "White"
        for(let [piece, image] of future_board.pieces) {
          if(piece.piece_name.includes(enemy_color + "_King")) {
            enemy_king = piece
          }
        }
        let x = enemy_king.coordinate.x, y = enemy_king.coordinate.y
        let enemy_king_moves = [
          new Coordinate(x - 1, y - 1), new Coordinate(x, y - 1),
          new Coordinate(x + 1, y - 1), new Coordinate(x - 1, y),
          new Coordinate(x + 1, y), new Coordinate(x - 1, y + 1),
          new Coordinate(x, y + 1), new Coordinate(x + 1, y + 1)
        ]
        for(let enemy_move of enemy_king_moves) {
          if(enemy_move.x !== -1 && move.equals(enemy_move)) {
            continue king_checker
          }
        }
        legal_king_moves.push(move)
      }
    }
    return legal_king_moves
  }

  getLegalMoves(board, ignore_turn_number) {
    let legal_moves = []
    let enemy_color = (this.color == "White") ? "Black" : "White"
    let x = this.coordinate.x, y = this.coordinate.y

    if(!ignore_turn_number) {
      if(this.color == "White" && (board.turn_number % 2 == 0)) {
        return legal_moves
      } else if (this.color == "Black" && (board.turn_number % 2 != 0)) {
        return legal_moves
      }
    }
    // Castling
    legal_moves = legal_moves.concat(this.castlingHelper(board))
    let king_moves = [
      new Coordinate(x - 1, y - 1), new Coordinate(x, y - 1),
      new Coordinate(x + 1, y - 1), new Coordinate(x - 1, y),
      new Coordinate(x + 1, y), new Coordinate(x - 1, y + 1),
      new Coordinate(x, y + 1), new Coordinate(x + 1, y + 1)
    ]
    // Normal moves
    for(let move of king_moves) {
      if(move.x !== -1) {
        let move_check = board.getPieceByCoordinate(move)
        if(move_check === -1 || move_check.color === enemy_color) {
          legal_moves.push(move)
        }
      }
    }
    // Remove illegal moves
    legal_moves = this.illegalMovesHelper(board, legal_moves, this)
    return legal_moves
  }
}

class Queen {
  constructor(piece_name, coordinate) {
    this.piece_name = piece_name
    this.coordinate = coordinate
    this.color = piece_name.split("_")[0]
    this.move_history = []
  }

  deepCopy() {
    let copy = new Queen(this.piece_name, this.coordinate)
    let copy_move_history = []
    for(let [pos1, pos2] of this.move_history) {
      copy_move_history.push([pos1, pos2])
    }
    copy.move_history = copy_move_history
    return copy
  }

  getLegalMoves(board, ignore_turn_number) {
    let hypothetical_bishop = new Bishop(this.color + "_Bishop", this.coordinate)
    let hypothetical_rook = new Rook(this.color + "_Rook", this.coordinate)
    return hypothetical_bishop.getLegalMoves(board, ignore_turn_number).concat(
      hypothetical_rook.getLegalMoves(board, ignore_turn_number)
    )
  }
}

class Bishop {
  constructor(piece_name, coordinate) {
    this.piece_name = piece_name
    this.coordinate = coordinate
    this.color = piece_name.split("_")[0]
    this.move_history = []
  }

  deepCopy() {
    let copy = new Bishop(this.piece_name, this.coordinate)
    let copy_move_history = []
    for(let [pos1, pos2] of this.move_history) {
      copy_move_history.push([pos1, pos2])
    }
    copy.move_history = copy_move_history
    return copy
  }

  getLegalMoves(board, ignore_turn_number) {
    let legal_moves = []
    let enemy_color = (this.color == "White") ? "Black" : "White"
    let x = this.coordinate.x, y = this.coordinate.y

    if(!ignore_turn_number) {
      if(this.color == "White" && (board.turn_number % 2 == 0)) {
        return legal_moves
      } else if (this.color == "Black" && (board.turn_number % 2 != 0)) {
        return legal_moves
      }
    }

    down_left:
    for(let cy = y + 1, cx = x - 1; cy < 8 && cx >= 0; cy++) {
      let move_check = board.getPieceByCoordinate(new Coordinate(cx, cy))
      if(move_check === -1) {
        legal_moves.push(new Coordinate(cx, cy))
      } else {
        if(move_check.color == enemy_color) {
          legal_moves.push(new Coordinate(cx, cy))
        }
        break down_left
      }
      cx--
    }
    up_right:
    for(let cy = y - 1, cx = x + 1; cy >= 0 && cx < 8; cy--) {
      let move_check = board.getPieceByCoordinate(new Coordinate(cx, cy))
      if(move_check === -1) {
        legal_moves.push(new Coordinate(cx, cy))
      } else {
        if(move_check.color == enemy_color) {
          legal_moves.push(new Coordinate(cx, cy))
        }
        break up_right
      }
      cx++
    }
    down_right:
    for(let cy = y + 1, cx = x + 1; cy < 8 && cx < 8; cy++) {
      let move_check = board.getPieceByCoordinate(new Coordinate(cx, cy))
      if(move_check === -1) {
        legal_moves.push(new Coordinate(cx, cy))
      } else {
        if(move_check.color == enemy_color) {
          legal_moves.push(new Coordinate(cx, cy))
        }
        break down_right
      }
      cx++
    }
    up_left:
    for(let cy = y - 1, cx = x - 1; cy >= 0 && cx >= 0; cy--) {
      let move_check = board.getPieceByCoordinate(new Coordinate(cx, cy))
      if(move_check === -1) {
        legal_moves.push(new Coordinate(cx, cy))
      } else {
        if(move_check.color == enemy_color) {
          legal_moves.push(new Coordinate(cx, cy))
        }
        break up_left
      }
      cx--
    }
    return legal_moves
  }
}

class Knight {
  constructor(piece_name, coordinate) {
    this.piece_name = piece_name
    this.coordinate = coordinate
    this.color = piece_name.split("_")[0]
    this.move_history = []
  }

  deepCopy() {
    let copy = new Knight(this.piece_name, this.coordinate)
    let copy_move_history = []
    for(let [pos1, pos2] of this.move_history) {
      copy_move_history.push([pos1, pos2])
    }
    copy.move_history = copy_move_history
    return copy
  }

  getLegalMoves(board, ignore_turn_number) {
    let legal_moves = [], x = this.coordinate.x, y = this.coordinate.y
    let enemy_color = (this.color == "White") ? "Black" : "White"

    if(!ignore_turn_number) {
      if(this.color == "White" && (board.turn_number % 2 == 0)) {
        return legal_moves
      } else if (this.color == "Black" && (board.turn_number % 2 != 0)) {
        return legal_moves
      }
    }

    // List of possible knight moves
    let knightMoves = [
      new Coordinate(x + 1, y - 2), new Coordinate(x + 2, y - 1),
      new Coordinate(x + 2, y + 1), new Coordinate(x + 1, y + 2),
      new Coordinate(x - 1, y + 2), new Coordinate(x - 2, y + 1),
      new Coordinate(x - 2, y + 1), new Coordinate(x - 1, y - 2)
    ]
    for(let move of knightMoves) {
      if(move.x !== -1) {
        let capture_check = board.getPieceByCoordinate(move)
        if(capture_check.color != this.color) {
          legal_moves.push(move)
        }
      }
    }
    return legal_moves
  }
}

class Rook {
  constructor(piece_name, coordinate) {
    this.piece_name = piece_name
    this.coordinate = coordinate
    this.color = piece_name.split("_")[0]
    this.side = (coordinate.x === 7) ? "Right" : "Left"
    this.move_history = []
  }

  deepCopy() {
    let copy = new Rook(this.piece_name, this.coordinate)
    let copy_move_history = []
    for(let [pos1, pos2] of this.move_history) {
      copy_move_history.push([pos1, pos2])
    }
    copy.move_history = copy_move_history
    return copy
  }

  getLegalMoves(board, ignore_turn_number) {
    let legal_moves = []
    let enemy_color = (this.color == "White") ? "Black" : "White"
    let x = this.coordinate.x, y = this.coordinate.y

    if(!ignore_turn_number) {
      if(this.color == "White" && (board.turn_number % 2 == 0)) {
        return legal_moves
      } else if (this.color == "Black" && (board.turn_number % 2 != 0)) {
        return legal_moves
      }
    }

    down:
    for(let cy = y + 1; cy < 8; cy++) {
      let move_check = board.getPieceByCoordinate(new Coordinate(x, cy))
      if(move_check === -1) {
        legal_moves.push(new Coordinate(x, cy))
      } else {
        if(move_check.color == enemy_color) {
          legal_moves.push(new Coordinate(x, cy))
        }
        break down
      }
    }
    up:
    for(let cy = y - 1; cy >= 0; cy--) {
      let move_check = board.getPieceByCoordinate(new Coordinate(x, cy))
      if(move_check === -1) {
        legal_moves.push(new Coordinate(x, cy))
      } else {
        if(move_check.color == enemy_color) {
          legal_moves.push(new Coordinate(x, cy))
        }
        break up
      }
    }
    right:
    for(let cx = x + 1; cx < 8; cx++) {
      let move_check = board.getPieceByCoordinate(new Coordinate(cx, y))
      if(move_check === -1) {
        legal_moves.push(new Coordinate(cx, y))
      } else {
        if(move_check.color == enemy_color) {
          legal_moves.push(new Coordinate(cx, y))
        }
        break right
      }
    }
    left:
    for(let cx = x - 1; cx >= 0; cx--) {
      let move_check = board.getPieceByCoordinate(new Coordinate(cx, y))
      if(move_check === -1) {
        legal_moves.push(new Coordinate(cx, y))
      } else {
        if(move_check.color == enemy_color) {
          legal_moves.push(new Coordinate(cx, y))
        }
        break left
      }
    }
    return legal_moves
  }
}

class Chess {
  constructor() {
    this.board = new Board(true)
    this.displayUI(this.board)
    this.board_history = []
    // this.player_color = (Math.random() >= 0.5) ? "White" : "Black"
  }

  run() {
    let chess = this, board = this.board
    let previous_coordinate = new Coordinate(-1, -1)
    let second_click = false, legal_moves = [], promote_flag = false

    let back_button = document.getElementById("BackButton").onclick =
      function() {
        if(board.turn_number > 1) {
          board = chess.board_history[board.turn_number - 2]
          chess.board_history.pop()
          board.drawBoard([])
          chess.displayUI(board, previous_coordinate)
        }
      }
    let reset_button = document.getElementById("ResetButton").onclick =
      function() {
        this.board_history = []
        this.board = new Board(true)
        chess.displayUI(this.board, undefined, true)
      }
    // Watch for clicks on coordinates
    canvas.addEventListener('click', function(event) {
      let canx = event.pageX - canvas.offsetLeft + canvas.clientLeft
      let cany = event.pageY - canvas.offsetTop + canvas.clientTop
      // Converts x-y coordinates to grid coordinates (to-scale)
      let clicked_coordinate = new Coordinate(Math.floor(canx / size * 10), Math.floor(cany / size * 10))
      let clicked_piece = board.getPieceByCoordinate(clicked_coordinate)

      // Pawn_promotion_check
      if(promote_flag) {
        chess.board_history.push(board.deepCopy())
        promote_flag = board.select_pawn_promotion_handler(clicked_coordinate, canx, cany)
        board.pawn_promotion = new Pawn("", new Coordinate(-1, -1))
        board.drawBoard([])
        chess.displayUI(board, clicked_coordinate)
      } else if((second_click || (clicked_piece !== -1)) && !promote_flag) {
        // Check if clicked coordinate is a legal move
        if(legal_moves.some(function(legal_move) {
          if(clicked_coordinate.equals(legal_move)) { return legal_move }
        }) && second_click && previous_coordinate.x !== -1) {
          chess.board_history.push(board.deepCopy())
          board.getPieceByCoordinate(previous_coordinate)
            .move_history.push([previous_coordinate.deepCopy(), clicked_coordinate.deepCopy()])
          if(board.en_passant.x !== -1 && board.en_passant.y !== -1) {
            let shift = (clicked_coordinate.y - previous_coordinate.y < 0) ? 1 : -1
            let target_location = clicked_coordinate.deepCopy()
            target_location.y += shift
            if(board.en_passant.equals(target_location)) {
              board.deletePiece(board.en_passant)
            }
            board.en_passant = new Coordinate(-1, -1)
          }
          board.updateMoveHistory(previous_coordinate, clicked_coordinate)
          board.updatePieces(previous_coordinate, clicked_coordinate)
          if(board.draw_pawn_promotion_options(clicked_coordinate)) {
            promote_flag = true
          }
          board.turn_number += 1
          second_click = false, previous_coordinate.reset()
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          board.drawBoard([])
          chess.displayUI(board, clicked_coordinate)
        } else if(clicked_piece !== -1) {
          board.checkmateHandler()
          second_click = true, previous_coordinate = clicked_coordinate
          legal_moves = clicked_piece.getLegalMoves(board, false)
          legal_moves = board.removeIllegalMoves(board, clicked_piece, legal_moves)
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          board.drawBoard(legal_moves)
        }
      }
    }, false);
  }

  displayUI(board, clicked_coordinate, reset) {
    let white_box = document.getElementById("WhiteText").innerHTML = "White"
    let black_box = document.getElementById("BlackText").innerHTML = "Black"
    let move_box = document.getElementById("MoveText").innerHTML = "Turn " +
      (Math.floor(board.turn_number / 2) === 0 ? "1" : Math.floor(board.turn_number / 2))
    let options_box = document.getElementById("OptionsText").innerHTML = "Board Controls"

    let clicked_history = board.getMoveHistory(clicked_coordinate)
    if(clicked_history.length !== 0) {
      let recent_move = clicked_history[clicked_history.length - 1]
      let clicked_piece = board.getPieceByCoordinate(clicked_coordinate)
      if(this.board.turn_number % 2 === 0) {
        let white_moves = document.getElementById("WhiteMoves").innerHTML =
          clicked_piece.piece_name + " moves to (" + recent_move.x + ", " + recent_move.y + ")"
      } else {
        let black_moves = document.getElementById("BlackMoves").innerHTML =
          clicked_piece.piece_name + " moves to (" + recent_move.x + ", " + recent_move.y + ")"
      }
    }
    if(reset) {
      console.log("a")
      let white_moves = document.getElementById("WhiteMoves").innerHTML = "WhiteMoves"
      let black_moves = document.getElementById("BlackMoves").innerHTML = "BlackMoves"
    }
  }
}

let game_instance = new Chess()
game_instance.run()
