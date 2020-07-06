/*
  TODO
  0. IMPLEMENT: En-passant
  1. IMPLEMENT: Checkmate stuff
  2. IMEPLEMENT: Highlight king with red when in check
  3. IMPLEMENT: Displays for turn number and move history
  4. IMEPLEMENT: Basic random computer AI
  5. IMPLEMENT: Computer AI w/ min-max alpha-beta.
*/

var canvas = document.getElementById('myCanvas')
var ctx = canvas.getContext('2d')

// Increases resolution of canvas
var scale = 10
canvas.width = 750 * scale
canvas.height = 750 * scale
var size = 937.5 // (Size of canvas (CSS) * scale) / Number of columns (8)

var pieceMap = new Map() // Stores piece locations
var turnNum = 1
var moveHistory = new Map()
var castling = false

// Draws a single square in chess bord
function drawSquare(i, j, lightColor, darkColor) {
  ctx.beginPath()
  ctx.rect(i * size, j * size, size, size)
  if(i & 1) {
    if(j & 1) {
      ctx.fillStyle = lightColor
      ctx.strokeStyle = 'rgb(222,184,135)'
    } else {
      ctx.fillStyle = darkColor
      ctx.strokeStyle = 'rgb(133,94,96)'
    }
  } else {
    if(j & 1) {
      ctx.fillStyle = darkColor
      ctx.strokeStyle = 'rgb(133,94,96)'
    } else {
      ctx.fillStyle = lightColor
      ctx.strokeStyle = 'rgb(222,184,135)'
    }
  }
  ctx.fill()
  ctx.stroke()
}

// Initialize pieceMap
function initPieces() {
  // Value is (y, x) coordinate and zero-indexed.
  for(let i = 0; i < 8; i++) {
    let white_pawn = new Image()
    white_pawn.src = 'Pieces/White_Pawn.png'
    let black_pawn = new Image()
    black_pawn.src = 'Pieces/Black_Pawn.png'
    pieceMap.set("6" + i, white_pawn)
    pieceMap.set("1" + i, black_pawn)
  }
  let white_king = new Image()
  white_king.src = 'Pieces/White_King.png'
  pieceMap.set("74", white_king)
  let white_queen = new Image()
  white_queen.src = 'Pieces/White_Queen.png'
  pieceMap.set("73", white_queen)
  let white_bishop1 = new Image()
  white_bishop1.src = 'Pieces/White_Bishop.png'
  pieceMap.set("72", white_bishop1)
  let white_bishop2 = new Image()
  white_bishop2.src = 'Pieces/White_Bishop.png'
  pieceMap.set("75", white_bishop2)
  let white_knight1 = new Image()
  white_knight1.src = 'Pieces/White_Knight.png'
  pieceMap.set("71", white_knight1)
  let white_knight2 = new Image()
  white_knight2.src = 'Pieces/White_Knight.png'
  pieceMap.set("76", white_knight2)
  let white_rook1 = new Image()
  white_rook1.src = 'Pieces/White_Rook.png'
  pieceMap.set("70", white_rook1)
  let white_rook2 = new Image()
  white_rook2.src = 'Pieces/White_Rook.png'
  pieceMap.set("77", white_rook2)

  let black_king = new Image()
  black_king.src = 'Pieces/Black_King.png'
  pieceMap.set("04", black_king)
  let black_queen = new Image()
  black_queen.src = 'Pieces/Black_Queen.png'
  pieceMap.set("03", black_queen)
  let black_bishop1 = new Image()
  black_bishop1.src = 'Pieces/Black_Bishop.png'
  pieceMap.set("02", black_bishop1)
  let black_bishop2 = new Image()
  black_bishop2.src = 'Pieces/Black_Bishop.png'
  pieceMap.set("05", black_bishop2)
  let black_knight1 = new Image()
  black_knight1.src = 'Pieces/Black_Knight.png'
  pieceMap.set("01", black_knight1)
  let black_knight2 = new Image()
  black_knight2.src = 'Pieces/Black_Knight.png'
  pieceMap.set("06", black_knight2)
  let black_rook1 = new Image()
  black_rook1.src = 'Pieces/Black_Rook.png'
  pieceMap.set("00", black_rook1)
  let black_rook2 = new Image()
  black_rook2.src = 'Pieces/Black_Rook.png'
  pieceMap.set("07", black_rook2)
}

