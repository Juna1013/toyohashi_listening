import { defineCollection, z } from "astro:content";

const questionsCollection = defineCollection({
  type: "data",
  schema: z.object({
    year: z.number(),
    title: z.string(),
    questions: z.array(
      z.object({
        number: z.number(),
        instruction: z.string().optional(),
        passage: z.string(),
        audioPath: z.string(),
        options: z.array(z.string()).optional(),
        subQuestions: z
          .array(
            z.object({
              question: z.string(),
              choices: z.array(z.string()),
            })
          )
          .optional(),
      })
    ),
  }),
});

export const collections = {
  questions: questionsCollection,
};