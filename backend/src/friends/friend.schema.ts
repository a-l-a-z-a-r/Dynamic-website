import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type FriendDocument = HydratedDocument<Friend>;

@Schema({ timestamps: true })
export class Friend {
  @Prop({ required: true })
  ownerId!: string;

  @Prop({ required: true })
  friendId!: string;
}

export const FriendSchema = SchemaFactory.createForClass(Friend);
FriendSchema.index({ ownerId: 1, friendId: 1 }, { unique: true });
