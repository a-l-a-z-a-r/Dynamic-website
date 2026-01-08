import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Friend, FriendDocument } from './friend.schema';

@Injectable()
export class FriendsService {
  constructor(@InjectModel(Friend.name) private readonly friendModel: Model<FriendDocument>) {}

  async listFriends(ownerId: string) {
    if (!ownerId) return [];
    return this.friendModel.find({ ownerId }).sort({ createdAt: -1 }).lean().exec();
  }

  async addFriend(ownerId: string, friendId: string) {
    if (!ownerId || !friendId) return null;
    const created = await this.friendModel.create({ ownerId, friendId });
    return created.toObject();
  }
}
