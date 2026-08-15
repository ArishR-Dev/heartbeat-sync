import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useRoom } from "@/contexts/RoomContext";
import { RotateCcw } from "lucide-react";

type Cell = "X" | "O" | null;
const WINS = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6],
];

const TicTacToe = () => {
  const { activeGame, startGame, makeGameMove, resetActiveGame, user, partner } = useRoom();
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [winLine, setWinLine] = useState<number[] | null>(null);
  const [scores, setScores] = useState({ me: 0, partner: 0 });
  const [winPoints, setWinPoints] = useState(3);

  const checkWin = useCallback((b: Cell[]): { winner: Cell; line: number[] | null } => {
    for (const line of WINS) {
      const [a, c, d] = line;
      if (b[a] && b[a] === b[c] && b[a] === b[d]) return { winner: b[a], line };
    }
    return { winner: null, line: null };
  }, []);

  const isDraw = useCallback((b: Cell[]) => b.every(c => c !== null), []);

  // Sync state from activeGame
  useEffect(() => {
    if (activeGame && activeGame.game_type === "tictactoe") {
      const state = activeGame.state as { board: Cell[]; winPoints?: number };
      if (state.board) setBoard(state.board);
      if (state.winPoints) setWinPoints(state.winPoints);
      
      const { winner, line } = checkWin(state.board || Array(9).fill(null));
      setWinLine(line);
      
      // Calculate scores based on finished games if needed, 
      // but for now let's just use local session scores or add to DB state
    }
  }, [activeGame, checkWin]);

  const isMyTurn = activeGame?.game_type === "tictactoe" && activeGame.current_turn_id === user?.id && !winLine;
  const mySymbol = activeGame?.player1_id === user?.id ? "X" : "O";

  const handleClick = async (i: number) => {
    if (!isMyTurn || board[i] || winLine || !activeGame) return;
    
    const nextBoard = [...board];
    nextBoard[i] = mySymbol;
    
    const { winner } = checkWin(nextBoard);
    const nextTurnId = winner || isDraw(nextBoard) ? activeGame.current_turn_id : partner?.id || null;
    const winnerId = winner ? user?.id : null;

    await makeGameMove({ board: nextBoard, winPoints }, nextTurnId, winnerId);
  };

  const resetGame = async () => {
    if (!activeGame || !partner) return;
    // Next round starts with whoever didn't start last or just random
    await resetActiveGame(partner.id, { board: Array(9).fill(null), winPoints });
  };

  const startNewMatch = async () => {
    await startGame("tictactoe", { board: Array(9).fill(null), winPoints });
    setScores({ me: 0, partner: 0 });
  };

  const { winner } = checkWin(board);
  const draw = !winner && isDraw(board);
  const gameOver = scores.me >= winPoints || scores.partner >= winPoints;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center justify-between w-full">
        <span className="text-xs font-semibold text-foreground">Tic Tac Toe</span>
        <div className="flex items-center gap-2">
          <label className="text-[10px] text-muted-foreground">Win at:</label>
          <select
            value={winPoints}
            onChange={(e) => setWinPoints(Number(e.target.value))}
            className="text-[10px] bg-muted/50 rounded px-1 py-0.5 text-foreground"
          >
            {[1,2,3,5,7].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>

      {/* Scores */}
      <div className="flex items-center gap-4 text-xs">
        <span className="text-primary font-bold">You ({mySymbol}): {scores.me}</span>
        <span className="text-muted-foreground">vs</span>
        <span className="text-secondary font-bold">Pookie ({mySymbol === "X" ? "O" : "X"}): {scores.partner}</span>
      </div>

      {/* Board */}
      <div className="grid grid-cols-3 gap-1.5">
        {board.map((cell, i) => (
          <motion.button
            key={i}
            whileHover={!cell && isMyTurn && !winLine ? { scale: 1.05 } : {}}
            whileTap={!cell && isMyTurn && !winLine ? { scale: 0.95 } : {}}
            onClick={() => handleClick(i)}
            className={`w-16 h-16 rounded-xl text-2xl font-bold flex items-center justify-center transition-all ${
              winLine?.includes(i)
                ? "bg-primary/20 border-2 border-primary"
                : cell
                ? "bg-muted/50 border border-border/50"
                : isMyTurn && !winLine
                ? "bg-muted/30 border border-border/30 hover:bg-muted/50 hover:border-primary/30"
                : "bg-muted/20 border border-border/20"
            }`}
          >
            {cell === "X" && <span className="text-primary">✦</span>}
            {cell === "O" && <span className="text-secondary">✧</span>}
          </motion.button>
        ))}
      </div>

      {/* Status */}
      <div className="text-xs font-medium text-center">
        {gameOver ? (
          <span className="text-primary">
            {scores.me >= winPoints ? "You won the match! 🎉" : "Pookie won the match! 💕"}
          </span>
        ) : winner ? (
          <span className="text-primary">{winner === mySymbol ? "You win this round! 🎉" : "Pookie wins! 💕"}</span>
        ) : draw ? (
          <span className="text-muted-foreground">It's a draw! 🤝</span>
        ) : (
          <span className={isMyTurn ? "text-primary" : "text-muted-foreground"}>
            {isMyTurn ? "Your turn ✨" : "Pookie's turn..."}
          </span>
        )}
      </div>

      <div className="flex gap-2">
        {(winner || draw) && !gameOver && (
          <button onClick={resetGame} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-muted/50 text-xs font-medium text-foreground hover:bg-muted transition-colors">
            <RotateCcw size={12} /> Next Round
          </button>
        )}
        <button onClick={startNewMatch} className="px-3 py-1.5 rounded-lg pookie-gradient text-primary-foreground text-xs font-semibold">
          New Match
        </button>
      </div>
    </div>
  );
};

export default TicTacToe;
