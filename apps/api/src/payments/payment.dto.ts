import { Type } from "class-transformer";
import { IsIn, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

export class CreatePaymentIntentDto {
  @IsIn(["RECEIVE", "SEND"])
  kind!: "RECEIVE" | "SEND";

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  @Max(500000)
  amount!: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  recipient?: string;
}
