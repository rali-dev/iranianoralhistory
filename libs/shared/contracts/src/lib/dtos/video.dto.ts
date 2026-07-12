// @Type (class-transformer) liest beim Laden Design-Metadaten via Reflect —
// stellt das Polyfill sicher, damit auch isolierte (Jest-)Umgebungen, die
// diese DTOs transitiv laden, nicht an "Reflect.getMetadata is not a function"
// scheitern.
import 'reflect-metadata';
import { IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class VideoTranslationDto {
  @IsNotEmpty()
  @IsString()
  de!: string;

  @IsNotEmpty()
  @IsString()
  en!: string;

  @IsNotEmpty()
  @IsString()
  fa!: string;
}

export class OptionalVideoTranslationDto {
  @IsOptional()
  @IsString()
  de?: string;

  @IsOptional()
  @IsString()
  en?: string;

  @IsOptional()
  @IsString()
  fa?: string;
}

export class CreateVideoDto {
  @IsNotEmpty()
  @IsString()
  vimeoId!: string;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => VideoTranslationDto)
  title!: VideoTranslationDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => VideoTranslationDto)
  description?: VideoTranslationDto;
}

export class UpdateVideoDto {
  @IsOptional()
  @IsString()
  vimeoId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => OptionalVideoTranslationDto)
  title?: OptionalVideoTranslationDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => OptionalVideoTranslationDto)
  description?: OptionalVideoTranslationDto | null;
}

export class CreateDocumentDto {
  @IsNotEmpty()
  @IsString()
  title!: string;

  @IsNotEmpty()
  @IsString()
  storagePath!: string;
}

export class UpdateDocumentDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  storagePath?: string;
}
