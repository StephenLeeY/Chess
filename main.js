var canvas = document.getElementById('myCanvas')
var ctx = canvas.getContext('2d')

var scale = 10
canvas.width = 750 * scale
canvas.height = 750 * scale

// (Size of canvas (CSS) * scale) / Number of columns (8)
var size = 937.5

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

// Consider drawing the pieces in HTML and positioning them in JS
function drawPieces() {
  let white_pawn = new Image()
  white_pawn.src = 'Pieces/White_Pawn.png'
  white_pawn.onload = function() {
    for(let i = 0; i < 8; i++) {
      ctx.drawImage(white_pawn, i * size, 6 * size, size, size)
    }
  }
  let white_king = new Image()
  white_king.src = 'Pieces/White_King.png'
  white_king.onload = function() {
    ctx.drawImage(white_king, 4 * size, 7 * size, size, size)
  }
  let white_queen = new Image()
  white_queen.src = 'Pieces/White_Queen.png'
  white_queen.onload = function() {
    ctx.drawImage(white_queen, 3 * size, 7 * size, size, size)
  }
  let white_bishop = new Image()
  white_bishop.src = 'Pieces/White_Bishop.png'
  white_bishop.onload = function() {
    ctx.drawImage(white_bishop, 2 * size, 7 * size, size, size)
    ctx.drawImage(white_bishop, 5 * size, 7 * size, size, size)
  }
  let white_knight = new Image()
  white_knight.src = 'Pieces/White_Knight.png'
  white_knight.onload = function() {
    ctx.drawImage(white_knight, 1 * size, 7 * size, size, size)
    ctx.drawImage(white_knight, 6 * size, 7 * size, size, size)
  }
  let white_rook = new Image()
  white_rook.src = 'Pieces/White_Rook.png'
  white_rook.onload = function() {
    ctx.drawImage(white_rook, 0 * size, 7 * size, size, size)
    ctx.drawImage(white_rook, 7 * size, 7 * size, size, size)
  }

  let black_pawn = new Image()
  black_pawn.src = 'Pieces/Black_Pawn.png'
  black_pawn.onload = function() {
    for(let i = 0; i < 8; i++) {
      ctx.drawImage(black_pawn, i * size, 1 * size, size, size)
    }
  }
  let black_king = new Image()
  black_king.src = 'Pieces/Black_King.png'
  black_king.onload = function() {
    ctx.drawImage(black_king, 4 * size, 0 * size, size, size)
  }
  let black_queen = new Image()
  black_queen.src = 'Pieces/Black_Queen.png'
  black_queen.onload = function() {
    ctx.drawImage(black_queen, 3 * size, 0 * size, size, size)
  }
  let black_bishop = new Image()
  black_bishop.src = 'Pieces/Black_Bishop.png'
  black_bishop.onload = function() {
    ctx.drawImage(black_bishop, 2 * size, 0 * size, size, size)
    ctx.drawImage(black_bishop, 5 * size, 0 * size, size, size)
  }
  let black_knight = new Image()
  black_knight.src = 'Pieces/Black_Knight.png'
  black_knight.onload = function() {
    ctx.drawImage(black_knight, 1 * size, 0 * size, size, size)
    ctx.drawImage(black_knight, 6 * size, 0 * size, size, size)
  }
  let black_rook = new Image()
  black_rook.src = 'Pieces/Black_Rook.png'
  black_rook.onload = function() {
    ctx.drawImage(black_rook, 0 * size, 0 * size, size, size)
    ctx.drawImage(black_rook, 7 * size, 0 * size, size, size)
  }
}

function initBoard() {
  let color = true
  for(let i = 0; i < 8; i++) {
    for(let j = 0; j < 8; j++) {
      drawSquare(i, j)
    }
  }
  drawPieces()
}

initBoard()

setInterval(draw, 10);
