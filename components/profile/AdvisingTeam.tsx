interface Member {
  role: string;
  name: string;
}

interface Props {
  advisorName?: string | null;
  academicCoachName?: string | null;
  thesisSponsor?: string | null;
}

function initials(name: string): string {
  return name.split(/\s+/).map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

export function AdvisingTeam({ advisorName, academicCoachName, thesisSponsor }: Props) {
  const members: Member[] = [];
  if (advisorName) members.push({ role: "Faculty Advisor", name: advisorName });
  if (thesisSponsor) members.push({ role: "Thesis Sponsor", name: thesisSponsor });
  if (academicCoachName) members.push({ role: "Academic Coach", name: academicCoachName });

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mr-1">
          Advising Team
        </span>
        {members.length === 0 ? (
          <span className="text-xs text-gray-400">No advising team assigned yet.</span>
        ) : (
          members.map((m) => (
            <div key={m.role} className="flex items-center gap-2 bg-navy-light rounded-lg px-2.5 py-1.5">
              <div className="w-7 h-7 rounded-full bg-navy text-white flex items-center justify-center text-[10px] font-bold">
                {initials(m.name)}
              </div>
              <div className="leading-tight">
                <div className="text-[13px] font-medium text-navy">{m.name}</div>
                <div className="text-[10px] uppercase tracking-wide text-gray-400">{m.role}</div>
              </div>
            </div>
          ))
        )}
        <button className="ml-auto text-[11px] text-navy hover:underline shrink-0">
          + Add team member
        </button>
      </div>
    </div>
  );
}
