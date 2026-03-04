"use client";

import { useEffect, useState } from "react";
import EnrollmentSelect from "@/app/components/ui/EnrollmentSelect";
import CustomCard from "@/app/components/ui/CustomCard";
import { apiFetch } from "@/app/lib/apiFetch";

type Enrollment = {
    student_id: string;
    courseCode: string;
};

export default function Enrollments() {
    const [enrollments, setEnrollments] = useState([]);
    const [displayedEnrollments, setDisplayedEnrollments] = useState<Enrollment[]>([]);
    const [dataIsLoaded, setDataIsLoaded] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchEnrollments = async () => {
            try {
                const res = await apiFetch("/api/enrollments");

                if (!res.ok) {
                    setError("Failed to fetch enrollments");
                    return;
                }

                const data = await res.json();
                setEnrollments(data);
                setDisplayedEnrollments(data); // show all the enrollments first
            } catch (err) {
                console.error("Error fetching enrollments:", err);
                setError("Error fetching enrollments");
            } finally {
                setDataIsLoaded(true);
            }
        };

        fetchEnrollments();
    }, []);

    const handleEnrollmentChange = async (student_id: string | null) => {
        if (!student_id) {
            setDisplayedEnrollments(enrollments);
            return;
        }

        try {
            const res = await apiFetch(`/api/enrollments/${student_id}`);

            if (!res.ok) {
                setError("Failed to fetch enrollment details");
                return;
            }
            const enrollmentDetails = await res.json();
            setDisplayedEnrollments([enrollmentDetails]);
            setError("");
        } catch (err) {
            console.error("Error handling enrollment change:", err);
            setError("Error handling enrollment change");
        }
    };

    if (!dataIsLoaded) {
        return (
            <div>
                <h1>Loading...</h1>
            </div>
        );
    }

    return (
        <div>
            <h1>Enrollments Page</h1>
            <div className="mb-4">
                <EnrollmentSelect data={enrollments} onChange={handleEnrollmentChange} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {displayedEnrollments.map((enrollment: Enrollment) => (
                    <CustomCard key={enrollment.student_id}>
                        <h2 className="text-lg font-semibold">{enrollment.student_id}</h2>
                        <p className="text-sm text-gray-600">{enrollment.courseCode}</p>
                    </CustomCard>
                ))}
                {error && <p className="text-red-500 mt-4">{error}</p>}
            </div>
        </div>
    );
}