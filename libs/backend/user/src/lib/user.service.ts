import { Injectable, NotFoundException, ForbiddenException} from '@nestjs/common';
import { PrismaService } from '@iranianoralhistory/database';
import { Request } from 'express';
@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getUserById(id: string, req: Request) {
    const user = await this.prisma.user.findUnique({ where: { id }});
   
    if (!user) {
      throw new NotFoundException('User not found');
    }

     const decodedUser = req.user as { id: string; email: string, hashedPassword: string };

    if (user.id !== decodedUser.id) {
      throw new ForbiddenException('Unauthorized access to user data');
    }
   const { hashedPassword: _ , ...userWithoutPassword } = user;
    return { user: userWithoutPassword };
  }

  async getAllUsers() {
    return await this.prisma.user.findMany({
      select: { id: true, email: true },
    });
  }
}
