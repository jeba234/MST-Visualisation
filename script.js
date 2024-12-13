const canvas = document.getElementById('graphCanvas');
const ctx = canvas.getContext('2d');
const statusBox = document.getElementById('statusBox');
const pauseResumeButton = document.getElementById('pauseResumeButton');
const startButton = document.getElementById('startButton');

let nodes = [];
let edges = [];
let animationQueue = [];
let completedEdges = [];
let animationIndex = 0;
let isPaused = false;
let isDrawingEdge = false;
let currentStartNode = null;

// Mouse events for user graph creation
canvas.addEventListener('click', addNode);
canvas.addEventListener('mousedown', startEdge);
canvas.addEventListener('mouseup', endEdge);

function initializeUserGraph() {
    nodes = [];
    edges = [];
    animationQueue = [];
    completedEdges = [];
    animationIndex = 0;
    isPaused = false;
    startButton.disabled = true;
    drawGraph();
    updateStatusBox('Click on the canvas to add nodes.');
}

function addNode(event) {
    if (nodes.length < parseInt(document.getElementById('nodeCountInput').value)) {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        nodes.push({ x, y });
        drawGraph();
    } else {
        updateStatusBox("Maximum number of nodes reached.");
    }
}

function startEdge(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    currentStartNode = findNode(x, y);
    isDrawingEdge = !!currentStartNode;
}

function endEdge(event) {
    if (isDrawingEdge) {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const endNode = findNode(x, y);
        if (endNode && endNode !== currentStartNode) {
            const weightInput = prompt("Enter the weight for the edge:");
            const weight = parseInt(weightInput, 10);

            if (!isNaN(weight) && weight > 0) {
                edges.push({ u: nodes.indexOf(currentStartNode), v: nodes.indexOf(endNode), weight });
                drawGraph();
                startButton.disabled = false;
                updateStatusBox(`Edge added with weight ${weight}`);
            } else {
                updateStatusBox("Invalid weight. Edge not added.");
            }
        } else {
            updateStatusBox("Invalid edge.");
        }
        isDrawingEdge = false;
    }
}

function findNode(x, y) {
    return nodes.find(node => Math.hypot(node.x - x, node.y - y) <= 25);
}

function drawGraph(currentEdge = null) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    edges.forEach(edge => drawLine(nodes[edge.u], nodes[edge.v], '#aaaaaa', edge.weight));
    completedEdges.forEach(edge => drawLine(nodes[edge.u], nodes[edge.v], '#006400', edge.weight));
    if (currentEdge) drawLine(nodes[currentEdge.u], nodes[currentEdge.v], '#aaaaaa', currentEdge.weight);
    nodes.forEach((node, index) => drawNode(node, index));
}

function drawNode(node, index) {
    ctx.beginPath();
    ctx.arc(node.x, node.y, 25, 0, 2 * Math.PI);
    ctx.fillStyle = '#007BFF';
    ctx.fill();
    ctx.stroke();
    ctx.closePath();
    ctx.fillStyle = '#fff';
    ctx.font = '16px Arial';
    ctx.fillText(index, node.x - 8, node.y + 6);
}

function drawLine(start, end, color, weight = null) {
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.closePath();
    if (weight !== null) {
        ctx.fillStyle = '#333';
        ctx.font = '16px Arial';
        ctx.fillText(weight, (start.x + end.x) / 2, (start.y + end.y) / 2);
    }
}

function startPrimsAlgorithm() {
    animationQueue = [];
    completedEdges = [];
    animationIndex = 0;
    runPrims();
}

function startKruskalsAlgorithm() {
    animationQueue = [];
    completedEdges = [];
    animationIndex = 0;
    runKruskals();
}

function runPrims() {
    let visited = new Set();
    visited.add(0);
    updateStatusBox("Starting Prim's Algorithm.");

    while (visited.size < nodes.length) {
        let minEdge = null;

        edges.forEach(edge => {
            if (visited.has(edge.u) ^ visited.has(edge.v)) {
                if (!minEdge || edge.weight < minEdge.weight) {
                    minEdge = edge;
                }
            }
        });

        if (minEdge) {
            animationQueue.push({
                edge: minEdge,
                explanation: `Edge (${minEdge.u}, ${minEdge.v}) with weight ${minEdge.weight} is chosen.`
            });
            visited.add(minEdge.u);
            visited.add(minEdge.v);
        }
    }

    animationIndex = 0;
    runAnimation();
}

function runKruskals() {
    let parent = Array(nodes.length).fill(null).map((_, index) => index);
    updateStatusBox("Starting Kruskal's Algorithm. Sorting edges by weight.");

    function find(node) {
        if (parent[node] === node) return node;
        return parent[node] = find(parent[node]);
    }

    function union(u, v) {
        parent[find(u)] = find(v);
    }

    edges.sort((a, b) => a.weight - b.weight);

    edges.forEach(edge => {
        const uRoot = find(edge.u);
        const vRoot = find(edge.v);

        if (uRoot !== vRoot) {
            animationQueue.push({
                edge,
                explanation: `Edge (${edge.u}, ${edge.v}) with weight ${edge.weight} is chosen.`
            });
            union(edge.u, edge.v);
        }
    });

    animationIndex = 0;
    runAnimation();
}

function runAnimation() {
    if (animationIndex < animationQueue.length) {
        if (isPaused) return;

        const { edge, explanation } = animationQueue[animationIndex];
        updateStatusBox(explanation);
        animateEdge(edge, () => {
            completedEdges.push(edge);
            animationIndex++;
            runAnimation();
        });
    } else {
        updateStatusBox("Algorithm complete. Minimum Spanning Tree constructed.");
        drawGraph();
    }
}

function animateEdge(edge, callback) {
    const start = nodes[edge.u];
    const end = nodes[edge.v];
    const duration = 1000; // Animation duration in ms
    const startTime = performance.now();

    function step(currentTime) {
        if (isPaused) return;

        const elapsedTime = currentTime - startTime;
        const progress = Math.min(elapsedTime / duration, 1);

        const current = {
            x: start.x + (end.x - start.x) * progress,
            y: start.y + (end.y - start.y) * progress
        };

        drawGraph(edge);
        drawLine(start, current, '#FF0000');

        if (progress < 1) {
            requestAnimationFrame(step);
        } else {
            callback();
        }
    }

    requestAnimationFrame(step);
}

function togglePauseResume() {
    isPaused = !isPaused;
    pauseResumeButton.textContent = isPaused ? 'Resume' : 'Pause';
    if (!isPaused) runAnimation();
}

function updateStatusBox(message) {
    statusBox.innerText = message;
}