// Initializes board
function initBoard() {
  initPieces()
  let color = true
  for(let i = 0; i < 8; i++) {
    for(let j = 0; j < 8; j++) {
      drawSquare(i, j, '#deb887', '#8b6914')
    }
  }
  for(let [coordinate, piece] of pieceMap) {
    piece.onload = function() {
      ctx.drawImage(piece, coordinate[1] * size, coordinate[0] * size, size, size)
    }
  }
}

// Draws current board
function drawBoard(legalMoves) {
  let color = true
  for(let i = 0; i < 8; i++) {
    for(let j = 0; j < 8; j++) {
      if(legalMoves.includes(j.toString() + i)) {
        drawSquare(i, j, '#beb4a7', '	#5b5443')
      } else {
        drawSquare(i, j, '#deb887', '#8b6914')
      }
    }
  }
  for(let [coordinate, piece] of pieceMap) {
    ctx.drawImage(piece, coordinate[1] * size, coordinate[0] * size, size, size)
  }
}

// Removes illegal moves from king's legal moves
function kingMoveCheck(legalMoves, prevCoor) {
  let kingLegalMoves = legalMoves
  let enemyColor = "", enemyPawn = "", enemyKing = ""
  // Check king color
  if(pieceMap.get(prevCoor).src.includes("White")) {
    enemyColor = "Black", enemyPawn = "Black_Pawn", enemyKing = "Black_King"
  } else {
    enemyColor = "White", enemyPawn = "White_Pawn", enemyKing = "White_King"
  }

  // Loop through all pieces on board
  for(const [coordinate, piece] of pieceMap.entries()) {
    if(piece.src.includes(enemyColor)) {
      // Filter out illegal moves caused by enemy pawns
      if(piece.src.includes(enemyPawn)) {
        kingLegalMoves = kingLegalMoves.filter(function(ele) {
          if(((parseInt(coordinate[0]) + 1) == ele[0]) &&
             ((parseInt(coordinate[1]) + 1) == ele[1])) {
               return
          } else if(((parseInt(coordinate[0]) + 1) == ele[0]) &&
             ((parseInt(coordinate[1]) - 1) == ele[1])) {
               return
          }
          return ele
        })
      }
      // Filter out illegal moves caused by enemy king
      else if(piece.src.includes(enemyKing)) {
        kingLegalMoves = kingLegalMoves.filter(function(ele) {
          if(((parseInt(coordinate[0]) - 1) == ele[0]) &&
             ((parseInt(coordinate[1]) - 1) == ele[1])) {
               return
          } else if(((parseInt(coordinate[0]) - 1) == ele[0]) &&
             ((parseInt(coordinate[1])) == ele[1])) {
               return
          } else if(((parseInt(coordinate[0]) - 1) == ele[0]) &&
             ((parseInt(coordinate[1]) + 1) == ele[1])) {
               return
          } else if(((parseInt(coordinate[0])) == ele[0]) &&
             ((parseInt(coordinate[1]) - 1) == ele[1])) {
               return
          } else if(((parseInt(coordinate[0])) == ele[0]) &&
             ((parseInt(coordinate[1]) + 1) == ele[1])) {
               return
          } else if(((parseInt(coordinate[0]) + 1) == ele[0]) &&
             ((parseInt(coordinate[1]) - 1) == ele[1])) {
               return
          } else if(((parseInt(coordinate[0]) + 1) == ele[0]) &&
             ((parseInt(coordinate[1])) == ele[1])) {
               return
          } else if(((parseInt(coordinate[0]) + 1) == ele[0]) &&
             ((parseInt(coordinate[1]) + 1) == ele[1])) {
               return
          }
          return ele
        })
      } else {
        // Filter out illegal moves caused by everything else
        let legalCheck = getLegalMoves(coordinate, true)
        kingLegalMoves = kingLegalMoves.filter(ele => !legalCheck.includes(ele))
      }
    }
  }
  return kingLegalMoves
}

