// app.js
import { initialCustomTemplates } from './strokesData.js';

let strokeId = 0;       // Unique ID tracker per discrete stroke path
let strokesHistory = []; // Complete list of strokes drawn for structural tracking
let redoStack = [];     // Stored arrays of stroke items for redo actions
let isDrawing = false;  // Mouse/Touch tracking flag

// --- DOM Elements ---
const canvas = document.getElementById('drawCanvas');
const canvas_size = 500;
const ctx = canvas.getContext('2d');
const chkShowPoints = document.getElementById('chkShowPoints');
const chkShowStrokes = document.getElementById('chkShowStrokes');
const gestureNameInput = document.getElementById('gestureName');
const scoreDisplay = document.getElementById('score');
const templateListContainer = document.getElementById('templateList');

const strokeColors = ["#060607"];

// --- Initialize $P Recognizer Engine Instance from pdollar---
let recognizer = new PDollarRecognizer();

// --- 2. LocalStorage Sync Initialization Function ---
function initCustomTemplates() {
    // Reset runtime active templates stack safely to avoid compounding duplicates
    recognizer.PointClouds = [];

    let savedTemplates = localStorage.getItem('custom_stroke');
    let templatesArr = [];

    if (savedTemplates) {
        try {
            templatesArr = JSON.parse(savedTemplates);
        } catch(e) {
            console.error("Failed parsing stored custom templates", e);
        }
    }

    // Checks strokesData.js array and add missing ones into the localStorage array
    let updatedLocalStorage = false;
    
    initialCustomTemplates.forEach(templateData => {
        // Check if this specific template name already exists in localStorage
        const alreadyExists = templatesArr.some(t => t.name === templateData.name);
        
        if (!alreadyExists) {
            // Compile the vector points to absolute pixels
            const compiledPoints = parseCustomJsonTemplate(templateData, 500);
            let cleanPoints = compiledPoints.map(p => ({ X: p.X, Y: p.Y, ID: p.ID }));
            
            // Push it into local runtime array
            templatesArr.push({ name: templateData.name, points: cleanPoints });
            updatedLocalStorage = true;
        }
    });

    // If it detects new data, update the storage. (because of this delete is broken.)
    if (updatedLocalStorage) {
        localStorage.setItem('custom_stroke', JSON.stringify(templatesArr));
    }

    // Finally, load everything seamlessly into your $P recognizer engine instance
    templatesArr.forEach(t => {
        let pointCloud = t.points.map(p => new Point(p.X, p.Y, p.ID));
        recognizer.AddGesture(t.name, pointCloud);
    });

    renderTemplateList();
}

// --- 3. Persistent Storage Mutation Actions ---
function saveTemplateToStorage(name, pointsArray) {
    let savedTemplates = localStorage.getItem('custom_stroke');
    let templatesArr = savedTemplates ? JSON.parse(savedTemplates) : [];
    
    let cleanPoints = pointsArray.map(p => ({ X: p.X, Y: p.Y, ID: p.ID }));
    templatesArr.push({ name: name, points: cleanPoints });
    
    localStorage.setItem('custom_stroke', JSON.stringify(templatesArr));
    initCustomTemplates(); // Re-compile full stack
}

window.clearSpecificTemplate = function(index) {
    let savedTemplates = localStorage.getItem('custom_stroke');
    if (savedTemplates) {
        let templatesArr = JSON.parse(savedTemplates);
        templatesArr.splice(index, 1);
        localStorage.setItem('custom_stroke', JSON.stringify(templatesArr));
        
        initCustomTemplates(); // Re-sync active runtime arrays
    }
};

function renderTemplateList() {
    templateListContainer.innerHTML = '';
    let savedTemplates = localStorage.getItem('custom_stroke');
    let runtimeTemplatesCount = recognizer.PointClouds.length;

    let baseHeader = document.createElement('div');
    baseHeader.style.fontWeight = 'bold';
    baseHeader.style.marginBottom = '5px';
    baseHeader.innerText = `Total templates compiled active: ${runtimeTemplatesCount}`;
    templateListContainer.appendChild(baseHeader);

    if (savedTemplates) {
        let arr = JSON.parse(savedTemplates);
        arr.forEach((item, idx) => {
            let div = document.createElement('div');
            div.className = 'template-item';
            div.innerHTML = `
                <span><strong>${item.name}</strong> (${item.points.length} pts) [Custom]</span>
                <button class="danger" onclick="clearSpecificTemplate(${idx})">Delete</button>
            `;
            templateListContainer.appendChild(div);
        });
    }
}

// ---redraw when changes in option selected by user ---
function redrawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (strokesHistory.length === 0) return;

    if (chkShowStrokes.checked) {
        let currentStrokeId = -1;
        ctx.lineWidth = 3;
        strokesHistory.forEach((pt) => {
            if (pt.ID !== currentStrokeId) {
                if (currentStrokeId !== -1) ctx.stroke();
                currentStrokeId = pt.ID;
                ctx.beginPath();
                ctx.strokeStyle = strokeColors[currentStrokeId % strokeColors.length];
                ctx.moveTo(pt.X, pt.Y);
            } else {
                ctx.lineTo(pt.X, pt.Y);
            }
        });
        ctx.stroke();
    }

    if (chkShowPoints.checked) {
        strokesHistory.forEach((pt) => {
            ctx.fillStyle = strokeColors[pt.ID % strokeColors.length];
            ctx.beginPath();
            ctx.arc(pt.X, pt.Y, 3, 0, Math.PI * 2);
            ctx.fill();
        });
    }
}

