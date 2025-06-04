document.addEventListener('DOMContentLoaded', () => {
    // Screen Elements
    const homeScreen = document.getElementById('home-screen');
    const gameScreen = document.getElementById('game-screen');
    const playVsPlayerButton = document.getElementById('play-vs-player-button');
    const playVsBotButton = document.getElementById('play-vs-bot-button');
    const exitButton = document.getElementById('exit-button');
    const menuButton = document.getElementById('menu-button');
    const settingsButton = document.getElementById('settings-button');
    
    // Game board
    const gameBoard = document.querySelector('.game-board');
    
    // Game variables
    let currentPlayer = 1; // 1 = red, 2 = blue
    let playerScores = [0, 0];
    const boardSize = { rows: 5, cols: 6 };
    let isDragging = false;
    let startDot = null;
    let currentLine = null;
    let playingVsBot = false;
    let soundEnabled = true; // Sound toggle state
    
    // Audio elements
    const buttonClickSound = new Audio('audio/212-preview.mp3');
    const lineDrawSound = new Audio('audio/1115-preview.mp3');
    const winSound = new Audio('audio/2352-preview.mp3.mp3');
    const loseSound = new Audio('audio/2004-preview.mp3.mp3');
    const boxCompleteSound = new Audio('audio/2884-preview.mp3');
    
    // Helper function to play sound only if enabled
    function playSound(sound) {
        if (soundEnabled) {
            sound.currentTime = 0;
            sound.play();
        }
    }
    
    // Initialize game
    function initGame() {
        // Create game board grid with dots and lines
        createGameBoard();
        
        // Set up event listeners
        setupEventListeners();
        
        // Update UI for initial state
        updatePlayerTurn();
        updateScores();
    }
    
    // Create game board with dots, lines, and boxes
    function createGameBoard() {
        // Clear existing board
        gameBoard.innerHTML = '';
        
        // Create internal grid container 
        const gridContainer = document.createElement('div');
        gridContainer.className = 'grid-container';
        gameBoard.appendChild(gridContainer);
        
        // Create dots
        for (let row = 0; row < boardSize.rows + 1; row++) {
            for (let col = 0; col < boardSize.cols + 1; col++) {
                const dot = document.createElement('div');
                dot.className = 'dot';
                // Adjust positioning to avoid edge clipping
                const adjustedCol = col * (100 / boardSize.cols);
                const adjustedRow = row * (100 / boardSize.rows);
                dot.style.left = `${adjustedCol}%`;
                dot.style.top = `${adjustedRow}%`;
                dot.dataset.row = row;
                dot.dataset.col = col;
                
                // Add drag event listeners for mouse and touch
                dot.addEventListener('mousedown', (e) => startDrag(e, dot));
                dot.addEventListener('mouseup', (e) => endDrag(e, dot));
                dot.addEventListener('touchstart', (e) => startDrag(e, dot));
                dot.addEventListener('touchend', (e) => endDrag(e, dot));
                
                gridContainer.appendChild(dot);
                
                // Create horizontal lines (except last row)
                if (col < boardSize.cols) {
                    createLine('horizontal', row, col);
                }
                
                // Create vertical lines (except last column)
                if (row < boardSize.rows) {
                    createLine('vertical', row, col);
                }
            }
        }
    }
    
    // Create a line (horizontal or vertical)
    function createLine(orientation, row, col) {
        const gridContainer = document.querySelector('.grid-container');
        const line = document.createElement('div');
        line.className = `${orientation}-line`;
        line.dataset.row = row;
        line.dataset.col = col;
        line.dataset.orientation = orientation;
        
        if (orientation === 'horizontal') {
            line.style.width = `${100 / boardSize.cols}%`;
            line.style.left = `${col * (100 / boardSize.cols)}%`;
            line.style.top = `${row * (100 / boardSize.rows)}%`;
            line.style.opacity = '0.5';
        } else {
            line.style.height = `${100 / boardSize.rows}%`;
            line.style.left = `${col * (100 / boardSize.cols)}%`;
            line.style.top = `${row * (100 / boardSize.rows)}%`;
            line.style.opacity = '0.5';
        }
        
        gridContainer.appendChild(line);
    }
    
    // Start dragging from a dot
    function startDrag(e, dot) {
        e.preventDefault();
        
        // If it's bot's turn, prevent player from dragging
        if (playingVsBot && currentPlayer === 2) return;
        
        // Set dragging state and store starting dot
        isDragging = true;
        startDot = {
            row: parseInt(dot.dataset.row),
            col: parseInt(dot.dataset.col),
            element: dot
        };
        
        // For touch events, capture the touch
        if (e.type === 'touchstart') {
            e.target.style.touchAction = 'none';
        }
        
        // Show visual feedback for active dot
        dot.classList.add('active');
        
        // Highlight potential connection dots
        highlightPotentialConnections(startDot.row, startDot.col);
        
        // Create a temporary line element for visual feedback during drag
        currentLine = document.createElement('div');
        currentLine.className = 'temp-line';
        const gridContainer = document.querySelector('.grid-container');
        gridContainer.appendChild(currentLine);
        
        // Add mousemove and touchmove listeners to the game board
        gridContainer.addEventListener('mousemove', updateDragLine);
        gridContainer.addEventListener('touchmove', updateDragLine);
    }
    
    // Highlight dots that can be connected to the selected dot
    function highlightPotentialConnections(row, col) {
        // Define the four possible adjacent positions
        const adjacentPositions = [
            { row: row-1, col: col },    // Up
            { row: row+1, col: col },    // Down
            { row: row, col: col-1 },    // Left
            { row: row, col: col+1 }     // Right
        ];
        
        // Display visual hint for mobile users
        gameBoard.classList.add('active-selection');
        
        // Highlight each valid adjacent dot
        adjacentPositions.forEach(pos => {
            // Check if position is within board boundaries
            if (pos.row >= 0 && pos.row <= boardSize.rows && 
                pos.col >= 0 && pos.col <= boardSize.cols) {
                
                // Find the dot at this position
                const adjacentDot = document.querySelector(`.dot[data-row="${pos.row}"][data-col="${pos.col}"]`);
                
                if (adjacentDot) {
                    // Check if there's already a line connecting these dots
                    let lineExists = false;
                    
                    if (row === pos.row) { // Horizontal
                        const minCol = Math.min(col, pos.col);
                        const line = document.querySelector(`.horizontal-line[data-row="${row}"][data-col="${minCol}"]`);
                        lineExists = line && line.classList.contains('selected');
                    } else if (col === pos.col) { // Vertical
                        const minRow = Math.min(row, pos.row);
                        const line = document.querySelector(`.vertical-line[data-row="${minRow}"][data-col="${col}"]`);
                        lineExists = line && line.classList.contains('selected');
                    }
                    
                    // Only highlight if line doesn't already exist
                    if (!lineExists) {
                        adjacentDot.classList.add('potential-connection');
                    }
                }
            }
        });
    }
    
    // Update temporary line during drag
    function updateDragLine(e) {
        if (!isDragging || !startDot || !currentLine) return;
        
        // Prevent default behavior for touch events
        if (e.type === 'touchmove') {
            e.preventDefault();
        }
        
        // Get position relative to grid container (works for both mouse and touch)
        const gridContainer = document.querySelector('.grid-container');
        const rect = gridContainer.getBoundingClientRect();
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        const mouseX = clientX - rect.left;
        const mouseY = clientY - rect.top;
        
        // Calculate start dot position
        const startX = startDot.col * (100 / boardSize.cols) * rect.width / 100;
        const startY = startDot.row * (100 / boardSize.rows) * rect.height / 100;
        
        // Calculate length and angle
        const dx = mouseX - startX;
        const dy = mouseY - startY;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        
        // Style the line
        currentLine.style.width = `${length}px`;
        currentLine.style.height = '8px';
        currentLine.style.left = `${startX}px`;
        currentLine.style.top = `${startY}px`;
        currentLine.style.transformOrigin = 'left center';
        currentLine.style.transform = `rotate(${angle}deg)`;
        currentLine.style.backgroundColor = currentPlayer === 1 ? '#ff4757' : '#2e86de';
    }
    
    // End dragging on a dot
    function endDrag(e, dot) {
        if (!isDragging || !startDot) return;
        
        // For touch events, get the correct element if we're not directly on a dot
        if (e.type === 'touchend' && e.changedTouches) {
            const touch = e.changedTouches[0];
            const elementAtTouch = document.elementFromPoint(touch.clientX, touch.clientY);
            if (elementAtTouch && elementAtTouch.classList.contains('dot')) {
                dot = elementAtTouch;
            }
        }
        
        const endRow = parseInt(dot.dataset.row);
        const endCol = parseInt(dot.dataset.col);
        
        // Check if end dot is different from start dot
        if (startDot.row !== endRow || startDot.col !== endCol) {
            // Check if the dots are adjacent
            const rowDiff = Math.abs(startDot.row - endRow);
            const colDiff = Math.abs(startDot.col - endCol);
            
            // Dots must be adjacent (horizontally or vertically)
            if ((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)) {
                // Find which line to select
                let orientation, lineRow, lineCol;
                
                if (rowDiff === 0) { // Horizontal line
                    orientation = 'horizontal';
                    lineRow = endRow;
                    lineCol = Math.min(startDot.col, endCol);
                } else { // Vertical line
                    orientation = 'vertical';
                    lineRow = Math.min(startDot.row, endRow);
                    lineCol = endCol;
                }
                
                // Find the line element
                const line = document.querySelector(`.${orientation}-line[data-row="${lineRow}"][data-col="${lineCol}"]`);
                
                if (line && !line.classList.contains('selected')) {
                    // Select the line
                    drawLine(line);
                }
            }
        }
        
        // Clean up
        cleanupDrag();
    }
    
    // Draw a line and handle game logic
    function drawLine(line) {
        line.classList.add('selected');
        // Set color based on current player
        line.style.backgroundColor = currentPlayer === 1 ? '#ff4757' : '#2e86de';
        
        // Play line drawing sound
        playSound(lineDrawSound);
        
        // Check if a box is completed
        const boxesCompleted = checkBoxCompletion(line);
        
        // If no boxes completed, switch player
        if (!boxesCompleted) {
            switchPlayer();
            
            // If playing against bot and it's bot's turn, make a move
            if (playingVsBot && currentPlayer === 2) {
                setTimeout(makeBotMove, 750); // Delay bot move for better UX
            }
        } else {
            // If playing against bot and it's bot's turn after completing a box, make a move
            if (playingVsBot && currentPlayer === 2) {
                setTimeout(makeBotMove, 750); // Delay bot move for better UX
            }
        }
        
        // Update UI
        updatePlayerTurn();
        updateScores();
        
        // Check if game is over
        if (isGameOver()) {
            handleGameOver();
        }
    }
    
    // Clean up after drag ends
    function cleanupDrag() {
        // Remove temporary line
        if (currentLine) {
            currentLine.remove();
            currentLine = null;
        }
        
        // Remove active class from dots
        if (startDot && startDot.element) {
            startDot.element.classList.remove('active');
        }
        
        // Remove potential-connection class from all dots
        const potentialDots = document.querySelectorAll('.dot.potential-connection');
        potentialDots.forEach(dot => {
            dot.classList.remove('potential-connection');
            // Reset touch action
            dot.style.touchAction = '';
        });
        
        // Reset drag state
        isDragging = false;
        startDot = null;
        
        // Remove active-selection class from game board
        gameBoard.classList.remove('active-selection');
        
        // Remove event listeners
        const gridContainer = document.querySelector('.grid-container');
        if (gridContainer) {
            gridContainer.removeEventListener('mousemove', updateDragLine);
            gridContainer.removeEventListener('touchmove', updateDragLine);
        }
    }
    
    // Check if selecting a line completes one or more boxes
    function checkBoxCompletion(line) {
        const row = parseInt(line.dataset.row);
        const col = parseInt(line.dataset.col);
        const orientation = line.dataset.orientation;
        let boxesCompleted = 0;
        
        if (orientation === 'horizontal') {
            // Check box above
            if (row > 0) {
                if (isBoxComplete(row - 1, col)) {
                    completeBox(row - 1, col);
                    boxesCompleted++;
                }
            }
            
            // Check box below
            if (row < boardSize.rows) {
                if (isBoxComplete(row, col)) {
                    completeBox(row, col);
                    boxesCompleted++;
                }
            }
        } else { // vertical
            // Check box to the left
            if (col > 0) {
                if (isBoxComplete(row, col - 1)) {
                    completeBox(row, col - 1);
                    boxesCompleted++;
                }
            }
            
            // Check box to the right
            if (col < boardSize.cols) {
                if (isBoxComplete(row, col)) {
                    completeBox(row, col);
                    boxesCompleted++;
                }
            }
        }
        
        return boxesCompleted > 0;
    }
    
    // Check if a box is complete (all 4 sides selected)
    function isBoxComplete(row, col) {
        // Check all four lines around the box
        const topLine = document.querySelector(`.horizontal-line[data-row="${row}"][data-col="${col}"]`);
        const bottomLine = document.querySelector(`.horizontal-line[data-row="${row + 1}"][data-col="${col}"]`);
        const leftLine = document.querySelector(`.vertical-line[data-row="${row}"][data-col="${col}"]`);
        const rightLine = document.querySelector(`.vertical-line[data-row="${row}"][data-col="${col + 1}"]`);
        
        return (
            topLine && topLine.classList.contains('selected') &&
            bottomLine && bottomLine.classList.contains('selected') &&
            leftLine && leftLine.classList.contains('selected') &&
            rightLine && rightLine.classList.contains('selected')
        );
    }
    
    // Complete a box and assign it to the current player
    function completeBox(row, col) {
        // Create a box element
        const gridContainer = document.querySelector('.grid-container');
        const box = document.createElement('div');
        box.className = 'completed-box';
        box.style.left = `${col * (100 / boardSize.cols)}%`;
        box.style.top = `${row * (100 / boardSize.rows)}%`;
        box.style.width = `${100 / boardSize.cols}%`;
        box.style.height = `${100 / boardSize.rows}%`;
        box.style.backgroundColor = currentPlayer === 1 ? 'rgba(255, 71, 87, 0.3)' : 'rgba(46, 134, 222, 0.3)';
        
        gridContainer.appendChild(box);
        
        // Play box complete sound
        playSound(boxCompleteSound);
        
        // Increment score for current player
        playerScores[currentPlayer - 1]++;
        
        // Apply the player's color to the box
        box.style.backgroundColor = currentPlayer === 1 ? 'rgba(255, 71, 87, 0.3)' : 'rgba(46, 134, 222, 0.3)';
    }
    
    // Switch to the other player
    function switchPlayer() {
        currentPlayer = currentPlayer === 1 ? 2 : 1;
    }
    
    // Update UI to reflect current player's turn
    function updatePlayerTurn() {
        const playerIcon = document.querySelector('.turn-indicator .player-icon');
        playerIcon.style.backgroundColor = currentPlayer === 1 ? '#ff4757' : '#2e86de';
    }
    
    // Update the score display
    function updateScores() {
        const scoreElements = document.querySelectorAll('.player-score .score');
        scoreElements[0].textContent = playerScores[0];
        scoreElements[1].textContent = playerScores[1];
    }
    
    // Check if the game is over (all boxes completed)
    function isGameOver() {
        const totalBoxes = boardSize.rows * boardSize.cols;
        return (playerScores[0] + playerScores[1] >= totalBoxes);
    }
    
    // Handle game over state
    function handleGameOver() {
        // Get popup elements
        const popup = document.getElementById('game-over-popup');
        const resultMessage = document.getElementById('result-message');
        const player1FinalScore = document.getElementById('player1-final-score');
        const player2FinalScore = document.getElementById('player2-final-score');
        const playAgainButton = document.getElementById('play-again-button');
        const mainMenuButton = document.getElementById('main-menu-button');
        
        // Set final scores
        player1FinalScore.textContent = playerScores[0];
        player2FinalScore.textContent = playerScores[1];
        
        // Determine winner and set result message
        let winnerMessage;
        
        if (playerScores[0] > playerScores[1]) {
            winnerMessage = playingVsBot ? "You win!" : "Red player wins!";
            playSound(winSound);
        } else if (playerScores[1] > playerScores[0]) {
            winnerMessage = playingVsBot ? "Bot wins!" : "Blue player wins!";
            if (playingVsBot) {
                playSound(loseSound);
            } else {
                playSound(winSound);
            }
        } else {
            winnerMessage = "It's a tie!";
            playSound(winSound);
        }
        
        resultMessage.textContent = winnerMessage;
        
        // Show the popup
        setTimeout(() => {
            popup.classList.add('active');
        }, 500);
    }
    
    // Bot logic
    function makeBotMove() {
        // Find all available lines
        const availableLines = [];
        
        // Check horizontal lines
        document.querySelectorAll('.horizontal-line').forEach(line => {
            if (!line.classList.contains('selected')) {
                availableLines.push(line);
            }
        });
        
        // Check vertical lines
        document.querySelectorAll('.vertical-line').forEach(line => {
            if (!line.classList.contains('selected')) {
                availableLines.push(line);
            }
        });
        
        // If no lines available, return
        if (availableLines.length === 0) return;
        
        // Look for moves that complete a box
        const completingMoves = findCompletingMoves(availableLines);
        
        // If there are completing moves, choose one randomly
        if (completingMoves.length > 0) {
            const randomIndex = Math.floor(Math.random() * completingMoves.length);
            drawLine(completingMoves[randomIndex]);
            return;
        }
        
        // If no completing moves, look for safe moves (that don't set up a box for the opponent)
        const safeMoves = findSafeMoves(availableLines);
        
        // If there are safe moves, choose one randomly
        if (safeMoves.length > 0) {
            const randomIndex = Math.floor(Math.random() * safeMoves.length);
            drawLine(safeMoves[randomIndex]);
            return;
        }
        
        // If no safe moves, choose a random move
        const randomIndex = Math.floor(Math.random() * availableLines.length);
        drawLine(availableLines[randomIndex]);
    }
    
    // Find moves that complete a box
    function findCompletingMoves(availableLines) {
        const completingMoves = [];
        
        for (const line of availableLines) {
            const row = parseInt(line.dataset.row);
            const col = parseInt(line.dataset.col);
            const orientation = line.dataset.orientation;
            
            // Check if adding this line completes a box
            if (orientation === 'horizontal') {
                // Check box above
                if (row > 0 && isAlmostComplete(row - 1, col, line)) {
                    completingMoves.push(line);
                    continue;
                }
                
                // Check box below
                if (row < boardSize.rows && isAlmostComplete(row, col, line)) {
                    completingMoves.push(line);
                    continue;
                }
            } else { // vertical
                // Check box to the left
                if (col > 0 && isAlmostComplete(row, col - 1, line)) {
                    completingMoves.push(line);
                    continue;
                }
                
                // Check box to the right
                if (col < boardSize.cols && isAlmostComplete(row, col, line)) {
                    completingMoves.push(line);
                    continue;
                }
            }
        }
        
        return completingMoves;
    }
    
    // Check if a box is one line away from completion (has 3 sides filled)
    function isAlmostComplete(row, col, excludeLine) {
        // Get all four lines around the box
        const topLine = document.querySelector(`.horizontal-line[data-row="${row}"][data-col="${col}"]`);
        const bottomLine = document.querySelector(`.horizontal-line[data-row="${row + 1}"][data-col="${col}"]`);
        const leftLine = document.querySelector(`.vertical-line[data-row="${row}"][data-col="${col}"]`);
        const rightLine = document.querySelector(`.vertical-line[data-row="${row}"][data-col="${col + 1}"]`);
        
        // Count how many lines are already selected (excluding the current line)
        let selectedCount = 0;
        
        if (topLine && topLine !== excludeLine && topLine.classList.contains('selected')) selectedCount++;
        if (bottomLine && bottomLine !== excludeLine && bottomLine.classList.contains('selected')) selectedCount++;
        if (leftLine && leftLine !== excludeLine && leftLine.classList.contains('selected')) selectedCount++;
        if (rightLine && rightLine !== excludeLine && rightLine.classList.contains('selected')) selectedCount++;
        
        // If 3 lines are selected, adding the current line will complete the box
        return selectedCount === 3;
    }
    
    // Find moves that don't set up a box for the opponent
    function findSafeMoves(availableLines) {
        return availableLines.filter(line => {
            const row = parseInt(line.dataset.row);
            const col = parseInt(line.dataset.col);
            const orientation = line.dataset.orientation;
            
            // Add the line temporarily to check if it creates a 3-sided box
            line.classList.add('selected');
            
            let isSafe = true;
            
            // Check if adding this line creates a 3-sided box
            if (orientation === 'horizontal') {
                // Check box above
                if (row > 0 && isAlmostComplete(row - 1, col, null)) {
                    isSafe = false;
                }
                
                // Check box below
                if (isSafe && row < boardSize.rows && isAlmostComplete(row, col, null)) {
                    isSafe = false;
                }
            } else { // vertical
                // Check box to the left
                if (col > 0 && isAlmostComplete(row, col - 1, null)) {
                    isSafe = false;
                }
                
                // Check box to the right
                if (isSafe && col < boardSize.cols && isAlmostComplete(row, col, null)) {
                    isSafe = false;
                }
            }
            
            // Remove the temporary line
            line.classList.remove('selected');
            
            return isSafe;
        });
    }
    
    // Setup event listeners for buttons
    function setupEventListeners() {
        // Home screen buttons
        playVsPlayerButton.addEventListener('click', () => {
            playSound(buttonClickSound);
            playingVsBot = false;
            showGameScreen();
        });
        
        playVsBotButton.addEventListener('click', () => {
            playSound(buttonClickSound);
            playingVsBot = true;
            showGameScreen();
        });
        
        exitButton.addEventListener('click', () => {
            playSound(buttonClickSound);
            // In a real app, this might close the window or go to another page
            alert('Thanks for playing!');
        });
        
        // Game screen buttons
        menuButton.addEventListener('click', () => {
            playSound(buttonClickSound);
            showHomeScreen();
        });
        
        settingsButton.addEventListener('click', () => {
            playSound(buttonClickSound);
            showSettingsPopup();
        });
        
        // Game over popup buttons
        const playAgainButton = document.getElementById('play-again-button');
        const mainMenuButton = document.getElementById('main-menu-button');
        
        playAgainButton.addEventListener('click', () => {
            playSound(buttonClickSound);
            const popup = document.getElementById('game-over-popup');
            popup.classList.remove('active');
            showGameScreen(); // Restart the game
        });
        
        mainMenuButton.addEventListener('click', () => {
            playSound(buttonClickSound);
            const popup = document.getElementById('game-over-popup');
            popup.classList.remove('active');
            showHomeScreen(); // Go back to main menu
        });
        
        // Settings popup buttons and controls
        const settingsPopup = document.getElementById('settings-popup');
        const soundToggle = document.getElementById('sound-toggle');
        const closeSettingsButton = document.getElementById('close-settings-button');
        const restartGameButton = document.getElementById('restart-game-button');
        const exitGameButton = document.getElementById('exit-game-button');
        
        // Initialize sound toggle based on current setting
        soundToggle.checked = soundEnabled;
        
        // Sound toggle event listener
        soundToggle.addEventListener('change', () => {
            soundEnabled = soundToggle.checked;
            // Play a sound to confirm if sound is enabled
            if (soundEnabled) {
                playSound(buttonClickSound);
            }
        });
        
        closeSettingsButton.addEventListener('click', () => {
            playSound(buttonClickSound);
            settingsPopup.classList.remove('active');
        });
        
        restartGameButton.addEventListener('click', () => {
            playSound(buttonClickSound);
            settingsPopup.classList.remove('active');
            showGameScreen(); // Restart the game
        });
        
        exitGameButton.addEventListener('click', () => {
            playSound(buttonClickSound);
            settingsPopup.classList.remove('active');
            showHomeScreen(); // Go back to main menu
        });
        
        // Add global mouseup and touchend events to handle when interaction ends outside a dot
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                cleanupDrag();
            }
        });
        document.addEventListener('touchend', () => {
            if (isDragging) {
                cleanupDrag();
            }
        });
    }
    
    // Show home screen
    function showHomeScreen() {
        homeScreen.classList.add('active');
        gameScreen.classList.remove('active');
        
        // Hide the game over popup if it's visible
        const popup = document.getElementById('game-over-popup');
        popup.classList.remove('active');
        
        // Hide the settings popup if it's visible
        const settingsPopup = document.getElementById('settings-popup');
        settingsPopup.classList.remove('active');
    }
    
    // Show game screen and start game
    function showGameScreen() {
        homeScreen.classList.remove('active');
        gameScreen.classList.add('active');
        
        // Reset game state
        currentPlayer = 1;
        playerScores = [0, 0];
        
        // Initialize the game board
        createGameBoard();
        updatePlayerTurn();
        updateScores();
    }
    
    // Show settings popup
    function showSettingsPopup() {
        const settingsPopup = document.getElementById('settings-popup');
        settingsPopup.classList.add('active');
    }
    
    // Initialize the game
    initGame();
});