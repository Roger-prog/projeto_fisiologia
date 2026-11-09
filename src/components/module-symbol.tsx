import { HeartPulse, Wind } from "lucide-react";

export function ModuleSymbol({ moduleId }: { moduleId: string }) {
  const isRespiratory = moduleId === "respiratorio";
  const Icon = isRespiratory ? Wind : HeartPulse;

  return (
    <span className={isRespiratory ? "module-symbol module-symbol-blue" : "module-symbol"}>
      <Icon size={25} strokeWidth={1.75} aria-hidden="true" />
    </span>
  );
}
