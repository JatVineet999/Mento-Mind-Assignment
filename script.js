let draggedElement = null;
const historyStack = [];
let isAnimating = false; 
const ANIMATION_DURATION = 500; // Duration of the animation in milliseconds
const INITIAL_BOX_COUNT = 3; // Number of boxes per row
const INITIAL_ROW_COUNT = 3; // Initial number of rows

// Initialize drag-and-drop event listeners for boxes and cells
function initializeDragAndDrop() {
  document.querySelectorAll("td").forEach((cell) => {
    cell.ondragover = (event) => event.preventDefault();
    cell.ondrop = handleDrop;
  });
}

const handleDragStart = (event) => {
  draggedElement = event.target;
  setTimeout(() => draggedElement.classList.add("invisible"), 0);
};

const handleDragEnd = () => {
  if (draggedElement) {
    draggedElement.classList.remove("invisible");
  }
};

// Handle drop event
const handleDrop = (event) => {
  event.preventDefault();
  const targetCell = event.target.closest("td");
  if (targetCell && targetCell !== draggedElement.parentElement) {
    const targetBox = targetCell.querySelector(".box");
    recordHistory(draggedElement, targetCell, targetBox);
    animateAndSwap(draggedElement, targetCell, targetBox);
  }
};

// Record the history for undo functionality
const recordHistory = (draggedBox, targetCell, movedBox) => {
  historyStack.push({
    draggedBox,
    draggedFrom: draggedBox.parentElement,
    movedBox,
    movedFrom: targetCell,
  });
};

function animateAndSwap(box, targetCell, targetBox) {
  const originalCell = box.parentElement;
  animateBoxMovement(box, targetCell, () => {
    if (targetBox) {
      originalCell.appendChild(targetBox);
    }
    targetCell.appendChild(box);
  });
  if (targetBox) {
    animateBoxMovement(targetBox, originalCell);
  }
}

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

function undoLastAction() {
  if (isAnimating || historyStack.length === 0) return;

  isAnimating = true;
  const lastAction = historyStack.pop();
  const { draggedBox, draggedFrom, movedBox, movedFrom } = lastAction;

  animateBoxMovement(draggedBox, draggedFrom, () => {
    movedFrom.appendChild(movedBox);
  });

  animateBoxMovement(movedBox, movedFrom, () => {
    draggedFrom.appendChild(draggedBox);
    isAnimating = false;
  });
}

function addNewRow() {
  const table = document.getElementById("dragDropTable");
  const newRow = table.insertRow();
  const startingNumber = table.rows.length * 100;
  Array.from({ length: INITIAL_BOX_COUNT }).forEach((_, i) => {
    const boxNum = startingNumber + (i + 1) * 100 - 100;
    newRow.insertCell().appendChild(createNewBox(boxNum));
  });
  initializeDragAndDrop();
}

function createNewBox(num) {
  const box = document.createElement("div");
  box.className = "box";
  box.textContent = num;
  box.draggable = true;
  box.style.backgroundColor = getRandomColor();

  // Inline event handlers
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
// Initialize the table with some rows and boxes on page load
window.onload = () => {
  for (let i = 0; i < INITIAL_ROW_COUNT; i++) {
    addNewRow();
  }
  initializeDragAndDrop();
};
