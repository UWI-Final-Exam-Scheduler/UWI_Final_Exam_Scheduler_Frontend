"use client";

import { useEffect, useState } from "react";
import CustomCard from "@/app/components/ui/CustomCard";

type Course = {
  courseCode: string;
  name: string;
};

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [dataisLoaded, setDataIsLoaded] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await fetch(`/api/courses`, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          setError("Failed to fetch courses");
          return;
        }

        const data = await res.json();
        setCourses(data);
      } catch (err) {
        console.error("Error fetching courses:", err);
        setError("Error fetching courses");
      } finally {
        setDataIsLoaded(true);
      }
    };

    fetchCourses();
  }, []);

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {courses.map((course: Course) => (
          <CustomCard key={course.courseCode}>
            <h2 className="text-lg font-semibold">{course.courseCode}</h2>
            <p className="text-sm text-gray-600">{course.name}</p>
          </CustomCard>
        ))}
        {error && <p className="text-red-500 mt-4">{error}</p>}
      </div>
    </div>
  );
}
