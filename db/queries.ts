import { cache } from "react";

import db from "@/db/drizzle";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { challenges, courses, lessons, units, userProgress } from "@/db/schema";

export const getUserProgress = cache(async () => {
    const { userId } = await auth();

    if (!userId) {
        return null;
    };

    const data = await db.query.userProgress.findFirst({
        where: eq(userProgress.userId, userId),
        with: {
            activeCourse: true,
        },
    });

    return data;
});

export const getCourses = cache(async () => {
    const data = await db.query.courses.findMany();

    return data;
});

export const getUnits = cache(async () => {
    const userProgress = await getUserProgress();

    if (!userProgress?.activeCourseId) {
        return [];
    };

    const data = await db.query.units.findMany({
        where: eq(units.courseId, userProgress.activeCourseId),
        with: {
            lessons: {
                with: {
                    challenges: {
                        with: {
                            challengeProgress: true,
                        }
                    }
                }
            }
        }
    });

    const normalizedData = data.map((unit) => {
        const lessonsWithCompletedStatus = unit.lessons.map((lesson) => {
            // return true/false that we can checking wheather every single challenges in this lesson has a matching challengeProgress with status of completed if that is true it means we can marked lesson completed entirely 
            const allCompletedChallenges = lesson.challenges.every((challenge) => {
                return challenge.challengeProgress
                    && challenge.challengeProgress.length > 0
                    && challenge.challengeProgress.every((progress) => progress.completed);
            });

            return { ...lesson, completed: allCompletedChallenges }
        });

        return { ...unit, lessons: lessonsWithCompletedStatus }
    });

    return normalizedData;
});

export const getCourseById = cache(async (courseId: number) => {
    const data = await db.query.courses.findFirst({
        where: eq(courses.id, courseId),
        // TODO: Populate units and lessons
    })
}) 