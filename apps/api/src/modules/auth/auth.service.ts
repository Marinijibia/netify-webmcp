import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { prisma, UserRole } from '@netify/database';
import * as bcrypt from 'bcrypt';
import { RegisterInput, LoginInput, RefreshTokenInput } from '@netify/validation';
import { AuthResponse } from '@netify/types';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  async register(input: RegisterInput): Promise<AuthResponse> {
    const existing = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (existing) {
      throw new BadRequestException('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    const slug = input.organizationName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') + '-' + Math.floor(1000 + Math.random() * 9000);

    const result = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: input.organizationName,
          slug,
          currency: input.currency || 'NGN',
          country: input.country || 'Nigeria',
        },
      });

      const user = await tx.user.create({
        data: {
          email: input.email.toLowerCase(),
          passwordHash,
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone,
        },
      });

      await tx.membership.create({
        data: {
          organizationId: org.id,
          userId: user.id,
          role: UserRole.OWNER,
        },
      });

      await tx.subscription.create({
        data: {
          organizationId: org.id,
          plan: 'FREE',
          status: 'ACTIVE',
        },
      });

      return { user, org };
    });

    const tokens = await this.generateTokens({
      userId: result.user.id,
      email: result.user.email,
      organizationId: result.org.id,
      role: UserRole.OWNER,
    });

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
      },
      organization: {
        id: result.org.id,
        name: result.org.name,
        slug: result.org.slug,
        currency: result.org.currency,
      },
      role: UserRole.OWNER,
      tokens,
    };
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
      include: {
        memberships: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const membership = user.memberships[0];
    if (!membership) {
      throw new UnauthorizedException('User is not associated with any active organization');
    }

    const tokens = await this.generateTokens({
      userId: user.id,
      email: user.email,
      organizationId: membership.organizationId,
      role: membership.role,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      organization: {
        id: membership.organization.id,
        name: membership.organization.name,
        slug: membership.organization.slug,
        currency: membership.organization.currency,
      },
      role: membership.role,
      tokens,
    };
  }

  async refresh(input: RefreshTokenInput): Promise<{ accessToken: string; expiresIn: number }> {
    try {
      const refreshSecret = this.configService.get<string>('REFRESH_TOKEN_SECRET') || 'dev_refresh_token_secret_netify';
      const payload = await this.jwtService.verifyAsync(input.refreshToken, { secret: refreshSecret });

      const jwtSecret = this.configService.get<string>('JWT_SECRET') || 'dev_jwt_secret_netify_change_in_production';
      const accessToken = await this.jwtService.signAsync(
        {
          sub: payload.sub,
          email: payload.email,
          organizationId: payload.organizationId,
          role: payload.role,
        },
        { secret: jwtSecret, expiresIn: '15m' }
      );

      return {
        accessToken,
        expiresIn: 900,
      };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatarUrl: true,
        memberships: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  private async generateTokens(payload: {
    userId: string;
    email: string;
    organizationId: string;
    role: string;
  }) {
    const jwtSecret = this.configService.get<string>('JWT_SECRET') || 'dev_jwt_secret_netify_change_in_production';
    const refreshSecret = this.configService.get<string>('REFRESH_TOKEN_SECRET') || 'dev_refresh_token_secret_netify';

    const tokenPayload = {
      sub: payload.userId,
      email: payload.email,
      organizationId: payload.organizationId,
      role: payload.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(tokenPayload, { secret: jwtSecret, expiresIn: '15m' }),
      this.jwtService.signAsync(tokenPayload, { secret: refreshSecret, expiresIn: '7d' }),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: 900,
    };
  }
}
