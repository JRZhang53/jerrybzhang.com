/** Cells are at least as wide as the interaction radius, including at the seam. */
export function periodicGrid(width: number, height: number, radius: number) {
  const columns = Math.max(1, Math.floor(width / radius));
  const rows = Math.max(1, Math.floor(height / radius));
  const cellWidth = width / columns;
  const cellHeight = height / rows;
  const neighbors = Array.from({ length: columns * rows }, (_, cell) => {
    const cx = cell % columns;
    const cy = Math.floor(cell / columns);
    const cells = new Set<number>();
    for (let y = -1; y <= 1; y++) {
      for (let x = -1; x <= 1; x++) {
        cells.add(((cy + y + rows) % rows) * columns + (cx + x + columns) % columns);
      }
    }
    return [...cells];
  });
  return { columns, rows, cellWidth, cellHeight, neighbors };
}
