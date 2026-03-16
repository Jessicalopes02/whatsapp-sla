import { prisma } from "../repositories/prisma";

type CreateUserDTO = {
  name: string;
  phone: string;
  role: string;
};

export class UsersService {
  async create(data: CreateUserDTO) {
    return prisma.user.create({
      data,
    });
  }

  async list() {
    return prisma.user.findMany({
      orderBy: {
        name: "asc",
      },
    });
  }
}