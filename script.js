// Constants
const ANIMATION_DURATION = 500; // Duration of the animation in milliseconds
const INITIAL_BOX_COUNT = 3; // Number of boxes per row
const INITIAL_ROW_COUNT = 3; // Initial number of rows

const state = {
  draggedElement: null,
  historyStack: [],
  currentPointer: -1, // Pointer to track current position in history
  isAnimating: false,
};

// Command base class
class Command {
  execute() {}
  undo() {}
  redo() {}
}

class BoxMoveCommand extends Command {
  constructor(draggedBox, draggedFrom, movedBox, movedFrom) {
    super();
    Object.assign(this, { draggedBox, draggedFrom, movedBox, movedFrom });
  }

  execute() {
    this._animateAndSwap(
      this.draggedBox,
      this.movedFrom,
      this.movedBox,
      this.draggedFrom
    );
  }

  undo() {
    this._animateAndSwap(
      this.movedBox,
      this.movedFrom,
      this.draggedBox,
      this.draggedFrom
    );
  }

  redo() {
    this.execute();
  }

  _animateAndSwap(box1, toCell1, box2, toCell2) {
    if (box1) {
      animateBoxMovement(box1, toCell1, () => toCell1.appendChild(box1));
    }
    if (box2) {
      animateBoxMovement(box2, toCell2, () => toCell2.appendChild(box2));
    }
  }
}

class RowAddCommand extends Command {
  constructor(newRow) {
    super();
    this.newRow = newRow;
  }

  execute() {
    document.getElementById("dragDropTable").appendChild(this.newRow);
  }

  undo() {
    document.getElementById("dragDropTable").deleteRow(this.newRow.rowIndex);
  }

  redo() {
    this.execute();
  }
}

function executeCommand(command) {
  state.historyStack.splice(state.currentPointer + 1);
  command.execute();
  state.historyStack.push(command);
  state.currentPointer++;
}

function undoLastAction() {
  if (state.currentPointer >= 0 && !state.isAnimating) {
    state.historyStack[state.currentPointer].undo();
    state.currentPointer--;
    updateRedoButton();
  }
}

function updateRedoButton() {
  const redoButton = document.querySelector(".btn-redo");

  if (state.currentPointer < state.historyStack.length - 1) {
    redoButton.classList.remove("disabled");
  } else {
    redoButton.classList.add("disabled");
  }
}

function redoLastAction() {
  if (
    state.currentPointer < state.historyStack.length - 1 &&
    !state.isAnimating
  ) {
    state.historyStack[state.currentPointer + 1].redo();
    state.currentPointer++;
    updateRedoButton(); // Update button state
  }
}

function initializeDragAndDrop() {
  document.querySelectorAll("td").forEach((cell) => {
    cell.ondragover = (event) => event.preventDefault();
    cell.ondrop = handleDrop;
  });
}

const handleDragStart = (event) => {
  state.draggedElement = event.target;
  setTimeout(() => state.draggedElement.classList.add("invisible"), 0);
};

const handleDragEnd = () => {
  if (state.draggedElement) {
    state.draggedElement.classList.remove("invisible");
  }
};

const handleDrop = (event) => {
  event.preventDefault();
  const targetCell = event.target.closest("td");
  if (targetCell && targetCell !== state.draggedElement.parentElement) {
    const targetBox = targetCell.querySelector(".box");
    const moveCommand = new BoxMoveCommand(
      state.draggedElement,
      state.draggedElement.parentElement,
      targetBox,
      targetCell
    );
    executeCommand(moveCommand);
  }
};

function animateBoxMovement(box, targetCell, callback) {
  const { left: startX, top: startY } = box.getBoundingClientRect();
  const { left: endX, top: endY } = targetCell.getBoundingClientRect();
  const deltaX = endX - startX;
  const deltaY = endY - startY;

  Object.assign(box.style, {
    position: "absolute",
    zIndex: "1000",
    transition: `transform ${ANIMATION_DURATION}ms ease`,
    transform: `translate(${deltaX}px, ${deltaY}px)`,
  });

  box.addEventListener("transitionend", function onTransitionEnd() {
    resetBoxStyles(box);
    callback && callback();
    box.removeEventListener("transitionend", onTransitionEnd);
  });
}

const resetBoxStyles = (box) => {
  Object.assign(box.style, {
    position: "",
    zIndex: "",
    transform: "",
    transition: "",
  });
};

function addNewRow() {
  const table = document.getElementById("dragDropTable");
  const newRow = table.insertRow();
  const startingNumber = table.rows.length * 100;
  Array.from({ length: INITIAL_BOX_COUNT }).forEach((_, i) => {
    const boxNum = startingNumber + (i + 1) * 100 - 100;
    newRow.insertCell().appendChild(createNewBox(boxNum));
  });
  const rowCommand = new RowAddCommand(newRow);
  executeCommand(rowCommand);
  initializeDragAndDrop();
}

function createNewBox(boxNumber) {
  const box = document.createElement("div");
  box.className = "box";
  box.textContent = boxNumber;
  box.draggable = true;
  box.style.backgroundColor = getRandomColor();
  box.ondragstart = handleDragStart;
  box.ondragend = handleDragEnd;

  return box;
}

function getRandomColor() {
  const letters = "0123456789ABCDEF";
  return `#${Array.from(
    { length: 6 },
    () => letters[Math.floor(Math.random() * 16)]
  ).join("")}`;
}

window.onload = () => {
  for (let i = 0; i < INITIAL_ROW_COUNT; i++) {
    addNewRow();
  }
  state.historyStack.length = 0;
  state.currentPointer = -1;
  updateRedoButton();
  initializeDragAndDrop();
};
