import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ProfileDocument = HydratedDocument<Profile>;

@Schema({ timestamps: true })
export class Profile {
  @Prop({ required: true, unique: true })
  username!: string;

  @Prop()
  imageUrl?: string;
}

export const ProfileSchema = SchemaFactory.createForClass(Profile);
ProfileSchema.index({ username: 1 }, { unique: true });
