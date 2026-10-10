import { IsString, Matches, MaxLength } from "class-validator";

export class SetPinDto {
  @IsString()
  @MaxLength(128)
  currentPassword!: string;

  @IsString()
  @Matches(/^\d{6}$/)
  pin!: string;
}
