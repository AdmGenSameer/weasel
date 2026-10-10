import { IsString, Matches, MaxLength, MinLength } from "class-validator";

export class RecoveryStartDto {
  @IsString()
  @Matches(/^\+?[0-9\s-]{8,16}$/)
  phone!: string;
}

export class RecoveryCompleteDto extends RecoveryStartDto {
  @IsString()
  @Matches(/^\d{6}$/)
  code!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}
