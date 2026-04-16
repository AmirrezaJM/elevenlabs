import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { db } from '@/lib/db'
import { deleteAudio } from '@/lib/r2'
import { createTRPCRouter, orgProcedure } from '../init'

export const voicesRouter = createTRPCRouter({
    // in here we will write our procedure we need
    getAll: orgProcedure
        .input(z
            .object({ query: z.string().trim().optional() })
            .optional()
        )
        .query(async ({ input, ctx }) => {
            const searchFilter = input?.query ? {
                OR: [
                    { name: { contains: input.query, mode: 'insensitive' as const } },
                    { description: { contains: input.query, mode: 'insensitive' as const } }
                ]
            } : {};

            const [custom, system] = await Promise.all([
                db.voice.findMany({
                    where: {
                        variant: "CUSTOM",
                        orgId: ctx.orgId,
                        ...searchFilter
                    },
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        category: true,
                        language: true,
                        variant: true
                    },
                    orderBy: { createdAt: "desc" }
                }),
                db.voice.findMany({
                    where: {
                        variant: "SYSTEM",
                        ...searchFilter
                    },
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        category: true,
                        language: true,
                        variant: true
                    },
                    orderBy: {
                        createdAt: 'asc'
                    }
                }),
            ])
            return {
                custom,
                system
            }
        }),
    delete: orgProcedure.input(z.object({ id: z.string() })).mutation(async ({ input, ctx }) => {
        const voice = await db.voice.findUnique({
            where: {
                id: input.id,
                variant: "CUSTOM",
                orgId: ctx.orgId
            },
            select: {
                id: true,
                r2ObjectKey: true
            },
        });
        if (!voice) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Voice not found" })
        }
        // background job 
        if (voice.r2ObjectKey) {
            await deleteAudio(voice.r2ObjectKey)
        }
        await db.voice.delete({
            where: {
                id: voice.id
            }
        })

        return { success: true }
    })
})