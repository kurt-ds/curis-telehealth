import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";

export const notificationsRouter = Router();

notificationsRouter.get(
  "/",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.sub ?? "";

      const [notifications, unreadCount] = await Promise.all([
        prisma.notification.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 50,
        }),
        prisma.notification.count({
          where: { userId, read: false },
        }),
      ]);

      return res.json({ notifications, unreadCount });
    } catch (err) {
      console.error("[GET /api/notifications]", err);
      return res.status(500).json({ error: "Internal server error." });
    }
  }
);

notificationsRouter.patch(
  "/:id/read",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.sub ?? "";

      await prisma.notification.updateMany({
        where: { id: req.params.id, userId, read: false },
        data: { read: true },
      });

      return res.json({ success: true });
    } catch (err) {
      console.error("[PATCH /api/notifications/:id/read]", err);
      return res.status(500).json({ error: "Internal server error." });
    }
  }
);
