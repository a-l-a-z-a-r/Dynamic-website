import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => {
        const uri = config.get<string>('MONGODB_URI') ?? 'mongodb://mongo:27017/socialbook';
        const dbName = config.get<string>('MONGODB_DB');
        return {
          uri,
          ...(dbName ? { dbName } : {}),
          autoIndex: true,
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
