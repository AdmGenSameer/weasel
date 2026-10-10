import { Body, Controller, Get, Patch, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { AuthenticatedRequest } from "../auth/session.guard";
import { SessionGuard } from "../auth/session.guard";
import { SetPinDto } from "./pin.dto";
import { ProfileService } from "./profile.service";

@ApiTags("profile")
@Controller("profile")
@UseGuards(SessionGuard)
export class ProfileController {
  constructor(private readonly profile: ProfileService) {}

  @Get()
  get(@Req() request: AuthenticatedRequest) {
    return this.profile.getProfile(request.user!.sub);
  }

  @Patch("pin")
  setPin(@Req() request: AuthenticatedRequest, @Body() dto: SetPinDto) {
    return this.profile.setPin(request.user!.sub, dto.currentPassword, dto.pin);
  }
}
