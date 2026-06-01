import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import type { SuggestedCourse } from "@/lib/student-progress";

const categoryColor: Record<SuggestedCourse["category"], string> = {
  AOC: "bg-gold-light text-gold-dark border-gold/40",
  "Gen Ed": "bg-blue-50 text-blue-800 border-blue-200",
  Minor: "bg-navy-light text-navy border-navy/20",
  Thesis: "bg-purple-50 text-purple-800 border-purple-200",
};

export function SuggestedCourses({ courses }: { courses: SuggestedCourse[] }) {
  return (
    <Card
      title="Suggested for next semester"
      icon="✨"
      footer="Heuristic based on AOC/Gen Ed gaps · DegreeWorks audit"
    >
      {courses.length === 0 ? (
        <EmptyState
          title="No suggestions yet"
          description="Suggestions appear once DegreeWorks data shows clear gaps."
          icon="🪄"
        />
      ) : (
        <div className="space-y-2">
          {courses.map((c, i) => (
            <div
              key={i}
              className="border border-gray-100 rounded-lg p-3 hover:border-navy/30 transition"
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="font-medium text-navy">{c.courseTitle}</div>
                  <div className="text-[11px] text-gray-500">{c.courseCode}</div>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full border ${categoryColor[c.category]}`}
                >
                  {c.category}
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-1">{c.reason}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
