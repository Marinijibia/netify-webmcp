import { Controller, Get, Post, Body, UseGuards, UsePipes } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUserContext } from '../../common/decorators/current-user.decorator';
import { updateOnboardingSchema, UpdateOnboardingInput } from '@netify/validation';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { prisma } from '@netify/database';

@Controller('onboarding')
@UseGuards(JwtAuthGuard)
export class OnboardingController {
  @Get()
  async getStatus(@CurrentUser() user: AuthenticatedUserContext) {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        onboardingCompleted: true,
        onboardingStep: true,
        onboardingData: true,
        memberships: {
          include: {
            organization: true,
          },
        },
      },
    });

    return {
      success: true,
      data: dbUser,
      timestamp: new Date().toISOString(),
    };
  }

  @Post()
  @UsePipes(new ZodValidationPipe(updateOnboardingSchema))
  async updateStatus(
    @CurrentUser() user: AuthenticatedUserContext,
    @Body() body: UpdateOnboardingInput
  ) {
    const currentUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { onboardingData: true },
    });

    const mergedData = {
      ...((currentUser?.onboardingData as Record<string, any>) || {}),
      ...(body.onboardingData || {}),
    };

    const updatePayload: any = {
      onboardingData: mergedData,
    };

    if (body.step) {
      updatePayload.onboardingStep = body.step;
    }

    if (body.onboardingCompleted !== undefined) {
      updatePayload.onboardingCompleted = body.onboardingCompleted;
      if (body.onboardingCompleted) {
        updatePayload.onboardingStep = 'COMPLETED';
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.userId },
      data: updatePayload,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isEmailVerified: true,
        onboardingCompleted: true,
        onboardingStep: true,
        onboardingData: true,
      },
    });

    return {
      success: true,
      data: updatedUser,
      message: 'Onboarding state updated successfully',
      timestamp: new Date().toISOString(),
    };
  }
}
