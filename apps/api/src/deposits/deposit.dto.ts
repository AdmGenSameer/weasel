import { IsIn, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";
import { Type } from "class-transformer";

export class CreateDepositDto {
  @IsIn(["INR", "USDT"])
  currency!: "INR" | "USDT";

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  @Max(500000)
  amount!: number;

  @IsOptional()
  @IsString()
  @IsIn(["TRC-20", "BEP-20"])
  network?: string;

  @IsOptional()
  @IsIn(["Payment", "VIP"])
  offerKind?: "Payment" | "VIP";
}
