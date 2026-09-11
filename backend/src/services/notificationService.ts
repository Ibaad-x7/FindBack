import { Notification, PrismaClient } from "@prisma/client";
import { prisma } from "../lib/prisma";

export interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
}

/**
 * Creates an in-app notification for a user.
 * Can optionally accept an existing Prisma transaction client.
 */
export async function createNotification(
  params: CreateNotificationParams,
  tx?: Omit<
    PrismaClient,
    "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
  >
): Promise<Notification> {
  const client = tx ?? prisma;

  return client.notification.create({
    data: {
      userId: params.userId,
      title: params.title.trim(),
      message: params.message.trim(),
      read: false,
    },
  });
}