// Returns list of pieces (coordinates) that are putting king in check
function getCheckPieces(kingLoc, kingLegalMoves, enemyColor) {
  let checkPieces = []
  for(const [coordinate, piece] of pieceMap.entries()) {
    if(piece.src.includes(enemyColor)) {
      if(getLegalMoves(piece).includes(kingLoc)) {
        checkPieces.push(coordinate)
      }
    }
  }
  return checkPieces
}

// King cannot move. Finds if player can move any other piece
function checkMateHandler(kingLoc, kingLegalMoves, allyColor) {
  let allyKing = (allyColor == "White") ? "White_King" : "Black_King"
  let enemyColor = (allyColor == "White") ? "White" : "Black"
  for(const [coordinate, piece] of pieceMap.entries()) {
    if(piece.src.includes(allyColor) && !piece.src.includes(allyKing)) {
      let pieceLegalMoves = getLegalMoves(piece)
      let checkPieces = getCheckPieces(kingLoc, kingLegalMoves, enemyColor)
      // Check if piece doing legal move makes king able to move

      // If after iterating through all, no move can be found, checkmate.
    }
  }
}

// Handles bishop piece logic
function bishopHandler(prevCoor, legalMoves, enemyColor) {
  downLeft:
  for(let y = parseInt(prevCoor[0]) + 1, x = parseInt(prevCoor[1]) - 1; y < 8 && x >= 0; y++) {
    if(!pieceMap.has(y + x.toString())) {
      legalMoves.push(y + x.toString())
    } else {
      if(pieceMap.get(y + x.toString()).src.includes(enemyColor)) {
        legalMoves.push(y + x.toString())
      }
      break downLeft
    }
    x--
  }
  upRight:
  for(let y = parseInt(prevCoor[0]) - 1, x = parseInt(prevCoor[1]) + 1; y >= 0 && x < 8; y--) {
    if(!pieceMap.has(y + x.toString())) {
      legalMoves.push(y + x.toString())
    } else {
      if(pieceMap.get(y + x.toString()).src.includes(enemyColor)) {
        legalMoves.push(y + x.toString())
      }
      break upRight
    }
    x++
  }
  downRight:
  for(let y = parseInt(prevCoor[0]) + 1, x = parseInt(prevCoor[1]) + 1; y < 8 && x < 8; y++) {
    if(!pieceMap.has(y + x.toString())) {
      legalMoves.push(y + x.toString())
    } else {
      if(pieceMap.get(y + x.toString()).src.includes(enemyColor)) {
        legalMoves.push(y + x.toString())
      }
      break downRight
    }
    x++
  }
  upLeft:
  for(let y = parseInt(prevCoor[0]) - 1, x = parseInt(prevCoor[1]) - 1; y >= 0 && x >= 0; y--) {
    if(!pieceMap.has(y + x.toString())) {
      legalMoves.push(y + x.toString())
    } else {
      if(pieceMap.get(y + x.toString()).src.includes(enemyColor)) {
        legalMoves.push(y + x.toString())
      }
      break upLeft
    }
    x--
  }
  return legalMoves
}

// Handles knight piece logic
function knightHandler(prevCoor, legalMoves, enemyColor) {
  // List of possible knight moves
  let knightMoves = [
    parseInt(prevCoor[0]) - 2 + (parseInt(prevCoor[1]) + 1).toString(),
    parseInt(prevCoor[0]) - 1 + (parseInt(prevCoor[1]) + 2).toString(),
    parseInt(prevCoor[0]) + 1 + (parseInt(prevCoor[1]) + 2).toString(),
    parseInt(prevCoor[0]) + 2 + (parseInt(prevCoor[1]) + 1).toString(),
    parseInt(prevCoor[0]) + 2 + (parseInt(prevCoor[1]) - 1).toString(),
    parseInt(prevCoor[0]) + 1 + (parseInt(prevCoor[1]) - 2).toString(),
    parseInt(prevCoor[0]) - 1 + (parseInt(prevCoor[1]) - 2).toString(),
    parseInt(prevCoor[0]) - 2 + (parseInt(prevCoor[1]) - 1).toString()
  ]
  // Filter out out of bounds moves
  knightMoves = knightMoves.filter(function(ele) {
    if(ele[0] > 7 || ele[0] < 0 || ele[1] > 7 || ele[1] < 0) {
      return
    } else {
      return ele
    }
  })

  for(move of knightMoves) {
    if(!pieceMap.has(move) || pieceMap.get(move).src.includes(enemyColor)) {
      legalMoves.push(move)
    }
  }
  return legalMoves
}

