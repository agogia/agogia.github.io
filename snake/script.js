const GRID_SIZE = 20;
const STEP_MS = 77;
const DEFAULT_DIRECTION = { x: 1, y: 0 };
let previewMode = new URLSearchParams(window.location.search).get("preview");

const canvas = document.getElementById("snake-board");
const context = canvas.getContext("2d");
const scoreElement = document.getElementById("score");

const directionMap = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
};

const state = {
  boardSize: 420,
  cellSize: 21,
  snake: [],
  direction: null,
  nextDirection: null,
  food: null,
  score: 0,
  status: "idle",
  lastStepTime: 0,
};

let touchStart = null;

function cloneSegment(segment) {
  return { x: segment.x, y: segment.y };
}

function createInitialSnake() {
  return [
    { x: 9, y: 10 },
    { x: 8, y: 10 },
    { x: 7, y: 10 },
  ];
}

function getWinningScore() {
  return GRID_SIZE * GRID_SIZE - createInitialSnake().length;
}

function applyPreviewState() {
  if (previewMode !== "won") {
    return;
  }

  state.score = getWinningScore();
  state.food = null;
  state.status = "won";
  previewMode = null;
}

function resetGame() {
  state.snake = createInitialSnake().map(cloneSegment);
  state.direction = cloneSegment(DEFAULT_DIRECTION);
  state.nextDirection = null;
  state.food = placeFood();
  state.score = 0;
  state.status = "idle";
  state.lastStepTime = 0;
  applyPreviewState();
  updateUi();
  draw();
  window.requestAnimationFrame(() => {
    canvas.focus();
  });
}

function placeFood() {
  const openCells = [];

  for (let y = 0; y < GRID_SIZE; y += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      const occupied = state.snake.some((segment) => segment.x === x && segment.y === y);

      if (!occupied) {
        openCells.push({ x, y });
      }
    }
  }

  if (openCells.length === 0) {
    return null;
  }

  return openCells[Math.floor(Math.random() * openCells.length)];
}

function isOpposite(nextDirection, currentDirection) {
  return nextDirection.x === -currentDirection.x && nextDirection.y === -currentDirection.y;
}

function beginRun(direction) {
  const now = performance.now();

  state.direction = direction;
  state.nextDirection = null;
  state.status = "running";
  state.lastStepTime = now;
  canvas.focus();
  updateUi();
}

function queueDirection(direction) {
  if (!direction) {
    return;
  }

  if (state.status === "over" || state.status === "won") {
    resetGame();
  }

  if (state.status === "idle") {
    if (isOpposite(direction, state.direction)) {
      return;
    }

    beginRun(direction);
    return;
  }

  if (state.direction && isOpposite(direction, state.direction)) {
    return;
  }

  if (state.nextDirection) {
    return;
  }

  state.nextDirection = direction;
}

function resizeBoard() {
  const devicePixelRatio = window.devicePixelRatio || 1;
  const maxBoardWidth = Math.min(canvas.parentElement.clientWidth, 416);
  const snappedSize = Math.max(GRID_SIZE, Math.floor(maxBoardWidth / GRID_SIZE) * GRID_SIZE);

  state.boardSize = snappedSize;
  state.cellSize = snappedSize / GRID_SIZE;

  canvas.style.width = `${snappedSize}px`;
  canvas.style.height = `${snappedSize}px`;
  canvas.width = snappedSize * devicePixelRatio;
  canvas.height = snappedSize * devicePixelRatio;
  context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);

  draw();
}

function updateUi() {
  scoreElement.textContent = String(state.score);
}

function endGame(nextStatus = "over") {
  state.status = nextStatus;
  updateUi();
}

