import { HttpException } from "@nestjs/common";

export class ModelNotFoundException<T> extends HttpException {
  constructor(model: T, id: number) {
    const regex = new RegExp("(class)\\s(\\w+)\\s(extends).*");
    try {
      const modelName = model.toString().match(regex)[2];
      super(JSON.stringify({
        id,
        model,
        text: `${modelName} with ${id} not found`
      }), 404);
    } catch (err) {
      super(JSON.stringify({
        id,
        model,
        text: `${model} with ${id} not found`
      }), 404);
    }
  }

}
