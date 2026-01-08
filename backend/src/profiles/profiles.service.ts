import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Profile, ProfileDocument } from './profile.schema';

@Injectable()
export class ProfilesService {
  constructor(@InjectModel(Profile.name) private readonly profileModel: Model<ProfileDocument>) {}

  async findByUsername(username: string) {
    if (!username) return null;
    return this.profileModel.findOne({ username }).lean().exec();
  }

  async upsertImage(username: string, imageUrl: string) {
    if (!username) return null;
    const updated = await this.profileModel
      .findOneAndUpdate(
        { username },
        { $set: { imageUrl } },
        { new: true, upsert: true },
      )
      .lean()
      .exec();
    return updated;
  }
}
