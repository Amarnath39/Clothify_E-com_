// Minimal mock if you don't have shadcn/ui setup
export const toast = ({
  title,
  description,
  variant,
}: {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
}) => {
  alert(`${variant === "destructive" ? "❌" : "✅"} ${title}${description ? `: ${description}` : ""}`);
};
