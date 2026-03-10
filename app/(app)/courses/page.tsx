"use client";

import { useEffect, useState } from "react";
import CustomCard from "@/app/components/ui/CustomCard";
import CourseSelect from "@/app/components/ui/CourseSelect";
import { apiFetch } from "@/app/lib/apiFetch";
import CustomButton from "@/app/components/ui/CustomButton";
import { Spinner } from "@radix-ui/themes";

type Course = {
  courseCode: string;
  name: string;
  enrolledStudents: number;
};

type CoursesResponse = {
  page: number;
  per_page: number;
  total: number;
  pages: number;
  has_next: boolean;
  has_prev: boolean;
  courses: Course[];
};

export default function Courses() {
  const [courseResponse, setCourseResponse] = useState<CoursesResponse | null>(
    null,
  );
  const [courses, setCourses] = useState<Course[]>([]);
  const [displayedCourses, setDisplayedCourses] = useState<Course[]>([]);
  const [dataisLoaded, setDataIsLoaded] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchCourses = async (pageNum: number) => {
      try {
        const res = await apiFetch(`/api/courses?page=${pageNum}&per_page=20`);

        if (!res.ok) {
          setError("Failed to fetch courses");
          return;
        }

        const data = await res.json();
        setCourseResponse(data);
        setCourses(data.courses);
        setDisplayedCourses(data.courses); // this is to show all the courses first
      } catch (err) {
        console.error("Error fetching courses:", err);
        setError("Error fetching courses");
      } finally {
        setDataIsLoaded(true);
      }
    };

    fetchCourses(page);
  }, [page]);

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

  const handlePageChange = (newPage: number) => {
    if (newPage < 1) return;
    setPage(newPage);
    setDataIsLoaded(false); // Set loading state when changing page
  };

  if (!dataisLoaded) {
    // when first loading the page
    return (
      <div>
        <h1>Loading...</h1>
        <Spinner />
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
        {dataisLoaded &&
          displayedCourses.length === 0 && ( // when changing the page
            <div>
              <h1>Loading...</h1>
              <Spinner />
            </div>
          )}
        {error && <p className="text-red-500 mt-4">{error}</p>}
      </div>

      <div className="pagination mt-4 flex justify-center items-center space-x-2 gap-2">
        <CustomButton
          buttonname="First"
          onclick={() => handlePageChange(1)}
          disabled={page === 1}
        />
        <CustomButton
          buttonname="Previous"
          onclick={() => handlePageChange(page - 1)}
          disabled={page === 1}
        />
        <span>
          Page {page} / {courseResponse?.pages || 1}
        </span>
        <CustomButton
          buttonname="Next"
          onclick={() => handlePageChange(page + 1)}
          disabled={!courseResponse?.has_next}
        />
        <CustomButton
          buttonname="Last"
          onclick={() => handlePageChange(courseResponse?.pages || 1)}
          disabled={page === courseResponse?.pages}
        />
      </div>
    </div>
  );
}
