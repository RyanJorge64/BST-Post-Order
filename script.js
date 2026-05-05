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
    const initialOffset = canvas.width / 4; // controls spread

    function setPosition(node, x, y, offset) {
        if (!node) return;

        node.x = x;
        node.y = y;

        // Reduce spacing each level
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

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!tree.root) return;
    drawEdges(tree.root);
    drawNodes(tree.root);
}

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
    ctx.font = 'bold 13px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(n.value), 0, 0);
    ctx.restore();
}

//   Animation Helpers   
function animateNode(node, duration = 300) {
    return new Promise(resolve => {
        const start = performance.now();
        function tick(now) {
            const p = Math.min((now - start) / duration, 1);
            node._scale = 1 + 0.4 * Math.sin(p * Math.PI);
            draw();
            if (p < 1) requestAnimationFrame(tick);
            else { node._scale = 1; draw(); resolve(); }
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
            highlighted = new Set([cur]);
            draw();
            await animateNode(cur, 400);
            highlighted = new Set();
            visitedSet  = new Set();
            draw();
        }
    } else {
        // flash node before deleting
        let cur = tree.root;
        while (cur && cur.value !== value) {
            cur = value < cur.value ? cur.left : cur.right;
        }
        if (cur) {
            highlighted = new Set([cur]);
            draw();
            await sleep(300);
            highlighted = new Set();
        }
        tree.root  = tree.delete(value);
        layout();
        visitedSet = new Set();
        draw();
    }
});

// Traverse (Post-order)
traverseBtn.addEventListener('click', async () => {
    if (animating || !tree.root) return;
    animating = true;
    visitedSet  = new Set();
    highlighted = new Set();
    resultEl.textContent = '';

    const order  = tree.postOrder();
    const values = [];

    for (const n of order) {
        highlighted = new Set([n]);
        draw();
        values.push(n.value);
        resultEl.textContent = 'Post-order: ' + values.join(' → ');
        await animateNode(n, 280);
        highlighted = new Set();
        visitedSet.add(n);
        draw();
        await sleep(80);
    }

    highlighted = new Set();
    draw();
    animating = false;
});

//   Init   
window.addEventListener('resize', resizeCanvas);
resizeCanvas();