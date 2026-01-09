import { Type } from 'class-transformer';
import { IsBoolean, IsEmail, IsNumber, IsOptional, IsString } from 'class-validator';

export class SignupDto {
  @IsString()
  username!: string;

  @IsEmail()
  email!: string;

  @IsString()
  password!: string;

  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @Type(() => Number)
  @IsNumber()
  age!: number;
}

export class LoginDto {
  @IsString()
  username!: string;

  @IsString()
  password!: string;
}

export class ImportDto {
  @IsString()
  query!: string;

  @IsOptional()
  @IsString()
  source?: string;
}

export class CommentDto {
  @IsString()
  message!: string;
}

export class ReplyDto {
  @IsString()
  message!: string;

  @IsString()
  reviewId!: string;
}

export class ProfileImageDto {
  @IsString()
  imageUrl!: string;
}

export class BookReviewDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  rating?: number;

  @IsOptional()
  @IsString()
  review?: string;

  @IsOptional()
  @IsString()
  genre?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  coverUrl?: string;
}

export class FriendDto {
  @IsString()
  friendId!: string;
}

export class CreateReviewDto {
  @IsString()
  user!: string;

  @IsString()
  book!: string;

  @Type(() => Number)
  @IsNumber()
  rating!: number;

  @IsString()
  review!: string;

  @IsString()
  genre!: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  coverUrl?: string;
}

export class AdminUserStatusDto {
  @Type(() => Boolean)
  @IsBoolean()
  enabled!: boolean;
}
