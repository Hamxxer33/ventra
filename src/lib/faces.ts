export type Face = {
  id: string;
  name: string;
  src: string;
  blurb: string;
};

export const FACES: Face[] = [
  { id: "core", name: "CORE", src: "/faces/core.png", blurb: "Visor unit" },
  { id: "ion", name: "ION", src: "/faces/ion.png", blurb: "Mohawk rig" },
  { id: "ash", name: "ASH", src: "/faces/ash.png", blurb: "Ceramic mask" },
  { id: "nyx", name: "NYX", src: "/faces/nyx.png", blurb: "Cat operator" },
  { id: "null", name: "NULL", src: "/faces/null.png", blurb: "Green teeth" },
  { id: "flux", name: "FLUX", src: "/faces/flux.png", blurb: "Goggle bob" },
  { id: "hex", name: "HEX", src: "/faces/hex.png", blurb: "CRT head" },
  { id: "void", name: "VOID", src: "/faces/void.png", blurb: "Hood signal" },
  { id: "ribbit", name: "RIBBIT", src: "/faces/ribbit.png", blurb: "Frog trench" },
  { id: "echo", name: "ECHO", src: "/faces/echo.png", blurb: "LED cube" },
];

export function faceById(id: string | null | undefined): Face | undefined {
  if (!id) return undefined;
  return FACES.find((f) => f.id === id);
}
