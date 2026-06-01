import { CalloutBox } from "@/components/ui/CalloutBox";

interface Props {
  academicStanding: string;
  earlyAlerts: number;
  financialFlags: number;
}

export function FlagBanner({ academicStanding, earlyAlerts, financialFlags }: Props) {
  const flags: { variant: "urgent" | "warning" | "info"; text: string }[] = [];
  if (academicStanding === "academic_probation")
    flags.push({ variant: "urgent", text: "On academic probation" });
  else if (academicStanding === "academic_warning")
    flags.push({ variant: "warning", text: "On academic warning" });
  if (earlyAlerts > 0)
    flags.push({ variant: "warning", text: `${earlyAlerts} open early alert${earlyAlerts > 1 ? "s" : ""}` });
  if (financialFlags > 0)
    flags.push({
      variant: "warning",
      text: `${financialFlags} active financial flag${financialFlags > 1 ? "s" : ""}`,
    });

  if (flags.length === 0) return null;

  return (
    <div className="space-y-2">
      {flags.map((f, i) => (
        <CalloutBox key={i} variant={f.variant}>
          {f.text}
        </CalloutBox>
      ))}
    </div>
  );
}
