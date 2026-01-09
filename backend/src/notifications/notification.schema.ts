import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type NotificationDocument = HydratedDocument<Notification>;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: false } })
export class Notification {
  @Prop({ required: true })
  user!: string;

  @Prop()
  actor?: string;

  @Prop()
  message?: string;

  @Prop()
  reviewId?: string;

  @Prop()
  commentId?: string;

  @Prop({ default: false })
  read!: boolean;

  created_at?: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
NotificationSchema.index({ user: 1, created_at: -1 });