// Handles rook piece logic
function rookHandler(prevCoor, legalMoves, enemyColor) {
  down:
  for(let y = parseInt(prevCoor[0]) + 1; y < 8; y++) {
    if(!pieceMap.has(y + prevCoor[1])) {
      legalMoves.push(y + prevCoor[1])
    } else {
      if(pieceMap.get(y + prevCoor[1]).src.includes(enemyColor)) {
        legalMoves.push(y + prevCoor[1])
      }
      break down
    }
  }
  up:
  for(let y = prevCoor[0] - 1; y >= 0; y--) {
    if(!pieceMap.has(y + prevCoor[1])) {
      legalMoves.push(y + prevCoor[1])
    } else {
      if(pieceMap.get(y + prevCoor[1]).src.includes(enemyColor)) {
        legalMoves.push(y + prevCoor[1])
      }
      break up
    }
  }
  right:
  for(let x = parseInt(prevCoor[1]) + 1; x < 8; x++) {
    if(!pieceMap.has(prevCoor[0] + x)) {
      legalMoves.push(prevCoor[0] + x)
    } else {
      if(pieceMap.get(prevCoor[0] + x).src.includes(enemyColor)) {
        legalMoves.push(prevCoor[0] + x)
      }
      break right
    }
  }
  left:
  for(let x = prevCoor[1] - 1; x >= 0; x--) {
    if(!pieceMap.has(prevCoor[0] + x)) {
      legalMoves.push(prevCoor[0] + x)
    } else {
      if(pieceMap.get(prevCoor[0] + x).src.includes(enemyColor)) {
        legalMoves.push(prevCoor[0] + x)
      }
      break left
    }
  }
  return legalMoves
}

