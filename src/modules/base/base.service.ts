import { Model } from "sequelize-typescript";
import { ModelNotFoundException } from "../../exceptions/model-not-found.exception";

export class BaseModel extends Model {}

export class BaseService<M extends Model> {
  constructor(
    private model: typeof BaseModel
  ) {}

  private checkInstanceOf<T>(object: any): object is T {
    return true;
  }

  public async getOne(query: any = {}): Promise<M> {
    const result = await this.model.findOne(query);

    if (!result)
      throw new ModelNotFoundException(this.model, query.where.id);

    if (this.checkInstanceOf<M>(result))
      return result;
  }

  public async getAll(query: any = {}): Promise<M[]> {
    const result = await this.model.findAll(query)
    if (this.checkInstanceOf<M[]>(result))
      return result;
  }

  public async remove(query: any = {}): Promise<boolean> {
    const modelOnRemove = await this.getOne(query);

    await modelOnRemove.destroy(query);

    return true;
  }
}
