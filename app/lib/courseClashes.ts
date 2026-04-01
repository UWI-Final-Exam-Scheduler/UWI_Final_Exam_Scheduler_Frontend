export const normalizeCourseCode = (code: string) => code.trim().toUpperCase();

export function buildCourseClashesSet(courseCodes: string[] = []) {
  return new Set(courseCodes.map(normalizeCourseCode));
}

export function courseHasClash(
  courseCode: string,
  courseClashesSet: Set<string>,
) {
  return courseClashesSet.has(normalizeCourseCode(courseCode));
}
