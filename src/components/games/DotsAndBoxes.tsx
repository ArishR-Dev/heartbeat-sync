import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useRoom } from "@/contexts/RoomContext";
import { RotateCcw } from "lucide-react";

const SIZE = 4; // 4x4 dots = 3x3 boxes

type Line = { r: number; c: number; dir: "h" | "v" };
type Box = { r: number; c: number; owner: 1 | 2 | null };

const lineKey = (l: Line) => `${l.r}-${l.c}-${l.dir}`;

const DotsAndBoxes = () => {
  const { activeGame, startGame, makeGameMove, resetActiveGame, user, partner } = useRoom();
  const [lines, setLines] = useState<Set<string>>(new Set());
  const [boxes, setBoxes] = useState<Map<string, 1 | 2>>(new Map());
  const [hoverLine, setHoverLine] = useState<string | null>(null);

  const boxKey = (r: number, c: number) => `${r}-${c}`;

  const checkBoxes = useCallback((newLines: Set<string>, player: 1 | 2, currentBoxes: Map<string, 1 | 2>) => {
    const updated = new Map(currentBoxes);
    let captured = 0;
    for (let r = 0; r < SIZE - 1; r++) {
      for (let c = 0; c < SIZE - 1; c++) {
        const bk = boxKey(r, c);
        if (updated.has(bk)) continue;
        const top = lineKey({ r, c, dir: "h" });
        const bottom = lineKey({ r: r + 1, c, dir: "h" });
        const left = lineKey({ r, c, dir: "v" });
        const right = lineKey({ r, c: c + 1, dir: "v" });
        if (newLines.has(top) && newLines.has(bottom) && newLines.has(left) && newLines.has(right)) {
          updated.set(bk, player);
          captured++;
        }
      }
    }
    return { updated, captured };
  }, []);

  useEffect(() => {
    if (activeGame && activeGame.game_type === "dots") {
      const state = activeGame.state as { lines: string[]; boxes: Record<string, 1 | 2> };
      if (state.lines) setLines(new Set(state.lines));
      if (state.boxes) setBoxes(new Map(Object.entries(state.boxes)));
    }
  }, [activeGame]);

  const isMyTurn = activeGame?.game_type === "dots" && activeGame.current_turn_id === user?.id;
  const myPlayer = activeGame?.player1_id === user?.id ? 1 : 2;

  const placeLine = async (line: Line) => {
    const lk = lineKey(line);
    if (lines.has(lk) || !isMyTurn || !activeGame) return;

    const newLines = new Set(lines);
    newLines.add(lk);
    const { updated, captured } = checkBoxes(newLines, myPlayer, boxes);
    const extraTurn = captured > 0;

    const nextTurnId = extraTurn ? user?.id : partner?.id || null;
    
    const totalBoxes = (SIZE - 1) * (SIZE - 1);
    const winnerId = updated.size === totalBoxes ? (
      Array.from(updated.values()).filter(v => v === 1).length > Array.from(updated.values()).filter(v => v === 2).length ? activeGame.player1_id : activeGame.player2_id
    ) : null;

    await makeGameMove({ 
      lines: Array.from(newLines), 
      boxes: Object.fromEntries(updated) 
    }, nextTurnId, winnerId);
  };

  const reset = async () => {
    if (!activeGame || !partner) return;
    await resetActiveGame(partner.id, { lines: [], boxes: {} });
  };

  const startNew = async () => {
    await startGame("dots", { lines: [], boxes: {} });
  };

  const totalBoxes = (SIZE - 1) * (SIZE - 1);
  const myBoxes = Array.from(boxes.values()).filter(v => v === myPlayer).length;
  const partnerBoxes = Array.from(boxes.values()).filter(v => v !== myPlayer).length;
  const gameOver = boxes.size === totalBoxes;

  const DOT_SIZE = 8;
  const GAP = 40;

  return (
    <div className="flex flex-col items-center gap-3">
      <span className="text-xs font-semibold text-foreground">Dots & Boxes</span>

      <div className="flex items-center gap-4 text-xs">
        <span className="text-primary font-bold">You: {myBoxes}</span>
        <span className="text-muted-foreground">vs</span>
        <span className="text-secondary font-bold">Pookie: {partnerBoxes}</span>
      </div>

      <div className="relative" style={{ width: (SIZE - 1) * GAP + DOT_SIZE, height: (SIZE - 1) * GAP + DOT_SIZE }}>
        {/* Boxes */}
        {Array.from({ length: SIZE - 1 }, (_, r) =>
          Array.from({ length: SIZE - 1 }, (_, c) => {
            const owner = boxes.get(boxKey(r, c));
            return owner ? (
              <motion.div
                key={`box-${r}-${c}`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`absolute rounded ${owner === myPlayer ? "bg-primary/20" : "bg-secondary/20"}`}
                style={{
                  left: c * GAP + DOT_SIZE / 2,
                  top: r * GAP + DOT_SIZE / 2,
                  width: GAP,
                  height: GAP,
                }}
              />
            ) : null;
          })
        )}

        {/* Horizontal lines */}
        {Array.from({ length: SIZE }, (_, r) =>
          Array.from({ length: SIZE - 1 }, (_, c) => {
            const lk = lineKey({ r, c, dir: "h" });
            const active = lines.has(lk);
            return (
              <button
                key={`h-${r}-${c}`}
                onClick={() => placeLine({ r, c, dir: "h" })}
                onMouseEnter={() => !active && setHoverLine(lk)}
                onMouseLeave={() => setHoverLine(null)}
                className={`absolute transition-all rounded-full ${
                  active ? "bg-primary" :
                  hoverLine === lk && isMyTurn ? "bg-primary/40" :
                  "bg-muted/30 hover:bg-muted/50"
                }`}
                style={{
                  left: c * GAP + DOT_SIZE,
                  top: r * GAP + DOT_SIZE / 2 - 2,
                  width: GAP - DOT_SIZE,
                  height: 4,
                  cursor: active ? "default" : isMyTurn ? "pointer" : "default",
                }}
              />
            );
          })
        )}

        {/* Vertical lines */}
        {Array.from({ length: SIZE - 1 }, (_, r) =>
          Array.from({ length: SIZE }, (_, c) => {
            const lk = lineKey({ r, c, dir: "v" });
            const active = lines.has(lk);
            return (
              <button
                key={`v-${r}-${c}`}
                onClick={() => placeLine({ r, c, dir: "v" })}
                onMouseEnter={() => !active && setHoverLine(lk)}
                onMouseLeave={() => setHoverLine(null)}
                className={`absolute transition-all rounded-full ${
                  active ? "bg-primary" :
                  hoverLine === lk && isMyTurn ? "bg-primary/40" :
                  "bg-muted/30 hover:bg-muted/50"
                }`}
                style={{
                  left: c * GAP + DOT_SIZE / 2 - 2,
                  top: r * GAP + DOT_SIZE,
                  width: 4,
                  height: GAP - DOT_SIZE,
                  cursor: active ? "default" : isMyTurn ? "pointer" : "default",
                }}
              />
            );
          })
        )}

        {/* Dots */}
        {Array.from({ length: SIZE }, (_, r) =>
          Array.from({ length: SIZE }, (_, c) => (
            <div
              key={`dot-${r}-${c}`}
              className="absolute rounded-full bg-foreground"
              style={{
                left: c * GAP,
                top: r * GAP,
                width: DOT_SIZE,
                height: DOT_SIZE,
              }}
            />
          ))
        )}
      </div>

      <div className="text-xs font-medium text-center">
        {gameOver ? (
          <span className="text-primary">
            {myBoxes > partnerBoxes ? "You win! 🎉" : myBoxes < partnerBoxes ? "Pookie wins! 💕" : "It's a tie! 🤝"}
          </span>
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

export default DotsAndBoxes;
