const canvas = document.getElementById('graphCanvas');
const ctx = canvas.getContext('2d');
canvas.width = canvas.offsetWidth;
canvas.height = canvas.offsetHeight;

let nodes = [];
let edges = [];
let startNode = null;
let endNode = null;
let isDragging = false;
let currentMode = null;

class Node {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.edges = [];
    this.isStart = false;
    this.isEnd = false;
  }
}

class Edge {
  constructor(nodeA, nodeB, weight) {
    this.nodeA = nodeA;
    this.nodeB = nodeB;
    this.weight = weight;
  }
}

// Set the mode for selecting origin or destination
function setMode(mode) {
  currentMode = mode;
}

// Add node on click
canvas.addEventListener('click', (e) => {
  if (isDragging) return;

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const clickedNode = getNodeAt(x, y);

  if (currentMode === 'setOrigin' && clickedNode) {
    if (startNode) startNode.isStart = false;
    clickedNode.isStart = true;
    startNode = clickedNode;
    currentMode = null;
    draw();
    return;
  }

  if (currentMode === 'setDestination' && clickedNode) {
    if (endNode) endNode.isEnd = false;
    clickedNode.isEnd = true;
    endNode = clickedNode;
    currentMode = null;
    draw();
    return;
  }

  if (!currentMode && !clickedNode) {
    nodes.push(new Node(x, y));
    draw();
  }
});

// Start dragging
let dragStartNode = null;
canvas.addEventListener('mousedown', (e) => {
  isDragging = false;
  const node = getNodeAt(e.offsetX, e.offsetY);
  if (node) dragStartNode = node;
});

// Finish dragging and create an edge
canvas.addEventListener('mouseup', (e) => {
  if (dragStartNode) {
    const node = getNodeAt(e.offsetX, e.offsetY);
    if (node && dragStartNode !== node) {
      const weight = Math.floor(Math.hypot(node.x - dragStartNode.x, node.y - dragStartNode.y) / 10);
      edges.push(new Edge(dragStartNode, node, weight));
      dragStartNode.edges.push({ node, weight });
      node.edges.push({ node: dragStartNode, weight });
    }
    dragStartNode = null;
    draw();
  }
});

// Detect dragging
canvas.addEventListener('mousemove', () => {
  isDragging = true;
});

function getNodeAt(x, y) {
  return nodes.find((node) => Math.hypot(node.x - x, node.y - y) < 15);
}

// Run Dijkstra's Algorithm
function runDijkstra() {
  if (!startNode || !endNode) {
    alert('Please set a start and end node!');
    return;
  }

  const distances = new Map();
  const previous = new Map();
  const queue = [];

  nodes.forEach((node) => {
    distances.set(node, Infinity);
    previous.set(node, null);
  });

  distances.set(startNode, 0);
  queue.push({ node: startNode, distance: 0 });

  while (queue.length > 0) {
    queue.sort((a, b) => a.distance - b.distance);
    const { node: currentNode } = queue.shift();

    if (currentNode === endNode) break;

    currentNode.edges.forEach(({ node: neighbor, weight }) => {
      const alt = distances.get(currentNode) + weight;
      if (alt < distances.get(neighbor)) {
        distances.set(neighbor, alt);
        previous.set(neighbor, currentNode);
        queue.push({ node: neighbor, distance: alt });
      }
    });
  }

  drawPath(previous);
}

// Draw the path
function drawPath(previous) {
  if (!previous.get(endNode)) {
    alert('No path found from start to end node!');
    return;
  }

  let currentNode = endNode;
  ctx.strokeStyle = 'blue';
  ctx.lineWidth = 3;

  while (previous.get(currentNode)) {
    const prevNode = previous.get(currentNode);
    ctx.beginPath();
    ctx.moveTo(currentNode.x, currentNode.y);
    ctx.lineTo(prevNode.x, prevNode.y);
    ctx.stroke();
    currentNode = prevNode;
  }
}

// Draw the graph
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  edges.forEach(({ nodeA, nodeB, weight }) => {
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(nodeA.x, nodeA.y);
    ctx.lineTo(nodeB.x, nodeB.y);
    ctx.stroke();
    ctx.fillStyle = 'red';
    ctx.fillText(weight, (nodeA.x + nodeB.x) / 2, (nodeA.y + nodeB.y) / 2);
  });

  nodes.forEach((node) => {
    ctx.fillStyle = node.isStart ? 'green' : node.isEnd ? 'red' : 'black';
    ctx.beginPath();
    ctx.arc(node.x, node.y, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });
}