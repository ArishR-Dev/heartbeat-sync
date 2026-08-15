export interface CursorPack {
  id: string;
  name: string;
  category: "anime" | "kpop" | "fantasy" | "default";
  cursorUrl: string;   // normal cursor PNG
  pointerUrl: string;  // hover/pointer cursor PNG
  animated: boolean;
  preview: string;     // same as cursorUrl, used for thumbnails
}

export const CURSOR_PACKS: CursorPack[] = [
  {
    id: "default",
    name: "Default",
    category: "default",
    cursorUrl: "",
    pointerUrl: "",
    animated: false,
    preview: "",
  },
  {
    id: "anya_forger",
    name: "Anya Forger",
    category: "anime",
    cursorUrl: "/cursors/anya_forger/cursor.png",
    pointerUrl: "/cursors/anya_forger/pointer.png",
    animated: false,
    preview: "/cursors/anya_forger/cursor.png",
  },
  {
    id: "anya_breakdance",
    name: "Anya Breakdance",
    category: "anime",
    cursorUrl: "/cursors/anya_breakdance/cursor.png",
    pointerUrl: "/cursors/anya_breakdance/pointer.png",
    animated: true,
    preview: "/cursors/anya_breakdance/cursor.png",
  },
  {
    id: "anya_dango",
    name: "Anya & Dango",
    category: "anime",
    cursorUrl: "/cursors/anya_dango/cursor.png",
    pointerUrl: "/cursors/anya_dango/pointer.png",
    animated: true,
    preview: "/cursors/anya_dango/cursor.png",
  },
  {
    id: "anya_funny",
    name: "Funny Anya",
    category: "anime",
    cursorUrl: "/cursors/anya_funny/cursor.png",
    pointerUrl: "/cursors/anya_funny/pointer.png",
    animated: false,
    preview: "/cursors/anya_funny/cursor.png",
  },
  {
    id: "bond_anya",
    name: "Bond & Anya",
    category: "anime",
    cursorUrl: "/cursors/bond_anya/cursor.png",
    pointerUrl: "/cursors/bond_anya/pointer.png",
    animated: true,
    preview: "/cursors/bond_anya/cursor.png",
  },
  {
    id: "anya_christmas",
    name: "Christmas Anya",
    category: "anime",
    cursorUrl: "/cursors/anya_christmas/cursor.png",
    pointerUrl: "/cursors/anya_christmas/pointer.png",
    animated: false,
    preview: "/cursors/anya_christmas/cursor.png",
  },
  {
    id: "my_melody",
    name: "My Melody",
    category: "anime",
    cursorUrl: "/cursors/my_melody/cursor.png",
    pointerUrl: "/cursors/my_melody/pointer.png",
    animated: true,
    preview: "/cursors/my_melody/cursor.png",
  },
  {
    id: "hatsune_miku",
    name: "Hatsune Miku",
    category: "anime",
    cursorUrl: "/cursors/hatsune_miku/cursor.png",
    pointerUrl: "/cursors/hatsune_miku/pointer.png",
    animated: false,
    preview: "/cursors/hatsune_miku/cursor.png",
  },
  {
    id: "blackpink_rose",
    name: "BLACKPINK Rosé",
    category: "kpop",
    cursorUrl: "/cursors/blackpink_rose/cursor.png",
    pointerUrl: "/cursors/blackpink_rose/pointer.png",
    animated: false,
    preview: "/cursors/blackpink_rose/cursor.png",
  },
  {
    id: "middle_ages",
    name: "Middle Ages",
    category: "fantasy",
    cursorUrl: "/cursors/middle_ages/cursor.png",
    pointerUrl: "/cursors/middle_ages/pointer.png",
    animated: false,
    preview: "/cursors/middle_ages/cursor.png",
  },
];

export const getCursorPack = (id: string): CursorPack | undefined =>
  CURSOR_PACKS.find((p) => p.id === id);
