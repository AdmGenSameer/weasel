import { IsString, Matches, MinLength, MaxLength } from "class-validator";

export class LoginDto {
  @IsString()
  @Matches(/^\+?[0-9\s-]{8,16}$/)
  phone!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}