// Returns legal moves given a coordinate of a piece
function getLegalMoves(prevCoor, bypassTurnNum) {
  let currPiece = pieceMap.get(prevCoor)
  let validMove = false
  let legalMoves = []

  // Check for invalid move
  if(!pieceMap.has(prevCoor)) {
    // Invalid move handler
    return legalMoves
  }

  // Check that right player is making moves
  if(!bypassTurnNum && currPiece.src.includes("White") && (turnNum % 2 == 0)) {
    return legalMoves
  }
  if(!bypassTurnNum && currPiece.src.includes("Black") && (turnNum % 2 != 0)) {
    return legalMoves
  }

  // Piece Handling
  if(currPiece.src.includes("White_Pawn")) {
    if(turnNum == 1) {
      legalMoves.push((prevCoor[0] - 2) + prevCoor[1])
    }
    if(pieceMap.has((prevCoor[0] - 1).toString() + (parseInt(prevCoor[1]) + 1)) &&
       pieceMap.get((prevCoor[0] - 1).toString() + (parseInt(prevCoor[1]) + 1)).src.includes("Black")) {
      legalMoves.push((prevCoor[0] - 1).toString() + (parseInt(prevCoor[1]) + 1))
    }
    if(pieceMap.has((prevCoor[0] - 1).toString() + (prevCoor[1] - 1)) &&
       pieceMap.get((prevCoor[0] - 1).toString() + (prevCoor[1] - 1)).src.includes("Black")) {
      legalMoves.push((prevCoor[0] - 1).toString() + (prevCoor[1] - 1))
    }
    if(!pieceMap.has((prevCoor[0] - 1).toString() + prevCoor[1])) {
      legalMoves.push((prevCoor[0] - 1).toString() + prevCoor[1])
    }
    return legalMoves
  } else if (currPiece.src.includes("White_King")) {
    // Castling. Legal move for castling has prefix 'C'.
    castle:
    if(!moveHistory.has("White_King")) {
      let rightCastleAvail = true
      let leftCastleAvail = true
      if(moveHistory.has("White_Rook")) {
        for(rookMoves of moveHistory.get("White_Rook")) {
          if(rookMoves.split(",")[0] == "77") {
            rightCastleAvail = false
          }
          if(rookMoves.split(",")[0] == "70") {
            leftCastleAvail = false
          }
          if(!rightCastleAvail && !leftCastleAvail) {
            break castle
          }
        }
      }
      if(rightCastleAvail && !pieceMap.has("76") && !pieceMap.has("75")) {
        legalMoves.push("76")
        castling = true
      }
      if(leftCastleAvail && !pieceMap.has("71") && !pieceMap.has("72") && !pieceMap.has("73")) {
        legalMoves.push("72")
        castling = true
      }
    }
    // Top Left
    if(!pieceMap.has((prevCoor[0] - 1).toString() + (prevCoor[1] - 1)) ||
        pieceMap.get((prevCoor[0] - 1).toString() + (prevCoor[1] - 1)).src.includes("Black")) {
      legalMoves.push((prevCoor[0] - 1).toString() + (prevCoor[1] - 1))
    }
    // Top
    if(!pieceMap.has((prevCoor[0] - 1) + prevCoor[1]) ||
        (pieceMap.get((prevCoor[0] - 1) + prevCoor[1]).src.includes("Black"))) {
      legalMoves.push((prevCoor[0] - 1) + prevCoor[1])
    }
    // Top Right
    if(!pieceMap.has((prevCoor[0] - 1).toString() + (parseInt(prevCoor[1]) + 1)) ||
        pieceMap.get((prevCoor[0] - 1).toString() + (parseInt(prevCoor[1]) + 1)).src.includes("Black")) {
      legalMoves.push((prevCoor[0] - 1).toString() + (parseInt(prevCoor[1]) + 1))
    }
    // Left
    if(!pieceMap.has(prevCoor[0] + (prevCoor[1] - 1)) ||
        pieceMap.get(prevCoor[0] + (prevCoor[1] - 1)).src.includes("Black")) {
      legalMoves.push(prevCoor[0] + (prevCoor[1] - 1))
    }
    // Right
    if(!pieceMap.has(prevCoor[0] + (parseInt(prevCoor[1]) + 1)) ||
        pieceMap.get(prevCoor[0] + (parseInt(prevCoor[1]) + 1)).src.includes("Black")) {
      legalMoves.push(prevCoor[0] + (parseInt(prevCoor[1]) + 1))
    }
    // Bottom Left
    if(!pieceMap.has((parseInt(prevCoor[0]) + 1).toString() + (prevCoor[1] - 1)) ||
        pieceMap.get((parseInt(prevCoor[0]) + 1).toString() + (prevCoor[1] - 1)).src.includes("Black")) {
      legalMoves.push((parseInt(prevCoor[0]) + 1).toString() + (prevCoor[1] - 1))
    }
    // Bottom
    if(!pieceMap.has((parseInt(prevCoor[0]) + 1) + prevCoor[1]) ||
        pieceMap.get((parseInt(prevCoor[0]) + 1) + prevCoor[1]).src.includes("Black")) {
      legalMoves.push((parseInt(prevCoor[0]) + 1) + prevCoor[1])
    }
    // Bottom Right
    if(!pieceMap.has((parseInt(prevCoor[0]) + 1).toString() + (parseInt(prevCoor[1]) + 1)) ||
        pieceMap.get((parseInt(prevCoor[0]) + 1).toString() + (parseInt(prevCoor[1]) + 1)).src.includes("Black")) {
      legalMoves.push((parseInt(prevCoor[0]) + 1).toString() + (parseInt(prevCoor[1]) + 1))
    }
    // Remove all out of index legal moves
    legalMoves = legalMoves.filter(move => (move[0] <= 7 &&
      move[0] >= 0 && move[1] <= 7 && move[1] >= 0))
    // Remove all illegal moves
    legalMoves = kingMoveCheck(legalMoves, prevCoor)

    // Check for checkmate
    if(legalMoves.length == 0) {
      checkMateHandler(prevCoor, legalMoves, "White")
    }
    return legalMoves
  } else if (currPiece.src.includes("White_Queen")) {
    return bishopHandler(prevCoor, legalMoves, "Black")
    .concat(rookHandler(prevCoor, legalMoves, "Black"))
  } else if (currPiece.src.includes("White_Bishop")) {
    return bishopHandler(prevCoor, legalMoves, "Black")
  } else if (currPiece.src.includes("White_Knight")) {
    return knightHandler(prevCoor, legalMoves, "Black")
  } else if (currPiece.src.includes("White_Rook")) {
    return rookHandler(prevCoor, legalMoves, "Black")
  } else if (currPiece.src.includes("Black_Pawn")) {
    if(turnNum == 2) {
      legalMoves.push((parseInt(prevCoor[0]) + 2) + prevCoor[1])
    }
    if(pieceMap.has((parseInt(prevCoor[0]) + 1).toString() + (parseInt(prevCoor[1]) + 1)) &&
       pieceMap.get((parseInt(prevCoor[0]) + 1).toString() + (parseInt(prevCoor[1]) + 1)).src.includes("White")) {
      legalMoves.push((parseInt(prevCoor[0]) + 1).toString() + (parseInt(prevCoor[1]) + 1))
    }
    if(pieceMap.has((parseInt(prevCoor[0]) + 1).toString() + (parseInt(prevCoor[1] - 1))) &&
       pieceMap.get((parseInt(prevCoor[0]) + 1).toString() + (parseInt(prevCoor[1] - 1))).src.includes("White")) {
      legalMoves.push((parseInt(prevCoor[0]) + 1).toString() + (parseInt(prevCoor[1] - 1)))
    }
    if(!pieceMap.has((parseInt(prevCoor[0]) + 1).toString() + prevCoor[1])) {
      legalMoves.push((parseInt(prevCoor[0]) + 1).toString() + prevCoor[1])
    }
    return legalMoves
  } else if (currPiece.src.includes("Black_King")) {
    // Castling. Legal move for castling has prefix 'C'.
    castle:
    if(!moveHistory.has("Black_King")) {
      let rightCastleAvail = true
      let leftCastleAvail = true
      if(moveHistory.has("Black_Rook")) {
        for(rookMoves of moveHistory.get("Black_Rook")) {
          if(rookMoves.split(",")[0] == "07") {
            rightCastleAvail = false
          }
          if(rookMoves.split(",")[0] == "00") {
            leftCastleAvail = false
          }
          if(!rightCastleAvail && !leftCastleAvail) {
            break castle
          }
        }
      }
      if(rightCastleAvail && !pieceMap.has("06") && !pieceMap.has("05")) {
        legalMoves.push("06")
        castling = true
      }
      if(leftCastleAvail && !pieceMap.has("01") && !pieceMap.has("02") && !pieceMap.has("03")) {
        legalMoves.push("02")
        castling = true
      }
    }
    // Top Left
    if(!pieceMap.has((prevCoor[0] - 1).toString() + (prevCoor[1] - 1)) ||
        pieceMap.get((prevCoor[0] - 1).toString() + (prevCoor[1] - 1)).src.includes("White")) {
      legalMoves.push((prevCoor[0] - 1).toString() + (prevCoor[1] - 1))
    }
    // Top
    if(!pieceMap.has((prevCoor[0] - 1) + prevCoor[1]) ||
        (pieceMap.get((prevCoor[0] - 1) + prevCoor[1]).src.includes("White"))) {
      legalMoves.push((prevCoor[0] - 1) + prevCoor[1])
    }
    // Top Right
    if(!pieceMap.has((prevCoor[0] - 1).toString() + (parseInt(prevCoor[1]) + 1)) ||
        pieceMap.get((prevCoor[0] - 1).toString() + (parseInt(prevCoor[1]) + 1)).src.includes("White")) {
      legalMoves.push((prevCoor[0] - 1).toString() + (parseInt(prevCoor[1]) + 1))
    }
    // Left
    if(!pieceMap.has(prevCoor[0] + (prevCoor[1] - 1)) ||
        pieceMap.get(prevCoor[0] + (prevCoor[1] - 1)).src.includes("White")) {
      legalMoves.push(prevCoor[0] + (prevCoor[1] - 1))
    }
    // Right
    if(!pieceMap.has(prevCoor[0] + (parseInt(prevCoor[1]) + 1)) ||
        pieceMap.get(prevCoor[0] + (parseInt(prevCoor[1]) + 1)).src.includes("White")) {
      legalMoves.push(prevCoor[0] + (parseInt(prevCoor[1]) + 1))
    }
    // Bottom Left
    if(!pieceMap.has((parseInt(prevCoor[0]) + 1).toString() + (prevCoor[1] - 1)) ||
        pieceMap.get((parseInt(prevCoor[0]) + 1).toString() + (prevCoor[1] - 1)).src.includes("White")) {
      legalMoves.push((parseInt(prevCoor[0]) + 1).toString() + (prevCoor[1] - 1))
    }
    // Bottom
    if(!pieceMap.has((parseInt(prevCoor[0]) + 1) + prevCoor[1]) ||
        pieceMap.get((parseInt(prevCoor[0]) + 1) + prevCoor[1]).src.includes("White")) {
      legalMoves.push((parseInt(prevCoor[0]) + 1) + prevCoor[1])
    }
    // Bottom Right
    if(!pieceMap.has((parseInt(prevCoor[0]) + 1).toString() + (parseInt(prevCoor[1]) + 1)) ||
        pieceMap.get((parseInt(prevCoor[0]) + 1).toString() + (parseInt(prevCoor[1]) + 1)).src.includes("White")) {
      legalMoves.push((parseInt(prevCoor[0]) + 1).toString() + (parseInt(prevCoor[1]) + 1))
    }
    // Remove all out of index legal moves
    legalMoves = legalMoves.filter(move => (move[0] <= 7 &&
      move[0] >= 0 && move[1] <= 7 && move[1] >= 0))
    // Remove all illegal moves
    legalMoves = kingMoveCheck(legalMoves, prevCoor)

    // Check for checkmate
    if(legalMoves.length == 0) {
      checkMateHandler(prevCoor, legalMoves, "Black")
    }

    return legalMoves
  } else if (currPiece.src.includes("Black_Queen")) {
    return bishopHandler(prevCoor, legalMoves, "White")
    .concat(rookHandler(prevCoor, legalMoves, "White"))
  } else if (currPiece.src.includes("Black_Bishop")) {
    return bishopHandler(prevCoor, legalMoves, "White")
  } else if (currPiece.src.includes("Black_Knight")) {
    return knightHandler(prevCoor, legalMoves, "White")
  } else if (currPiece.src.includes("Black_Rook")) {
    return rookHandler(prevCoor, legalMoves, "White")
  } else {
    return legalMoves
  }
}

