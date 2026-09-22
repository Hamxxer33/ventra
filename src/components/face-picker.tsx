import { FACES } from "@/lib/faces";
import { cn } from "@/lib/utils";

export function FacePicker({
  selectedId,
  locked,
  onSelect,
}: {
  selectedId: string | null;
  locked: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="relative">
      {locked ? (
        <p className="mb-4 font-display text-pixel text-muted">LOCKED · GET A TICKET FIRST</p>
      ) : (
        <p className="mb-4 font-sans text-lg text-muted">Tap a face. It bakes into your card.</p>
      )}
      <ul
        className={cn(
          "grid grid-cols-2 gap-3 sm:grid-cols-5",
          locked && "pointer-events-none opacity-40",
        )}
      >
        {FACES.map((face) => {
          const selected = selectedId === face.id;
          return (
            <li key={face.id}>
              <button
                type="button"
                onClick={() => onSelect(face.id)}
                aria-pressed={selected}
                aria-label={`${face.name}, ${face.blurb}`}
                className={cn(
                  "group flex w-full flex-col border-2 bg-surface p-1 text-left shadow-pixel-sm",
                  "transition-[border-color,box-shadow,transform] duration-(--motion-quick) ease-(--ease-out)",
                  "active:scale-[0.96]",
                  selected
                    ? "border-accent shadow-pixel"
                    : "border-border hover:border-muted",
                )}
              >
                <img
                  src={face.src}
                  alt=""
                  width={512}
                  height={512}
                  className="pixelated aspect-square w-full bg-surface-2 object-cover"
                  draggable={false}
                />
                <span className="mt-2 px-1 pb-1 font-display text-micro uppercase leading-tight text-fg sm:text-pixel">
                  {face.name}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
