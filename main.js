// TODO: Make king unable to move to spaces where it can be captured.

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

// Returns legal moves given a coordinate of a piece
function getLegalMoves(prevCoor) {
  let currPiece = pieceMap.get(prevCoor)
  let validMove = false
  let legalMoves = []

  // Check that right player is making moves
  if(currPiece.src.includes("White") && (turnNum % 2 == 0)) {
    return legalMoves
  }
  if(currPiece.src.includes("Black") && (turnNum % 2 != 0)) {
    return legalMoves
  }

  // Legal move checking for pieces
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
      for(rookMoves in moveHistory.get("White_Rook")) {
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
      if(rightCastleAvail && !pieceMap.has("76") && !pieceMap.has("75")) {
        legalMoves.push("C76")
      }
      if(leftCastleAvail && !pieceMap.has("71") && !pieceMap.has("72") && !pieceMap.has("73")) {
        legalMoves.push("C71")
      }
    }
    if(!pieceMap.has((prevCoor[0] - 1).toString() + (prevCoor[1] - 1)) ||
        pieceMap.get((prevCoor[0] - 1).toString() + (prevCoor[1] - 1)).src.includes("Black")) {
      legalMoves.push((prevCoor[0] - 1).toString() + (prevCoor[1] - 1))
    }
    if(!pieceMap.has((prevCoor[0] - 1) + prevCoor[1]) ||
        (pieceMap.get((prevCoor[0] - 1) + prevCoor[1]).src.includes("Black"))) {
      legalMoves.push((prevCoor[0] - 1) + prevCoor[1])
    }
    if(!pieceMap.has((prevCoor[0] - 1).toString() + (parseInt(prevCoor[1]) + 1)) ||
        pieceMap.get((prevCoor[0] - 1).toString() + (parseInt(prevCoor[1]) + 1)).src.includes("Black")) {
      legalMoves.push((prevCoor[0] - 1).toString() + (parseInt(prevCoor[1]) + 1))
    }
    if(!pieceMap.has(prevCoor[0] + (prevCoor[1] - 1)) ||
        pieceMap.get(prevCoor[0] + (prevCoor[1] - 1)).src.includes("Black")) {
      legalMoves.push(prevCoor[0] + (prevCoor[1] - 1))
    }
    if(!pieceMap.has(prevCoor[0] + (parseInt(prevCoor[1]) + 1)) ||
        pieceMap.get(prevCoor[0] + (parseInt(prevCoor[1]) + 1)).src.includes("Black")) {
      legalMoves.push(prevCoor[0] + (parseInt(prevCoor[1]) + 1))
    }
    if(!pieceMap.has((parseInt(prevCoor[0]) - 1).toString() + (prevCoor[1] - 1)) ||
        pieceMap.get((parseInt(prevCoor[0]) - 1).toString() + (prevCoor[1] - 1)).src.includes("Black")) {
      legalMoves.push((parseInt(prevCoor[0]) - 1).toString() + (prevCoor[1] - 1))
    }
    if(!pieceMap.has((parseInt(prevCoor[0]) - 1) + prevCoor[1]) ||
        pieceMap.get((parseInt(prevCoor[0]) - 1) + prevCoor[1]).src.includes("Black")) {
      legalMoves.push((parseInt(prevCoor[0]) - 1) + prevCoor[1])
    }
    if(!pieceMap.has((parseInt(prevCoor[0]) - 1).toString() + (parseInt(prevCoor[1]) + 1)) ||
        pieceMap.get((parseInt(prevCoor[0]) - 1).toString() + (parseInt(prevCoor[1]) + 1)).src.includes("Black")) {
      legalMoves.push((parseInt(prevCoor[0]) - 1).toString() + (parseInt(prevCoor[1]) + 1))
    }
    return legalMoves
  } else if (currPiece.src.includes("White_Queen")) {

  } else if (currPiece.src.includes("White_Bishop")) {

  } else if (currPiece.src.includes("White_Knight")) {

  } else if (currPiece.src.includes("White_Rook")) {
    down:
    for(let y = parseInt(prevCoor[0]) + 1; y < 8; y++) {
      if(!pieceMap.has(y + prevCoor[1])) {
        legalMoves.push(y + prevCoor[1])
      } else {
        legalMoves.push(y + prevCoor[1])
        break down
      }
    }
    up:
    for(let y = prevCoor[0] - 1; y >= 0; y--) {
      if(!pieceMap.has(y + prevCoor[1])) {
        legalMoves.push(y + prevCoor[1])
      } else {
        legalMoves.push(y + prevCoor[1])
        break up
      }
    }
    right:
    for(let x = parseInt(prevCoor[1]) + 1; x < 8; x++) {
      if(!pieceMap.has(prevCoor[0] + x)) {
        legalMoves.push(prevCoor[0] + x)
      } else {
        legalMoves.push(prevCoor[0] + x)
        break right
      }
    }
    left:
    for(let x = prevCoor[1] - 1; x >= 0; x--) {
      if(!pieceMap.has(prevCoor[0] + x)) {
        legalMoves.push(prevCoor[0] + x)
      } else {
        legalMoves.push(prevCoor[0] + x)
        break left
      }
    }
    return legalMoves
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

  } else if (currPiece.src.includes("Black_Queen")) {

  } else if (currPiece.src.includes("Black_Bishop")) {

  } else if (currPiece.src.includes("Black_Knight")) {

  } else if (currPiece.src.includes("Black_Rook")) {

  } else {
    return legalMoves
  }
}

function main() {
  initBoard()

  let secondClick = false
  let prevCoor = ""
  let legalMoves = []
  // Watch for clicks on coordinates
  canvas.addEventListener('click', function(event) {
    let x = event.pageX - canvas.offsetLeft + canvas.clientLeft
    let y = event.pageY - canvas.offsetTop + canvas.clientTop
    // Converts x-y coordinates to grid coordinates (to-scale)
    let currCoor = Math.floor(y / size * 10).toString() + Math.floor(x / size * 10)

    // Moves piece from a to b
    if((pieceMap.has(currCoor) && !secondClick) || secondClick) {
      if(secondClick) {
        if(legalMoves.includes(currCoor)) {
          let splitSrc = pieceMap.get(prevCoor).src.split("/")
          let pieceName = splitSrc[splitSrc.length - 1].split(".")[0]
          if(moveHistory.has(pieceName)) {
            moveHistory.get(pieceName).push(prevCoor + ',' + currCoor)
          } else {
            moveHistory.set(pieceName, [prevCoor + "," + currCoor])
          }
          pieceMap.set(currCoor, pieceMap.get(prevCoor))
          pieceMap.delete(prevCoor)
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          drawBoard([])
          turnNum += 1
        }
        secondClick = false
        prevCoor = ""
      } else {
        secondClick = true
        prevCoor = currCoor
        legalMoves = getLegalMoves(prevCoor)
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        drawBoard(legalMoves)
      }
    }
  }, false);
}

main()
