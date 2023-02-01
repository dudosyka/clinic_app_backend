import { Injectable, NotFoundException } from '@nestjs/common';
import { Model } from 'sequelize-typescript';
import { AbTherapyReference } from '../models/references/ab-therapy.reference';
import { DiabetesMelitusReference } from '../models/references/diabetes-melitus.reference';
import { EyeDiseaseReference } from '../models/references/eye-disease.reference';
import { GeneCarriageReference } from '../models/references/gene-carriage.reference';
import { GsdReference } from '../models/references/gsd.reference';
import { HemodinDisordersReference } from '../models/references/hemodin-disorders.reference';
import { IvfReference } from '../models/references/ivf.reference';
import { IvigReference } from '../models/references/ivig.reference';
import { NmhReference } from '../models/references/nmh.reference';
import { OagaReference } from '../models/references/oaga.reference';
import { ObesityReference } from '../models/references/obesity.reference';
import { PlasmapharesisReference } from '../models/references/plasmapharesis.reference';
import { TwinsReference } from '../models/references/twins.reference';
import { UternusScarReference } from '../models/references/uternus-scar.reference';
import { VaccineMicrofloraReference } from '../models/references/vaccine.microflora.reference';
import { VaccineLocalizationReference } from '../models/references/vaccine-localization.reference';
import { VaccineValueReference } from '../models/references/vaccine-value.reference';
import { ModelNotFoundException } from '../../../exceptions/model-not-found.exception';

@Injectable()
export class ReferencesService {
  private registeredClassed = {
    AbTherapyReference,
    DiabetesMelitusReference,
    EyeDiseaseReference,
    GeneCarriageReference,
    GsdReference,
    HemodinDisordersReference,
    IvfReference,
    IvigReference,
    NmhReference,
    OagaReference,
    ObesityReference,
    PlasmapharesisReference,
    TwinsReference,
    UternusScarReference,
    VaccineMicrofloraReference,
    VaccineLocalizationReference,
    VaccineValueReference,
  };

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
