document.querySelector('.clearCanvas').onclick = clearTree;
document.querySelector('.generateTree').onclick = () => generateRandomTree(12);

class Node {
    constructor(value) {
        this.value = value;
        this.left = null;
        this.right = null;
        this.x = 0;
        this.y = 0;
        this._scale = 1;
    }
}

class BinaryTree {
    constructor() {
        this.root = null;
    }

insert(value) {
    const newNode = new Node(value);
    if (!this.root) { this.root = newNode; return; }
    let current = this.root;
    while (true) {
        if (value === current.value) { return; } // duplicate, do nothing
        if (value < current.value) {
            if (!current.left) { current.left = newNode; return; }
            current = current.left;
        } else {
            if (!current.right) { current.right = newNode; return; }
            current = current.right;
        }
    }
}

    delete(value, root = this.root) {
        if (!root) return null;
        if (value < root.value) {
            root.left = this.delete(value, root.left);
        } else if (value > root.value) {
            root.right = this.delete(value, root.right);
        } else {
            if (!root.left && !root.right) return null;
            if (!root.left) return root.right;
            if (!root.right) return root.left;
            let min = this.findMin(root.right);
            root.value = min.value;
            root.right = this.delete(min.value, root.right);
        }
        return root;
    }

    findMin(node) {
        while (node.left) node = node.left;
        return node;
    }

    postOrder(node = this.root, result = []) {
        if (!node) return result;
        this.postOrder(node.left, result);
        this.postOrder(node.right, result);
        result.push(node);
        return result;
    }
    clear() {
        this.root = null;
    }

    generate(values) {
        this.root = null;
        for (let v of values) {
            this.insert(v);
        }
    }

}

function clearTree() {
    tree.clear();
    highlighted = new Set();
    visitedSet = new Set();
    highlighter = null;
    resultEl.textContent = '';
    layout();
    draw();
}

function generateRandomTree(size = 10) {
    const set = new Set();

    while (set.size < size) {
        set.add(Math.floor(Math.random() * 100));
    }

    tree.generate([...set]);

    highlighted = new Set();
    visitedSet = new Set();
    highlighter = null;

    layout();
    draw();
}

//   Canvas Setup   
const tree = new BinaryTree();
const screenEl = document.querySelector('.screen');

// Make .screen relative so canvas + result label sit inside it
screenEl.style.position = 'relative';
screenEl.style.overflow = 'hidden';

const canvas = document.createElement('canvas');
canvas.style.cssText = 'position:absolute;top:0;left:0;';
screenEl.appendChild(canvas);

// Result label drawn at the bottom of the screen
const resultEl = document.createElement('div');
resultEl.style.cssText = `
    position: absolute;
    bottom: 16px;
    left: 0; right: 0;
    text-align: center;
    color: #fff;
    font-size: 13px;
    font-family: Arial;
    pointer-events: none;
    padding: 0 12px;
    word-break: break-all;
`;
screenEl.appendChild(resultEl);

const ctx = canvas.getContext('2d');
const NODE_R = 22;
const V_GAP = 72;

function resizeCanvas() {
    canvas.width = screenEl.clientWidth;
    canvas.height = screenEl.clientHeight;
    layout();
    draw();
}

//   Layout: position each node   
function layout() {
    if (!tree.root) return;

    const startX = canvas.width / 2;
    const startY = 60;
    const initialOffset = canvas.width / 4;

    // Padding so nodes never touch the edges
    const pad = NODE_R + 4;

    function setPosition(node, x, y, offset) {
        if (!node) return;

        // Clamp x so the circle stays inside canvas bounds
        node.x = Math.max(pad, Math.min(canvas.width - pad, x));
        node.y = Math.max(pad, Math.min(canvas.height - pad, y));

        const nextOffset = offset * 0.55;

        if (node.left) {
            setPosition(node.left, x - offset, y + V_GAP, nextOffset);
        }
        if (node.right) {
            setPosition(node.right, x + offset, y + V_GAP, nextOffset);
        }
    }

    setPosition(tree.root, startX, startY, initialOffset);
}

