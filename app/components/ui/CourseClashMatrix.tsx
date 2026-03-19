import { Spinner } from "@radix-ui/themes";

export default function CourseClashMatrix({
  course,
  enrolledStudents,
  clashes,
  loading,
}: {
  course: string;
  enrolledStudents?: number;
  clashes: Array<{ course: string; studentsClashing: number }>;
  loading?: boolean;
}) {
  return (
    <div className="bg-white rounded-lg p-8 w-full max-w-3xl mx-auto shadow relative">
      <h1 className="text-3xl font-extrabold mb-2 text-center tracking-wide">
        Course Clash Matrix
      </h1>
      <div className="flex justify-between mb-6 text-lg font-semibold">
        <span>
          Course: <span className="font-bold">{course}</span>
        </span>
        <span>
          Enrolled students:{" "}
          <span className="font-bold">{enrolledStudents}</span>
        </span>
      </div>
      <table className="w-full border rounded-lg overflow-hidden shadow">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-6 py-3 text-lg font-bold text-left">
              Course
            </th>
            <th className="border px-6 py-3 text-lg font-bold text-center">
              Students Clashing
            </th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={2} className="p-0" style={{ height: "160px" }}>
                <div
                  className="flex flex-col items-center justify-center w-full h-full"
                  style={{ minHeight: "160px" }}
                >
                  <span className="flex items-center gap-2 text-blue-700">
                    <Spinner className="mr-2" />
                    Loading clashes...
                  </span>
                </div>
              </td>
            </tr>
          ) : clashes.length === 0 ? (
            <tr>
              <td colSpan={2} className="text-center py-8 text-gray-500">
                No clashes found.
              </td>
            </tr>
          ) : (
            clashes.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50 transition">
                <td className="border px-6 py-3 text-base font-medium">
                  {row.course}
                </td>
                <td className="border px-6 py-3 text-center text-base font-semibold">
                  {row.studentsClashing}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
