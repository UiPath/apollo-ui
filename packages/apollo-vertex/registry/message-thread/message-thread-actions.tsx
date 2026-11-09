import { Button } from "@/components/ui/button";
import type { Action } from "@/lib/action";

/** The first action is the primary button, the others are outline buttons. */
function ActionButtons({
  actions,
  size,
  className,
}: {
  actions: readonly Action[];
  size: "default" | "sm";
  className: string;
}) {
  return (
    <div className={className}>
      {actions.map(({ label, onClick, disabled, icon: Icon }, index) => (
        <Button
          key={label}
          type="button"
          size={size}
          variant={index === 0 ? "default" : "outline"}
          disabled={disabled}
          onClick={onClick}
        >
          {Icon != null && <Icon />}
          {label}
        </Button>
      ))}
    </div>
  );
}

export { ActionButtons };
