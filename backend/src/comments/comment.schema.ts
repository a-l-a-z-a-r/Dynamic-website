import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CommentDocument = HydratedDocument<Comment>;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: false } })
export class Comment {
  @Prop({ required: true })
  reviewId!: string;

  @Prop({ required: true })
  user!: string;

  @Prop({ required: true })
  message!: string;

  @Prop()
  parentCommentId?: string;

  created_at?: Date;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);
CommentSchema.index({ reviewId: 1, created_at: -1 });
CommentSchema.index({ parentCommentId: 1 });
