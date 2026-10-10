import { IsBoolean, IsString, Matches, MaxLength } from "class-validator";

export class CreateUpiDto {
  @IsString()
  @MaxLength(120)
  @Matches(/^[\w.-]{2,80}@[\w.-]{2,40}$/)
  address!: string;
}

export class UpdateUpiDto {
  @IsBoolean()
  sellEnabled!: boolean;
}
