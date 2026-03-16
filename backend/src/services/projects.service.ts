import { prisma } from "../repositories/prisma";

type CreateProjectDTO = {
  name: string;
  groupExternalId: string;
  groupName: string;
  responsibleUserId: string;
  slaMinutes?: number;
};

export class ProjectsService {
  async create(data: CreateProjectDTO) {
    return prisma.project.create({
      data: {
        ...data,
        slaMinutes: data.slaMinutes ?? 15,
      },
    });
  }

  async list() {
    return prisma.project.findMany({
      include: {
        responsibleUser: true,
      },
      orderBy: {
        name: "asc",
      },
    });
  }
}