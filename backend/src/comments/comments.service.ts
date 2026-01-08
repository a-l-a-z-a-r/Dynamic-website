import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Comment, CommentDocument } from './comment.schema';

type CreateCommentPayload = {
  reviewId: string;
  user: string;
  message: string;
  parentCommentId?: string;
};

@Injectable()
export class CommentsService {
  constructor(@InjectModel(Comment.name) private readonly commentModel: Model<CommentDocument>) {}

  async create(payload: CreateCommentPayload) {
    const created = await this.commentModel.create({
      reviewId: payload.reviewId,
      user: payload.user,
      message: payload.message,
      parentCommentId: payload.parentCommentId,
    });
    return created.toObject();
  }

  async findById(commentId: string) {
    if (!commentId) return null;
    return this.commentModel.findById(commentId).lean().exec();
  }

  async listByReviewIds(reviewIds: string[]) {
    if (!reviewIds.length) return [];
    return this.commentModel.find({ reviewId: { $in: reviewIds } }).sort({ created_at: 1 }).lean().exec();
  }
}
