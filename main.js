var canvas = document.getElementById('myCanvas')
var ctx = canvas.getContext('2d')

// Increases resolution of canvas
var scale = 10
canvas.width = 750 * scale
canvas.height = 750 * scale
var size = 937.5 // (Size of canvas (CSS) * scale) / Number of columns (8)

var pieceMap = new Map() // Stores piece locations

// Draws a single square in chess bord
function drawSquare(i, j) {
  ctx.beginPath()
  ctx.rect(i * size, j * size, size, size)
  if(i & 1) {
    if(j & 1) {
      ctx.fillStyle = '#deb887'
      ctx.strokeStyle = 'rgb(222,184,135)'
    } else {
      ctx.fillStyle = '#8b6914'
      ctx.strokeStyle = 'rgb(133,94,96)'
    }
  } else {
    if(j & 1) {
      ctx.fillStyle = '#8b6914'
      ctx.strokeStyle = 'rgb(133,94,96)'
    } else {
      ctx.fillStyle = '#deb887'
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
      drawSquare(i, j)
    }
  }
  for(let [coordinate, piece] of pieceMap) {
    piece.onload = function() {
      ctx.drawImage(piece, coordinate[1] * size, coordinate[0] * size, size, size)
    }
  }
}

// Draws current board
function drawBoard() {
  let color = true
  for(let i = 0; i < 8; i++) {
    for(let j = 0; j < 8; j++) {
      drawSquare(i, j)
    }
  }
  for(let [coordinate, piece] of pieceMap) {
    ctx.drawImage(piece, coordinate[1] * size, coordinate[0] * size, size, size)
  }
}

function main() {
  initBoard()

  let secondClick = false
  let prevCoor = ""
  canvas.addEventListener('click', function(event) {
    let x = event.pageX - canvas.offsetLeft + canvas.clientLeft
    let y = event.pageY - canvas.offsetTop + canvas.clientTop
    let currCoor = Math.floor(y / size * 10).toString() + Math.floor(x / size * 10)

    if((pieceMap.has(currCoor) && !secondClick) || secondClick) {
      if(secondClick) {
        pieceMap.set(currCoor, pieceMap.get(prevCoor))
        pieceMap.delete(prevCoor)
        secondClick = false
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawBoard()
      } else {
        secondClick = true
        prevCoor = currCoor
      }
    }
  }, false);
}

main()
