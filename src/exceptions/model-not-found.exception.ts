import { HttpException } from "@nestjs/common";

export class ModelNotFoundException<T> extends HttpException {
  constructor(model: T, id: number) {
    const regex = new RegExp("(class)\\s(\\w+)\\s(extends).*");
    let modelName;

    try {
      modelName = model.toString().match(regex)[2];
    } catch (err) {
      modelName = model.toString();
    }

    super(JSON.stringify({
      id,
      model,
      text: `${modelName} with ${id} not found`
    }), 404);
  }

}
