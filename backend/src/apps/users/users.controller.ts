import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { KeycloakAuthGuard } from '../../auth/keycloak.guard';
import { KeycloakAdminService } from '../../auth/keycloak-admin.service';
import { KeycloakAuthService } from '../../auth/keycloak-auth.service';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { ProfilesService } from '../../profiles/profiles.service';
import {
  AdminUserStatusDto,
  LoginDto,
  ProfileImageDto,
  SignupDto,
} from '../../dto/app.dto';

const ADMIN_ROLE = 'admin';

type AuthRequest = {
  user?: Record<string, unknown>;
};

@Controller()
export class UsersController {
  constructor(
    private readonly keycloakAdminService: KeycloakAdminService,
    private readonly keycloakAuthService: KeycloakAuthService,
    private readonly profilesService: ProfilesService,
  ) {}

  @Post('signup')
  async signup(@Body() body: SignupDto) {
    const { username, password, firstName, lastName, age, email } = body || {};
    if (!username || !password || !firstName || !lastName || !age || !email) {
      throw new HttpException({ error: 'Missing required fields' }, HttpStatus.BAD_REQUEST);
    }

    try {
      await this.keycloakAdminService.createUser(body);
      return { ok: true };
    } catch (err) {
      const status = (err as any)?.status || HttpStatus.BAD_GATEWAY;
      const message = (err as Error)?.message || 'Failed to create user';
      throw new HttpException({ error: message }, status);
    }
  }

  @Post('login')
  async login(@Body() body: LoginDto) {
    const { username, password } = body || {};
    if (!username || !password) {
      throw new HttpException({ error: 'Missing required fields' }, HttpStatus.BAD_REQUEST);
    }

    try {
      const token = await this.keycloakAuthService.loginWithPassword(username, password);
      return token;
    } catch (err) {
      const status = (err as any)?.status || HttpStatus.BAD_GATEWAY;
      const message = (err as Error)?.message || 'Login failed';
      throw new HttpException({ error: message }, status);
    }
  }

  @Get('profile/:username')
  async profile(@Param('username') username: string) {
    if (!username) {
      throw new HttpException({ error: 'Missing username' }, HttpStatus.BAD_REQUEST);
    }

    try {
      const user = await this.keycloakAdminService.findUserByUsername(username);
      if (!user) {
        throw new HttpException({ error: 'User not found' }, HttpStatus.NOT_FOUND);
      }

      const profile = await this.profilesService.findByUsername(username);
      return {
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        attributes: user.attributes || {},
        imageUrl: profile?.imageUrl,
      };
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      const status = (err as any)?.status || HttpStatus.BAD_GATEWAY;
      const message = (err as Error)?.message || 'Failed to load profile';
      throw new HttpException({ error: message }, status);
    }
  }

  @UseGuards(KeycloakAuthGuard)
  @Post('profile/image')
  async updateProfileImage(@Body() body: ProfileImageDto, @Req() req: AuthRequest) {
    const ownerId =
      (req.user?.preferred_username as string) || (req.user?.username as string);
    if (!ownerId) {
      throw new HttpException({ error: 'Missing owner' }, HttpStatus.FORBIDDEN);
    }
    if (!body?.imageUrl) {
      throw new HttpException({ error: 'Missing image url' }, HttpStatus.BAD_REQUEST);
    }
    const updated = await this.profilesService.upsertImage(ownerId, body.imageUrl);
    return { ok: true, profile: updated };
  }

  @UseGuards(KeycloakAuthGuard)
  @Get('users')
  async searchUsers(@Query('search') search?: string) {
    if (!search) {
      return { users: [] };
    }
    const users = await this.keycloakAdminService.searchUsers(search);
    return { users };
  }

  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles(ADMIN_ROLE)
  @Post('admin/users/:username/enabled')
  async setUserEnabled(
    @Param('username') username: string,
    @Body() body: AdminUserStatusDto,
  ) {
    if (!username) {
      throw new HttpException({ error: 'Missing username' }, HttpStatus.BAD_REQUEST);
    }
    const updated = await this.keycloakAdminService.setUserEnabled(username, body.enabled);
    if (!updated) {
      throw new HttpException({ error: 'User not found' }, HttpStatus.NOT_FOUND);
    }
    return { ok: true };
  }

  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles(ADMIN_ROLE)
  @Delete('admin/users/:username')
  async deleteUser(@Param('username') username: string) {
    if (!username) {
      throw new HttpException({ error: 'Missing username' }, HttpStatus.BAD_REQUEST);
    }
    const deleted = await this.keycloakAdminService.deleteUserByUsername(username);
    if (!deleted) {
      throw new HttpException({ error: 'User not found' }, HttpStatus.NOT_FOUND);
    }
    return { ok: true };
  }
}
