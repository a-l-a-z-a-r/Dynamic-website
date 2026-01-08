import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Friend, FriendSchema } from './friend.schema';
import { FriendsService } from './friends.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Friend.name, schema: FriendSchema }])],
  providers: [FriendsService],
  exports: [FriendsService],
})
export class FriendsModule {}
