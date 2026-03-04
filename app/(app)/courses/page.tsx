"use client";

import { useEffect, useState } from "react";
import CustomCard from "@/app/components/ui/CustomCard";
import CourseSelect from "@/app/components/ui/CourseSelect";
import { apiFetch } from "@/app/lib/apiFetch";

type Course = {
  courseCode: string;
  name: string;
  enrolledStudents: number;
};

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [displayedCourses, setDisplayedCourses] = useState<Course[]>([]);
  const [dataisLoaded, setDataIsLoaded] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await apiFetch("/api/courses");

        if (!res.ok) {
          setError("Failed to fetch courses");
          return;
        }

        const data = await res.json();
        setCourses(data);
        setDisplayedCourses(data); // this is to show all the courses first
      } catch (err) {
        console.error("Error fetching courses:", err);
        setError("Error fetching courses");
      } finally {
        setDataIsLoaded(true);
      }
    };

    fetchCourses();
  }, []);

  const handleCourseChange = async (courseCode: string | null) => {
    if (!courseCode) {
      setDisplayedCourses(courses);
      return;
    }

    try {
      const res = await apiFetch(`/api/courses/${courseCode}`);

      if (!res.ok) {
        setError("Failed to fetch course details");
        return;
      }
      const courseDetails = await res.json();
      setDisplayedCourses([courseDetails]);
      setError("");
    } catch (err) {
      console.error("Error handling course change:", err);
      setError("Error handling course change");
    }
  };

  if (!dataisLoaded) {
    return (
      <div>
        <h1>Loading...</h1>
      </div>
    );
  }

  return (
    <div>
      <h1>Courses Page</h1>
      <div className="mb-4">
        <CourseSelect data={courses} onChange={handleCourseChange} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {displayedCourses.map((course: Course) => (
          <CustomCard key={course.courseCode}>
            <h2 className="text-lg font-semibold">{course.courseCode}</h2>
            <p className="text-sm text-gray-600">{course.name}</p>
            <p className="text-sm text-gray-600">
              Enrolled Students: {course.enrolledStudents}
            </p>
          </CustomCard>
        ))}
        {error && <p className="text-red-500 mt-4">{error}</p>}
      </div>
    </div>
  );
}
