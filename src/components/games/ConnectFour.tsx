import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useRoom } from "@/contexts/RoomContext";
import { RotateCcw } from "lucide-react";

const ROWS = 6;
const COLS = 7;
type Cell = 1 | 2 | null;

const createBoard = (): Cell[][] =>
  Array.from({ length: ROWS }, () => Array(COLS).fill(null));

const checkWin = (board: Cell[][], player: Cell): number[][] | null => {
  const dirs = [[0,1],[1,0],[1,1],[1,-1]];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c] !== player) continue;
      for (const [dr, dc] of dirs) {
        const cells: number[][] = [];
        let ok = true;
        for (let i = 0; i < 4; i++) {
          const nr = r + dr * i, nc = c + dc * i;
          if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || board[nr][nc] !== player) { ok = false; break; }
          cells.push([nr, nc]);
        }
        if (ok) return cells;
      }
    }
  }
  return null;
};

const ConnectFour = () => {
  const { activeGame, startGame, makeGameMove, resetActiveGame, user, partner } = useRoom();
  const [board, setBoard] = useState(createBoard());
  const [winCells, setWinCells] = useState<number[][] | null>(null);
  const [hoverCol, setHoverCol] = useState<number | null>(null);

  useEffect(() => {
    if (activeGame && activeGame.game_type === "connect4") {
      const state = activeGame.state as { board: Cell[][] };
      if (state.board) setBoard(state.board);
    }
  }, [activeGame]);

  useEffect(() => {
    const w1 = checkWin(board, 1);
    const w2 = checkWin(board, 2);
    if (w1) setWinCells(w1);
    else if (w2) setWinCells(w2);
    else setWinCells(null);
  }, [board]);

  const isMyTurn = activeGame?.game_type === "connect4" && activeGame.current_turn_id === user?.id && !winCells;
  const myPlayer = activeGame?.player1_id === user?.id ? 1 : 2;

  const drop = async (col: number) => {
    if (!isMyTurn || winCells || !activeGame) return;
    
    let placed = false;
    const nextBoard = board.map(r => [...r]);
    for (let r = ROWS - 1; r >= 0; r--) {
      if (!nextBoard[r][col]) {
        nextBoard[r][col] = myPlayer;
        placed = true;
        break;
      }
    }
    
    if (!placed) return;

    const w = checkWin(nextBoard, myPlayer);
    const isFull = nextBoard[0].every(c => c !== null);
    const nextTurnId = w || isFull ? activeGame.current_turn_id : partner?.id || null;
    const winnerId = w ? user?.id : null;

    await makeGameMove({ board: nextBoard }, nextTurnId, winnerId);
  };

  const reset = async () => {
    if (!activeGame || !partner) return;
    await resetActiveGame(partner.id, { board: createBoard() });
  };

  const startNew = async () => {
    await startGame("connect4", { board: createBoard() });
  };

  const isFull = board[0].every(c => c !== null);
  const winner = winCells ? board[winCells[0][0]][winCells[0][1]] : null;
  const isWinCell = (r: number, c: number) => winCells?.some(([wr, wc]) => wr === r && wc === c);

  return (
    <div className="flex flex-col items-center gap-3">
      <span className="text-xs font-semibold text-foreground">Connect Four</span>

      <div className="flex flex-col gap-0.5 p-2 rounded-xl bg-muted/30">
        {board.map((row, r) => (
          <div key={r} className="flex gap-0.5">
            {row.map((cell, c) => (
              <motion.button
                key={c}
                onClick={() => drop(c)}
                onMouseEnter={() => setHoverCol(c)}
                onMouseLeave={() => setHoverCol(null)}
                whileHover={!cell && isMyTurn && !winCells ? { scale: 1.1 } : {}}
                className={`w-9 h-9 rounded-full border transition-all flex items-center justify-center ${
                  isWinCell(r, c) ? "border-2 border-primary ring-2 ring-primary/30" :
                  "border-border/30"
                } ${!cell && hoverCol === c && isMyTurn ? "bg-primary/10" : "bg-background/50"}`}
              >
                {cell === 1 && (
                  <motion.div initial={{ y: -20 }} animate={{ y: 0 }} className="w-7 h-7 rounded-full bg-primary" />
                )}
                {cell === 2 && (
                  <motion.div initial={{ y: -20 }} animate={{ y: 0 }} className="w-7 h-7 rounded-full bg-secondary" />
                )}
              </motion.button>
            ))}
          </div>
        ))}
      </div>

      <div className="text-xs font-medium text-center">
        {winner ? (
          <span className="text-primary">{winner === myPlayer ? "You win! 🎉" : "Pookie wins! 💕"}</span>
        ) : isFull ? (
          <span className="text-muted-foreground">It's a draw! 🤝</span>
        ) : (
          <span className={isMyTurn ? "text-primary" : "text-muted-foreground"}>
            {isMyTurn ? "Your turn ✨" : "Pookie's turn..."}
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <button onClick={reset} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-muted/50 text-xs font-medium text-foreground hover:bg-muted transition-colors">
          <RotateCcw size={12} /> Reset
        </button>
        <button onClick={startNew} className="px-3 py-1.5 rounded-lg pookie-gradient text-primary-foreground text-xs font-semibold">
          New Game
        </button>
      </div>
    </div>
  );
};

export default ConnectFour;