function advance(timestamp) {
  if (!state.direction || state.status !== "running") {
    return;
  }

  if (state.nextDirection) {
    state.direction = state.nextDirection;
    state.nextDirection = null;
  }

  const nextHead = {
    x: state.snake[0].x + state.direction.x,
    y: state.snake[0].y + state.direction.y,
  };

  const willEat = state.food && nextHead.x === state.food.x && nextHead.y === state.food.y;
  const bodyToCheck = willEat ? state.snake : state.snake.slice(0, -1);
  const hitWall = nextHead.x < 0 || nextHead.x >= GRID_SIZE || nextHead.y < 0 || nextHead.y >= GRID_SIZE;
  const hitSelf = bodyToCheck.some((segment) => segment.x === nextHead.x && segment.y === nextHead.y);

  if (hitWall || hitSelf) {
    endGame();
    return;
  }

  state.snake.unshift(nextHead);

  if (willEat) {
    state.score += 1;
    state.food = placeFood();

    if (!state.food) {
      endGame("won");
      return;
    }
  } else {
    state.snake.pop();
  }
}

function drawCell(x, y, fillStyle, inset = 0.12) {
  const padding = state.cellSize * inset;
  const size = state.cellSize - padding * 2;

  context.fillStyle = fillStyle;
  context.fillRect(
    x * state.cellSize + padding,
    y * state.cellSize + padding,
    size,
    size
  );
}

function drawGrid() {
  context.strokeStyle = "rgba(17, 17, 17, 0.07)";
  context.lineWidth = 1;

  for (let index = 1; index < GRID_SIZE; index += 1) {
    const offset = index * state.cellSize;

    context.beginPath();
    context.moveTo(offset, 0);
    context.lineTo(offset, state.boardSize);
    context.stroke();

    context.beginPath();
    context.moveTo(0, offset);
    context.lineTo(state.boardSize, offset);
    context.stroke();
  }
}

function drawFood() {
  if (!state.food) {
    return;
  }

  const centerX = state.food.x * state.cellSize + state.cellSize / 2;
  const centerY = state.food.y * state.cellSize + state.cellSize / 2;
  const radius = state.cellSize * 0.2;

  context.fillStyle = "#000000";
  context.beginPath();
  context.arc(centerX, centerY, radius, 0, Math.PI * 2);
  context.fill();
}

function drawIdleOverlay() {
  if (state.status !== "idle") {
    return;
  }

  context.fillStyle = "rgba(255, 255, 255, 0.92)";
  context.fillRect(0, 0, state.boardSize, state.boardSize);

  context.textAlign = "center";
  context.textBaseline = "middle";

  drawArrowCue(state.boardSize / 2, state.boardSize / 2 - 8);

  context.fillStyle = "#444444";
  context.font = '14px Georgia, "Times New Roman", Times, serif';
  context.fillText("press an arrow key or swipe to begin", state.boardSize / 2, state.boardSize / 2 + 62);
}

function drawOverlay() {
  if (state.status !== "over" && state.status !== "won") {
    return;
  }

  const title = state.status === "won" ? "you won" : "game over";

  context.fillStyle = "rgba(255, 255, 255, 0.94)";
  context.fillRect(0, 0, state.boardSize, state.boardSize);

  context.fillStyle = "#000000";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = '600 18px Georgia, "Times New Roman", Times, serif';
  context.fillText(title, state.boardSize / 2, state.boardSize / 2 - 10);

  context.fillStyle = "#444444";
  context.font = '14px Georgia, "Times New Roman", Times, serif';
  context.fillText("press an arrow key to play again", state.boardSize / 2, state.boardSize / 2 + 18);
}

function draw() {
  context.clearRect(0, 0, state.boardSize, state.boardSize);
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, state.boardSize, state.boardSize);

  drawGrid();

  if (state.snake.length === 0) {
    drawIdleOverlay();
    drawOverlay();
    return;
  }

  if (state.status === "idle") {
    drawIdleOverlay();
    return;
  }

  if (state.status === "over" || state.status === "won") {
    drawOverlay();
    return;
  }

  drawFood();

  state.snake.forEach((segment, index) => {
    if (index === 0) {
      return;
    }

    drawCell(segment.x, segment.y, "#1a1a1a", 0.14);
  });

  drawHead();
}

