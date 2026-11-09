type Shape = { kind: "circle" } | { kind: "square" };

export function sides(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return 0;
    case "square":
      return 4;
    default:
      shape satisfies never;
      return 0;
  }
}