// ---Coordinates---
function getCanvasMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    let clientX = (e.touches && e.touches.length > 0) ? e.touches.clientX : e.clientX;
    let clientY = (e.touches && e.touches.length > 0) ? e.touches.clientY : e.clientY;
    return {
        x: clientX - rect.left,
        y: clientY - rect.top
    };
}

function handleStart(e) {
    e.preventDefault();
    isDrawing = true;
    redoStack = []; 
    strokeId++;
    
    let pos = getCanvasMousePos(e);
    let p = new Point(pos.x, pos.y, strokeId);
    strokesHistory.push(p);
    redrawCanvas();
}

function handleMove(e) {
    if (!isDrawing) return;
    e.preventDefault();
    
    let pos = getCanvasMousePos(e);
    let p = new Point(pos.x, pos.y, strokeId);
    strokesHistory.push(p);
    redrawCanvas();
}

function handleEnd() {
    if (!isDrawing) return;
    isDrawing = false;
}

//changes fromate of strokesData.js to $P compatible formate.
function parseCustomJsonTemplate(templateData, scaleSize = canvas_size) {
    let parsedPoints = [];
    templateData.strokes.forEach((strokeArray, index) => {
        let currentStrokeId = index + 1; 
        strokeArray.forEach(pt => {
            let absoluteX = pt.x * scaleSize;
            let absoluteY = pt.y * scaleSize;
            parsedPoints.push(new Point(absoluteX, absoluteY, currentStrokeId));
        });
    });
    return parsedPoints;
}

// --- Input Handlers---
canvas.addEventListener('mousedown', handleStart);
canvas.addEventListener('mousemove', handleMove);
window.addEventListener('mouseup', handleEnd);

canvas.addEventListener('touchstart', handleStart, { passive: false });
canvas.addEventListener('touchmove', handleMove, { passive: false });
window.addEventListener('touchend', handleEnd);



// undo redo save buttons below.

document.getElementById('btnClear').addEventListener('click', () => {
    strokesHistory = [];
    redoStack = [];
    strokeId = 0;
    scoreDisplay.innerHTML = "Canvas Reset. Draw again.";
    redrawCanvas();
});

document.getElementById('btnUndo').addEventListener('click', () => {
    if (strokesHistory.length === 0) return;
    let targetUndoId = strokesHistory[strokesHistory.length - 1].ID;
    let undoneStroke = [];
    while (strokesHistory.length > 0 && strokesHistory[strokesHistory.length - 1].ID === targetUndoId) {
        undoneStroke.unshift(strokesHistory.pop());
    }
    redoStack.push(undoneStroke);
    strokeId = strokesHistory.length > 0 ? strokesHistory[strokesHistory.length - 1].ID : 0;
    redrawCanvas();
});

document.getElementById('btnRedo').addEventListener('click', () => {
    if (redoStack.length === 0) return;
    let redoingStroke = redoStack.pop();
    strokesHistory = strokesHistory.concat(redoingStroke);
    strokeId = strokesHistory[strokesHistory.length - 1].ID;
    redrawCanvas();
});

chkShowPoints.addEventListener('change', redrawCanvas);
chkShowStrokes.addEventListener('change', redrawCanvas);

document.getElementById('btnRecognize').addEventListener('click', () => {
    if (strokesHistory.length < 4) {
        scoreDisplay.innerHTML = "<span style='color:#e74c3c;'>Need more geometric data points.</span>";
        return;
    }
    let result = recognizer.Recognize(strokesHistory);
    let confidencePct = (result.Score * 100).toFixed(1);

     scoreDisplay.innerHTML = `
        Matched: <span style="color:#2ecc71;">"${result.Name}"</span><br>
        Confidence: <span style="color:#3498db;">${confidencePct}%</span>
    `

    //if (confidencePct > 65){
    //     scoreDisplay.innerHTML = `
    //    Matched: <span style="color:#2ecc71;">"${result.Name}"</span><br>
    //    Confidence: <span style="color:#3498db;">${confidencePct}%</span>
    //`;
    //}else{
    //     scoreDisplay.innerHTML = `
    //    Matched: <span style="color:#2ecc71;">"didn't find any matching. try adding it to list."</span><br>
    //`
    //} can be implemented later.
   
});

document.getElementById('btnSave').addEventListener('click', () => {
    let name = gestureNameInput.value.trim();
    if (!name) {
        alert("Please assign a classification name for this structural shape template.");
        return;
    }
    if (strokesHistory.length < 5) {
        alert("The canvas lacks sufficient line structural density. Draw a more concrete shape profile.");
        return;
    }
    saveTemplateToStorage(name, strokesHistory);
    gestureNameInput.value = '';
    alert(`Template successfully written to storage under label "${name}"!`);
});

// main
window.addEventListener('DOMContentLoaded', () => {
    initCustomTemplates();
});