function drawArrowCue(centerX, centerY) {
  const keySize = state.cellSize * 2.2;
  const gap = state.cellSize * 0.35;
  const half = keySize / 2;
  const strokeColor = "#000000";
  const lineWidth = Math.max(1.5, state.cellSize * 0.08);

  drawKey(centerX, centerY - keySize - gap, keySize, "up");
  drawKey(centerX - keySize - gap, centerY, keySize, "left");
  drawKey(centerX, centerY, keySize, "down");
  drawKey(centerX + keySize + gap, centerY, keySize, "right");

  function drawKey(x, y, size, direction) {
    context.strokeStyle = strokeColor;
    context.lineWidth = 1;
    context.strokeRect(x - half, y - half, size, size);

    context.strokeStyle = strokeColor;
    context.lineWidth = lineWidth;
    context.lineCap = "round";
    context.lineJoin = "round";

    const shaft = size * 0.24;
    const head = size * 0.14;

    context.beginPath();

    if (direction === "up") {
      context.moveTo(x, y + shaft);
      context.lineTo(x, y - shaft);
      context.moveTo(x, y - shaft);
      context.lineTo(x - head, y - shaft + head);
      context.moveTo(x, y - shaft);
      context.lineTo(x + head, y - shaft + head);
    } else if (direction === "down") {
      context.moveTo(x, y - shaft);
      context.lineTo(x, y + shaft);
      context.moveTo(x, y + shaft);
      context.lineTo(x - head, y + shaft - head);
      context.moveTo(x, y + shaft);
      context.lineTo(x + head, y + shaft - head);
    } else if (direction === "left") {
      context.moveTo(x + shaft, y);
      context.lineTo(x - shaft, y);
      context.moveTo(x - shaft, y);
      context.lineTo(x - shaft + head, y - head);
      context.moveTo(x - shaft, y);
      context.lineTo(x - shaft + head, y + head);
    } else {
      context.moveTo(x - shaft, y);
      context.lineTo(x + shaft, y);
      context.moveTo(x + shaft, y);
      context.lineTo(x + shaft - head, y - head);
      context.moveTo(x + shaft, y);
      context.lineTo(x + shaft - head, y + head);
    }

    context.stroke();
  }
}

function drawHead() {
  const head = state.snake[0];
  drawCell(head.x, head.y, "#1a1a1a", 0.14);
}

function animate(timestamp) {
  if (state.status === "running") {
    while (timestamp - state.lastStepTime >= STEP_MS && state.status === "running") {
      state.lastStepTime += STEP_MS;
      advance(state.lastStepTime);
    }
  }

  updateUi();
  draw();
  window.requestAnimationFrame(animate);
}

function handleKeydown(event) {
  const nextDirection = directionMap[event.key];

  if (nextDirection) {
    event.preventDefault();
    queueDirection(nextDirection);
    return;
  }

  if ((event.key === "Enter" || event.key === " ") && (state.status === "over" || state.status === "won")) {
    event.preventDefault();
    resetGame();
  }
}

function handleTouchStart(event) {
  if (event.changedTouches.length === 0) {
    return;
  }

  const touch = event.changedTouches[0];

  touchStart = { x: touch.clientX, y: touch.clientY };
}

function handleTouchEnd(event) {
  if (!touchStart || event.changedTouches.length === 0) {
    return;
  }

  const touch = event.changedTouches[0];
  const deltaX = touch.clientX - touchStart.x;
  const deltaY = touch.clientY - touchStart.y;
  const threshold = 18;

  touchStart = null;

  if (Math.abs(deltaX) < threshold && Math.abs(deltaY) < threshold) {
    return;
  }

  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    queueDirection(deltaX > 0 ? directionMap.ArrowRight : directionMap.ArrowLeft);
    return;
  }

  queueDirection(deltaY > 0 ? directionMap.ArrowDown : directionMap.ArrowUp);
}

window.addEventListener("keydown", handleKeydown);
window.addEventListener("resize", resizeBoard);
canvas.addEventListener("touchstart", handleTouchStart, { passive: true });
canvas.addEventListener("touchend", handleTouchEnd, { passive: true });

resetGame();
resizeBoard();
window.requestAnimationFrame(animate);
