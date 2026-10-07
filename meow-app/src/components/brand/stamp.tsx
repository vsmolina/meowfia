import { cn } from "@/lib/utils";

type Props = {
  children?: React.ReactNode;
  className?: string;
  color?: "red" | "olive" | "ink";
  rotate?: number;
  size?: "sm" | "md" | "lg";
};

const COLORS = {
  red: "text-stamp border-stamp",
  olive: "text-olive border-olive",
  ink: "text-ink border-ink",
};

const SIZES = {
  sm: "text-[0.65rem] px-1.5 py-0.5 border-2",
  md: "text-sm px-2.5 py-1 border-[3px]",
  lg: "text-2xl px-4 py-1.5 border-4",
};

/** Rubber-stamp label: "CLASSIFIED", "APPROVED", "TOP SECRET" */
export function Stamp({ children = "Classified", className, color = "red", rotate = -6, size = "md" }: Props) {
  return (
    <span
      className={cn(
        "inline-block select-none rounded-sm font-stencil uppercase leading-none tracking-[0.15em] opacity-90",
        COLORS[color],
        SIZES[size],
        className,
      )}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      {children}
    </span>
  );
}

/** Small mono "FILE NO. 0042" style label */
export function FileTag({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("font-mono text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground", className)}>
      {children}
    </span>
  );
}

/** Section heading with stencil type and a file-number eyebrow */
export function SectionHeading({
  eyebrow,
  title,
  description,
  className,
  align = "left",
  as: Tag = "h2",
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
  align?: "left" | "center";
  as?: "h1" | "h2";
}) {
  return (
    <div className={cn("space-y-2", align === "center" && "mx-auto max-w-2xl text-center", className)}>
      {eyebrow && <FileTag>{eyebrow}</FileTag>}
      <Tag className={cn("font-stencil text-olive-dark", Tag === "h1" ? "text-4xl sm:text-5xl" : "text-3xl sm:text-4xl")}>
        {title}
      </Tag>
      {description && <p className="text-base text-muted-foreground sm:text-lg">{description}</p>}
    </div>
  );
}
