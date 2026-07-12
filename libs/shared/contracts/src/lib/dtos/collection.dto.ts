import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { VideoTranslationDto, OptionalVideoTranslationDto } from './video.dto';
import { CollectionType } from '../interfaces/collection.interface';

export class CreateCollectionDto {
  @IsNotEmpty()
  @IsString()
  slug!: string;

  @IsEnum(['PERSON', 'TOPIC'])
  type!: CollectionType;

  @IsNotEmpty()
  name!: VideoTranslationDto;

  @IsOptional()
  description?: VideoTranslationDto;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class UpdateCollectionDto {
  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  name?: OptionalVideoTranslationDto;

  @IsOptional()
  description?: OptionalVideoTranslationDto | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class AssignVideoDto {
  @IsNotEmpty()
  @IsString()
  videoId!: string;
}
