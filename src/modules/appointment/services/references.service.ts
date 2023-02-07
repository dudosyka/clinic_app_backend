import { Injectable, NotFoundException } from '@nestjs/common';
import { Model } from 'sequelize-typescript';
import { ModelNotFoundException } from '../../../exceptions/model-not-found.exception';

@Injectable()
export class ReferencesService {
  private registeredClassed = {};

  private getInstanceByClassName(name): any | null {
    let instance = null;

    if (this.registeredClassed[name] != undefined)
      instance = this.registeredClassed[name];

    if (!instance)
      throw new NotFoundException(`Reference with name ${name} not found!`);

    return instance;
  }

  getInstancesList(): any {
    return Object.keys(this.registeredClassed);
  }

  async getAll(modelName: string): Promise<Model[]> {
    const instance = this.getInstanceByClassName(modelName);
    return await instance.findAll();
  }

  async getOne(modelName: string, id: number): Promise<Model> {
    const instance = this.getInstanceByClassName(modelName);
    const model = await instance.findOne({
      where: {
        id,
      },
    });

    if (!model) throw new ModelNotFoundException(modelName, id);

    return model;
  }
}
