import React, { useRef, useState } from "react";
import { useGame } from "../contexts/GameContext";
import { motion, AnimatePresence } from "framer-motion";

const GameBoard: React.FC = () => {
  const { gameState, drawLine } = useGame();
  const [hoveredLine, setHoveredLine] = useState<string | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  if (!gameState) return null;

  const { rows, cols } = gameState.boardSize;
  const dotSize = 8;
  const lineWidth = 4;
  const cellSize = 60;
  const boardWidth = cols * cellSize + dotSize;
  const boardHeight = rows * cellSize + dotSize;

  const getPlayerColor = (playerId?: number) => {
    if (playerId === undefined) return "rgba(200, 200, 200, 0.1)";
    return gameState.players.find(p => p.id === playerId)?.color || "#f3f4f6";
  };

  const currentPlayer = gameState.players[gameState.currentPlayerId];

  const handleLineClick = (lineId: string) => {
    if (!gameState) return;
    const line = gameState.lines.find(l => l.id === lineId);
    if (line && line.drawn) return;
    drawLine(lineId);
  };

  return (
    <div className="relative flex flex-col items-center p-4">
      <motion.div 
        className="mb-6 px-6 py-3 rounded-full flex items-center gap-3 text-white font-medium text-lg shadow-lg"
        style={{ 
          background: `linear-gradient(135deg, ${currentPlayer.color} 0%, ${currentPlayer.color}80 100%)`
        }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          animate={{ 
            rotate: [0, 10, -10, 0],
            transition: { repeat: Infinity, duration: 2 }
          }}
        >
          {currentPlayer.type === "human" ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect width="14" height="14" x="5" y="5" rx="2"/>
              <path d="M15 2v3"/><path d="M15 19v3"/>
              <path d="M22 15h-3"/><path d="M5 15H2"/>
            </svg>
          )}
        </motion.div>
        <motion.span
          key={currentPlayer.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {currentPlayer.name}'s Turn
        </motion.span>
      </motion.div>

      <motion.div 
        ref={boardRef}
        className="relative rounded-xl shadow-2xl p-8"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        style={{ 
          width: boardWidth + 40, 
          height: boardHeight + 40,
          backgroundImage: "url('/assets/wood-background.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
      >
        {Array.from({ length: (rows + 1) * (cols + 1) }).map((_, index) => {
          const r = Math.floor(index / (cols + 1));
          const c = index % (cols + 1);
          const x = c * cellSize;
          const y = r * cellSize;
          
          return (
            <motion.div
              key={`dot-${r}-${c}`}
              className="absolute bg-gray-700 rounded-full shadow-sm"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1 * (r + c) }}
              style={{
                left: x - dotSize/2 + 20,
                top: y - dotSize/2 + 20,
                width: dotSize,
                height: dotSize,
                zIndex: 20
              }}
            />
          );
        })}
        
        {gameState.lines.filter(line => line.isHorizontal).map((line) => {
          const x = line.col * cellSize;
          const y = line.row * cellSize;
          const isHovered = hoveredLine === line.id;
          
          return (
            <motion.div
              key={line.id}
              className="absolute cursor-pointer"
              style={{
                left: x + dotSize/2 + 20,
                top: y - lineWidth/2 + 20,
                width: cellSize - dotSize,
                height: lineWidth,
                zIndex: 10
              }}
              onMouseEnter={() => setHoveredLine(line.id)}
              onMouseLeave={() => setHoveredLine(null)}
              onClick={() => !line.drawn && handleLineClick(line.id)}
              whileHover={{ scale: 1.05 }}
            >
              <motion.div
                className="h-full rounded-sm"
                initial={{ 
                  backgroundColor: line.drawn ? getPlayerColor(line.playerId) : "rgba(200, 200, 200, 0.3)",
                  scale: line.drawn ? 1 : 0.9
                }}
                animate={{ 
                  backgroundColor: isHovered && !line.drawn ? currentPlayer.color + "80" : 
                    line.drawn ? getPlayerColor(line.playerId) : "rgba(200, 200, 200, 0.3)",
                  scale: isHovered && !line.drawn ? 1.1 : line.drawn ? 1 : 0.9
                }}
                transition={{ duration: 0.2 }}
              />
            </motion.div>
          );
        })}
        
        {gameState.lines.filter(line => !line.isHorizontal).map((line) => {
          const x = line.col * cellSize;
          const y = line.row * cellSize;
          const isHovered = hoveredLine === line.id;
          
          return (
            <motion.div
              key={line.id}
              className="absolute cursor-pointer"
              style={{
                left: x - lineWidth/2 + 20,
                top: y + dotSize/2 + 20,
                width: lineWidth,
                height: cellSize - dotSize,
                zIndex: 10
              }}
              onMouseEnter={() => setHoveredLine(line.id)}
              onMouseLeave={() => setHoveredLine(null)}
              onClick={() => !line.drawn && handleLineClick(line.id)}
              whileHover={{ scale: 1.05 }}
            >
              <motion.div
                className="w-full rounded-sm"
                initial={{ 
                  backgroundColor: line.drawn ? getPlayerColor(line.playerId) : "rgba(200, 200, 200, 0.3)",
                  scale: line.drawn ? 1 : 0.9
                }}
                animate={{ 
                  backgroundColor: isHovered && !line.drawn ? currentPlayer.color + "80" : 
                    line.drawn ? getPlayerColor(line.playerId) : "rgba(200, 200, 200, 0.3)",
                  scale: isHovered && !line.drawn ? 1.1 : line.drawn ? 1 : 0.9
                }}
                transition={{ duration: 0.2 }}
              />
            </motion.div>
          );
        })}
        
        <AnimatePresence>
          {gameState.boxes.map((box) => box.completed && (
            <motion.div
              key={box.id}
              className="absolute rounded-md shadow-inner"
              initial={{ 
                opacity: 0,
                scale: 0.5,
                backgroundColor: getPlayerColor(box.ownerId)
              }}
              animate={{ 
                opacity: 0.3,
                scale: 1,
                backgroundColor: getPlayerColor(box.ownerId)
              }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.3 }}
              style={{
                left: box.col * cellSize + dotSize/2 + 20,
                top: box.row * cellSize + dotSize/2 + 20,
                width: cellSize - dotSize,
                height: cellSize - dotSize,
              }}
            />
          ))}
        </AnimatePresence>
      </motion.div>

      <motion.div 
        className="flex justify-center w-full mt-8 gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {gameState.players.map((player) => (
          <motion.div 
            key={player.id}
            className="flex items-center px-6 py-3 rounded-full text-white shadow-lg"
            style={{ 
              background: `linear-gradient(135deg, ${player.color} 0%, ${player.color}80 100%)`
            }}
            whileHover={{ y: -5 }}
          >
            <div className="mr-3">
              {player.type === "human" ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect width="14" height="14" x="5" y="5" rx="2"/>
                  <path d="M15 2v3"/><path d="M 15 19v3"/>
                  <path d="M22 15h-3"/><path d="M5 15H2"/>
                </svg>
              )}
            </div>
            <motion.span className="font-bold text-lg">
              {player.score}
            </motion.span>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default GameBoard;
