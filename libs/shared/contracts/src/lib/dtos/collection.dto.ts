import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { VideoTranslationDto, OptionalVideoTranslationDto } from './video.dto';
import { CollectionType } from '../interfaces/collection.interface';

export class CreateCollectionDto {
  @IsNotEmpty()
  @IsString()
  slug!: string;

  @IsEnum(['PERSON', 'TOPIC'])
  type!: CollectionType;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => VideoTranslationDto)
  name!: VideoTranslationDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => VideoTranslationDto)
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
  @ValidateNested()
  @Type(() => OptionalVideoTranslationDto)
  name?: OptionalVideoTranslationDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => OptionalVideoTranslationDto)
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