// Handles piece moving logic
function moveHandler() {
  let secondClick = false, prevCoor = "", legalMoves = []
  // Watch for clicks on coordinates
  canvas.addEventListener('click', function(event) {
    let x = event.pageX - canvas.offsetLeft + canvas.clientLeft
    let y = event.pageY - canvas.offsetTop + canvas.clientTop
    // Converts x-y coordinates to grid coordinates (to-scale)
    let currCoor = Math.floor(y / size * 10).toString() + Math.floor(x / size * 10)

    // If piece is clicked or clicking after piece is clicked
    if((pieceMap.has(currCoor) && !secondClick) || secondClick) {
      // If clicking after piece is clicked and move is legal
      if(secondClick && legalMoves.includes(currCoor)) {
        let splitSrc = pieceMap.get(prevCoor).src.split("/")
        let pieceName = splitSrc[splitSrc.length - 1].split(".")[0]
        if(moveHistory.has(pieceName)) {
          moveHistory.get(pieceName).push(prevCoor + ',' + currCoor)
        } else {
          moveHistory.set(pieceName, [prevCoor + "," + currCoor])
        }
        pieceMap.set(currCoor, pieceMap.get(prevCoor))
        pieceMap.delete(prevCoor)
        // Castling
        if(castling) {
          if(currCoor == "76") {
            pieceMap.set("75", pieceMap.get("77"))
            pieceMap.delete("77")
          } else if(currCoor == "72") {
            pieceMap.set("73", pieceMap.get("70"))
            pieceMap.delete("70")
          } else if(currCoor == "06") {
            pieceMap.set("05", pieceMap.get("07"))
            pieceMap.delete("07")
          } else if(currCoor == "02") {
            pieceMap.set("03", pieceMap.get("00"))
            pieceMap.delete("00")
          }
        }
        turnNum += 1
        secondClick = false, castling = false, prevCoor = ""
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        drawBoard([])
      } else {
        // Display legal moves
        secondClick = true, prevCoor = currCoor
        legalMoves = getLegalMoves(prevCoor, false)
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        drawBoard(legalMoves)
      }
    }
  }, false);
}

function main() {
  initBoard()
  moveHandler()
}

main()