//   Draw State   
let highlighted = new Set();
let visitedSet  = new Set();

function drawEdges(n) {
    if (!n) return;
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1.5;
    if (n.left) {
        ctx.beginPath();
        ctx.moveTo(n.x, n.y);
        ctx.lineTo(n.left.x, n.left.y);
        ctx.stroke();
        drawEdges(n.left);
    }
    if (n.right) {
        ctx.beginPath();
        ctx.moveTo(n.x, n.y);
        ctx.lineTo(n.right.x, n.right.y);
        ctx.stroke();
        drawEdges(n.right);
    }
}

function drawNodes(n) {
    if (!n) return;
    drawNodes(n.left);
    drawNodes(n.right);

    let fill   = 'rgb(2, 2, 46)';
    let stroke = '#ffffff';
    let text   = '#ffffff';

    if (highlighted.has(n)) {
        fill   = '#ffffff';
        stroke = '#ffffff';
        text   = '#000000';
    } else if (visitedSet.has(n)) {
        fill   = '#0d0d30';
        stroke = '#555';
        text   = '#888';
    }

    ctx.save();
    ctx.translate(n.x, n.y);
    ctx.scale(n._scale, n._scale);

    ctx.beginPath();
    ctx.arc(0, 0, NODE_R, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = text;
    ctx.font = 'bold 0.8rem Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(n.value), 0, 0);
    ctx.restore();
}

//   Highlighter state   
let highlighter = null; // { x, y, alpha, pulse }

function drawHighlighter() {
    if (!highlighter) return;
    const { x, y, alpha, pulse } = highlighter;
    const outerR = NODE_R + 8 + Math.sin(pulse) * 4;

    // Outer glow ring
    const grad = ctx.createRadialGradient(x, y, NODE_R - 2, x, y, outerR + 10);
    grad.addColorStop(0,   `rgba(124, 255, 0, ${alpha * 0.55})`);
    grad.addColorStop(0.5, `rgba(57, 255, 20, ${alpha * 0.25})`);
    grad.addColorStop(1,   `rgba(0, 255, 100, 0)`);

    ctx.beginPath();
    ctx.arc(x, y, outerR + 10, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Sharp ring stroke
    ctx.beginPath();
    ctx.arc(x, y, outerR, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(124, 255, 0, ${alpha})`;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = 'rgba(124,255,0,0.9)';
    ctx.shadowBlur = 12;
    ctx.stroke();
    ctx.shadowBlur = 0;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!tree.root) return;
    drawEdges(tree.root);
    drawNodes(tree.root);
    drawHighlighter();
}

//   Animation Helpers   
function animateHighlighterTo(node, fromNode, duration = 320) {
    return new Promise(resolve => {
        const startX = fromNode ? fromNode.x : node.x;
        const startY = fromNode ? fromNode.y : node.y;
        const endX   = node.x;
        const endY   = node.y;
        const start  = performance.now();
        let pulse    = 0;

        function tick(now) {
            const raw = (now - start) / duration;
            const p   = Math.min(raw, 1);
            // ease in-out cubic
            const t   = p < 0.5 ? 4*p*p*p : 1 - Math.pow(-2*p+2,3)/2;

            pulse += 0.18;
            highlighter = {
                x:     startX + (endX - startX) * t,
                y:     startY + (endY - startY) * t,
                alpha: 0.85 + 0.15 * Math.sin(pulse),
                pulse
            };
            draw();

            if (p < 1) requestAnimationFrame(tick);
            else {
                highlighter = { x: endX, y: endY, alpha: 1, pulse };
                draw();
                resolve();
            }
        }
        requestAnimationFrame(tick);
    });
}

function pulseHighlighterAt(node, duration = 260) {
    return new Promise(resolve => {
        const start = performance.now();
        let pulse = highlighter ? highlighter.pulse : 0;

        function tick(now) {
            const p = Math.min((now - start) / duration, 1);
            pulse += 0.22;
            highlighter = { x: node.x, y: node.y, alpha: 1 - p * 0.3, pulse };
            draw();
            if (p < 1) requestAnimationFrame(tick);
            else { draw(); resolve(); }
        }
        requestAnimationFrame(tick);
    });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

//   UI Wiring   
const input      = document.getElementById('num');
const selector   = document.getElementById('selector');
const actionBtn  = document.querySelector('.actionButton');
const traverseBtn = document.querySelector('.TraverseButton');

let animating = false;

// Sync button label with dropdown
actionBtn.textContent = selector.value;
selector.addEventListener('change', () => {
    actionBtn.textContent = selector.value;
});

// Insert / Delete
actionBtn.addEventListener('click', async () => {
    if (animating) return;
    const value = parseInt(input.value);
    if (isNaN(value)) { resultEl.textContent = '⚠️ Enter a valid number'; return; }
    input.value = '';
    resultEl.textContent = '';

    if (selector.value === 'Insert') {
        tree.insert(value);
        layout();

        // find the newly inserted node and pop it
        let cur = tree.root;
        while (cur && cur.value !== value) {
            cur = value < cur.value ? cur.left : cur.right;
        }
        if (cur) {
            highlighter = { x: cur.x, y: cur.y, alpha: 1, pulse: 0 };
            draw();
            await pulseHighlighterAt(cur, 400);
            await new Promise(resolve => {
                const fadeStart = performance.now();
                const snap = { ...highlighter };
                function fade(now) {
                    const p = Math.min((now - fadeStart) / 250, 1);
                    highlighter = { ...snap, alpha: 1 - p };
                    draw();
                    if (p < 1) requestAnimationFrame(fade);
                    else { highlighter = null; draw(); resolve(); }
                }
                requestAnimationFrame(fade);
            });
            highlighted = new Set();
            visitedSet  = new Set();
            draw();
        }
    } else {
    let cur = tree.root;
    while (cur && cur.value !== value) {
        cur = value < cur.value ? cur.left : cur.right;
    }
    if (cur) {
        highlighted = new Set([cur]);
        draw();
        await sleep(300);
        highlighted = new Set();
        tree.root = tree.delete(value);
        layout();
        visitedSet = new Set();
        draw();
    } else {
        resultEl.textContent = `⚠️ ${value} is not in the tree`;
    }
}
});

// Traverse
traverseBtn.addEventListener('click', async () => {
    if (animating || !tree.root) return;
    animating = true;
    visitedSet  = new Set();
    highlighted = new Set();
    highlighter = null;
    resultEl.textContent = '';

    const order  = tree.postOrder();
    const values = [];
    let prevNode = null;

    for (const n of order) {
        // Travel highlighter from previous node (or spawn at first node)
        await animateHighlighterTo(n, prevNode, prevNode ? 340 : 0);
        // Brief pulse at the landed node
        await pulseHighlighterAt(n, 220);

        values.push(n.value);
        resultEl.textContent = 'Post-order: ' + values.join(' → ');

        visitedSet.add(n);
        prevNode = n;
        draw();
        await sleep(60);
    }

    // Fade out highlighter
    const fadeStart = performance.now();
    const fadeDur   = 400;
    const lastH     = { ...highlighter };
    await new Promise(resolve => {
        function fade(now) {
            const p = Math.min((now - fadeStart) / fadeDur, 1);
            highlighter = { ...lastH, alpha: 1 - p };
            draw();
            if (p < 1) requestAnimationFrame(fade);
            else { highlighter = null; draw(); resolve(); }
        }
        requestAnimationFrame(fade);
    });

    highlighted = new Set();
    draw();
    animating = false;
});

//   Initialize
window.addEventListener('resize', resizeCanvas);
resizeCanvas();