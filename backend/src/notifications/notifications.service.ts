import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification, NotificationDocument } from './notification.schema';

type CreateNotificationPayload = {
  user: string;
  actor?: string;
  message?: string;
  reviewId?: string;
  commentId?: string;
};

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
  ) {}

  async create(payload: CreateNotificationPayload) {
    const created = await this.notificationModel.create({
      user: payload.user,
      actor: payload.actor,
      message: payload.message,
      reviewId: payload.reviewId,
      commentId: payload.commentId,
      read: false,
    });
    return created.toObject();
  }

  async listByUser(user: string, limit = 50) {
    if (!user) return [];
    return this.notificationModel
      .find({ user })
      .sort({ created_at: -1 })
      .limit(limit)
      .lean()
      .exec();
  }

  async markRead(notificationId: string, user: string) {
    if (!notificationId || !user) return null;
    return this.notificationModel
      .findOneAndUpdate(
        { _id: notificationId, user },
        { $set: { read: true } },
        { new: true },
      )
      .lean()
      .exec();
  }
}
