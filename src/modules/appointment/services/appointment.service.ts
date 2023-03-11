import {Injectable, StreamableFile} from '@nestjs/common';
import {AppointmentModel} from '../models/appointment.model';
import {BaseService} from '../../base/base.service';
import {AppointmentCreateDto} from '../dtos/appointment-create.dto';
import {AppointmentUpdateDto} from '../dtos/appointment-update.dto';
import {TransactionUtil} from '../../../utils/TransactionUtil';
import {Sequelize} from 'sequelize-typescript';
import {ModelNotFoundException} from '../../../exceptions/model-not-found.exception';
import {UserModel} from '../../user/models/user.model';
import {BadRequestException} from '../../../exceptions/bad-request.exception';
import {AppointmentFilterDto} from "../dtos/appointment-filter.dto";
import {Op} from "sequelize";
import mainConf from "../../../confs/main.conf";
import constantsConf from "../../../confs/constants.conf";
import {UserFilesModel} from "../../user/models/user-files.model";
import * as fs from 'fs';
import {createReadStream} from 'fs';
import * as path from 'path'
import {join} from 'path'
import * as process from "process";
import {Document, Packer, AlignmentType, Paragraph, Table, TableCell, TableRow, TextRun, UnderlineType} from "docx";

@Injectable()
export class AppointmentService extends BaseService<AppointmentModel> {
  constructor(private sequelize: Sequelize) {
    super(AppointmentModel);
  }

  public async checkIsFirstAppointment(patient_id: number): Promise<boolean> {
    const appointmentModel = await AppointmentModel.findOne({
      where: {
        patient_id,
      },
    });

    return !!appointmentModel;
  }

  public async create(
    createDto: AppointmentCreateDto,
  ): Promise<AppointmentModel> {
    let isPropagate = true;
    if (!TransactionUtil.isSet()) {
      TransactionUtil.setHost(await this.sequelize.transaction());
      isPropagate = false;
    }

    if (createDto.is_first) {
      if (await this.checkIsFirstAppointment(createDto.patient_id))
        throw new BadRequestException('first appointment has already created');
    }

    const patientModel = await UserModel.findOne({
      where: {
        id: createDto.patient_id
      }
    });

    if (patientModel.role < 2) throw new BadRequestException("You must provide patient id")

    const appointment = await AppointmentModel.create(
      {
        ...createDto,
      },
      TransactionUtil.getHost(),
    ).catch((err) => {
      if (!isPropagate) TransactionUtil.rollback();
      throw err;
    });

    if (!isPropagate) await TransactionUtil.commit();

    return appointment;
  }

  public async _getOne(
      id: number
  ): Promise<{ id, is_first, patient, doctor, value }> {
    const model = await super.getOne({
      where: {
        id,
      },
      include: [
        { model: UserModel, as: 'patient', include: [ UserFilesModel ] },
        { model: UserModel, as: 'doctor' }
      ],
    });
    return {
      id: model.id,
      is_first: model.is_first,
      patient: model.patient,
      doctor: model.doctor,
      value: model.value//JSON.parse(model.value)
    }
  }

  public async getLast(patient_id: number): Promise<{ id, is_first, patient, doctor, value }> {
    const models = await AppointmentModel.findAll({
      where: {
        patient_id,
      },
      order: [['id', 'DESC']],
    });

    if (!models.length)
      throw new ModelNotFoundException(AppointmentModel, null);

    return this._getOne(models[0].id);
  }

  public async getAll(filters: AppointmentFilterDto) {

    let order = [];
    if (filters.sortDate)
      order = [['createdAt', filters.sortDate]]

    let where = {}
    if (filters.patientFullname) {
      const patientFullname = filters.patientFullname.split(" ");
      where = {
        [Op.or]: [
          {
            surname: {
              [Op.like]: `%${patientFullname[0]}%`
            },
          },
          patientFullname.length > 1 ? {
            surname: {
              [Op.like]: `%${patientFullname[1]}%`
            },
          } : {},
          patientFullname.length > 2 ? {
            surname: {
              [Op.like]: `%${patientFullname[2]}%`
            },
          } : {},
          {
            name: {
              [Op.like]: `%${patientFullname[0]}%`
            },
          },
          patientFullname.length > 1 ? {
            name: {
              [Op.like]: `%${patientFullname[1]}%`
            },
          } : {},
          patientFullname.length > 2 ? {
            name: {
              [Op.like]: `%${patientFullname[2]}%`
            },
          } : {},
          {
            lastname: {
              [Op.like]: `%${patientFullname[0]}%`
            }
          },
          patientFullname.length > 1 ? {
            lastname: {
              [Op.like]: `%${patientFullname[1]}%`
            }
          } : {},
          patientFullname.length > 2 ? {
            lastname: {
              [Op.like]: `%${patientFullname[2]}%`
            }
          } : {}
        ]
      }
    }

    let page = 1;
    if (filters.page)
      page = filters.page
    let options = {
      attributes: ['id', 'createdAt'],
      offset: (page-1)*mainConf.limit,
      limit: mainConf.limit,
      order,
      include: [ { model: UserModel, as: 'patient', where, attributes:['id', 'name', 'surname', 'lastname', 'birthday'] }, { model: UserModel, as: 'doctor',  attributes:['id', 'name', 'surname', 'lastname'] } ]
    };
    if(filters.export) {
      options.limit = 999999999;
      options.include = [ { model: UserModel, as: 'patient', where, attributes:['id'] }, { model: UserModel, as: 'doctor',  attributes:['id'] } ]
    }
    return AppointmentModel.findAll(options);
  }

  public async update(
    updateDto: AppointmentUpdateDto,
  ): Promise<AppointmentModel> {
    const appointmentModel = await super.getOne({
      where: { id: updateDto.id },
    });

    if (updateDto.is_first)
      throw new BadRequestException('You can`t change is_first status!');

    await appointmentModel.update({ ...updateDto });

    return appointmentModel;
  }

  public async remove(id: number): Promise<void> {
    const model = await super.getOne({ where: { id } });

    TransactionUtil.setHost(await this.sequelize.transaction());
    
    await model.destroy(TransactionUtil.getHost());
    //If we remove "is_first" appointment and this user has other appointments we should to mark oldest as "is_first"
    if (model.is_first) {
      const other = await AppointmentModel.findAll();

      if (other.length > 1) {
        await other[1].update(
          {
            is_first: true,
          },
          TransactionUtil.getHost(),
        );
      }
    }

    await TransactionUtil.commit();
  }

  async uploadFile(id: number, file: Express.Multer.File): Promise<UserFilesModel> {
    const model = await UserModel.findOne({
      where: {id}
    }).catch(err => {
      throw err;
    });

    if (!model) throw new ModelNotFoundException(UserModel, id)

    return await UserFilesModel.create({
      user_id: model.id,
      path: file.filename,
      name: file.originalname
    })
  }

  async getFileStream(fileId: number) {
    const fileModel = await UserFilesModel.findOne({
      where: {
        id: fileId
      }
    });

    if (!fileModel)
      throw new ModelNotFoundException(UserFilesModel, fileId)

    const file = createReadStream(join(process.cwd(), 'upload', fileModel.path));
    return new StreamableFile(file);
  }

  private getDateStr(): string {
    let day:any = (new Date()).getDate();
    if (day < 10)
      day = `0${day}`;
    let month:any = (new Date()).getMonth() + 1;
    if (month < 10)
      month = `0${month}`;
    return `${day}.${month}.${(new Date()).getFullYear()}`;
  }
  private getAge(dateString: any): string {
    let today = new Date();
    let birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    let m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age.toString();
  }

  async generateDoc(appointmentId: number): Promise<{ key: number }> {
    const makeParagraph = (align, size, text) => {
      return new Paragraph({
        alignment: align,
        children: [new TextRun({
          size: size,
          text: text
        })]
      })
    };
    const paragraphsFromField = (field) => {
      return field.split("\n").map(i => makeParagraph(AlignmentType.LEFT, 16, i));
    };
    const appointmentModel = await this._getOne(appointmentId);

    const patient_fullname =  `${appointmentModel.patient.surname} ${appointmentModel.patient.name} ${appointmentModel.patient.lastname}`;
    const value = JSON.parse(appointmentModel.value); // why..? because in my case, it returns like a plain text....
    const date = this.getDateStr();
    const position = appointmentModel.doctor.position;

    const tables = [];
    for (let i = 0; i < 3; i++) {
      if(value["analyzes_" + (i + 1)].length < 1) continue;
      const header = new TableRow({
        tableHeader: true,
        children: [
          new TableCell({
            children: [
                new Paragraph({
                  children: [
                      new TextRun({
                        bold: true,
                        text: "Дата",
                        size: 16,
                      })
                  ]
                })
            ]
          }),
          ...(value["analyzes_" + (i + 1)].map((el) => {
            return new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      bold: true,
                      text: el.date,
                      size: 16,
                    })
                  ]
                }),
              ]
            });
          }))
        ]
      })
      let rows = [];
      for (let j = 0; j < constantsConf.analyze_constants[i].length; j++) {
        rows.push(new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                      new TextRun({
                        text: constantsConf.analyze_constants[i][j],
                        size: 16,
                      })
                  ]
                })
              ]
            }),
            ...(value["analyzes_" + (i + 1)].map(el => {
              return new TableCell({
                children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: el.values[j],
                          size: 16,
                        })
                      ]
                    })
                ],
                margins: {
                  bottom: 5
                }
              })
            }))
          ],
        }));
      }
      tables.push(
          new Table({
            rows: [
              header,
              ...rows
            ],
          }),
      );
    }

    const crops = value.crops.map(el => {
      let value = el.value == 0 ? "" : constantsConf.crops_constants[2][el.value];
      return new Paragraph({
        children: [
            new TextRun({
              size: 16,
              text: `${el.date} ${constantsConf.crops_constants[0][el.localization-1]} ${constantsConf.crops_constants[1][el.flora]} ${value}`
            })
        ]
      })
    });

    let uzi = [];

    if (value.uzi.text) {
      uzi.push(new Paragraph({
        children: [
          new TextRun({
            text: "Узи: ",
            size: 16,
            underline: {type: UnderlineType.SINGLE},
          })
        ]
      }))
      uzi.push(...paragraphsFromField(value.uzi.text))
    }

    let pregnancy = [];

    if (value.pregnancy.length) {
      pregnancy.push(new Paragraph({
        children: [
          new TextRun({
            text: "Течение настоящей беременности: ",
            size: 16,
            underline: {type: UnderlineType.SINGLE},
          })
        ]
      }))
      pregnancy.push(...paragraphsFromField(value.pregnancy))
    }

    let hospital = [];

    if (value.hospital.length) {
      hospital.push(new Paragraph({
        children: [
          new TextRun({
            text: "Госпитализации: ",
            size: 16,
            underline: {type: UnderlineType.SINGLE},
          })
        ]
      }));
      hospital.push(...paragraphsFromField((value.hospital)))
    }

    let research = [];

    if (value.research.length) {
      research.push(new Paragraph({
        children: [
          new TextRun({
            text: "Объективное исследование: ",
            size: 16,
            underline: {type: UnderlineType.SINGLE},
          })
        ]
      }))
      research.push(...paragraphsFromField(value.research))
    }

    let docResearch = [];

    if (value.docResearch.length) {
      docResearch.push(new Paragraph({
        children: [
          new TextRun({
            text: "Гинекологический осмотр: ",
            size: 16,
            underline: {type: UnderlineType.SINGLE},
          }),
          new TextRun({
            size: 16,
            text: ` ${value.docResearch}`,
          })
        ]
      }))
      docResearch.push(...paragraphsFromField(value.docResearch));
    }

    let additional = [];

    if (value.additional.length) {
      additional.push(...paragraphsFromField(value.additional));
    }

    const weeks = value.diagnosis.weeks;

    const checkboxes = value.diagnosis.checkboxes.map(i => makeParagraph(AlignmentType.LEFT, 16, constantsConf.diagnosisCheckboxes[i]));

    const dropdowns = Object.keys(value.diagnosis.dropdowns).filter(key => value.diagnosis.dropdowns[key] != 0).map(key => {
      if(key in constantsConf.dropdownsConstants.keyNames) {
        const val = value.diagnosis.dropdowns[key];
        return makeParagraph(AlignmentType.LEFT, 16, constantsConf.dropdownsConstants.keyNames[key] + ": " + constantsConf.dropdownsConstants[key][parseInt(val)]);
      }
    });

    const diagnosis = [new Paragraph({
      children: [
        new TextRun({
          text: "Диагноз: ",
          size: 16,
          underline: {
            type: UnderlineType.SINGLE
          }
        }),
        new TextRun({
          size: 16,
          text: `Беременность ${weeks} недель.`
        })
      ]
    })].concat(checkboxes).concat(dropdowns);

    const recommended = new Paragraph({
      children: [
          new TextRun({
            text: "Рекомендации: ",
            size: 16,
            underline: {
              type: UnderlineType.SINGLE
            }
          })
      ]
    });
    const recommended_list = value.recommended.checkboxes.map(el => {
      return new Paragraph({
        children: [
            new TextRun({
              text: constantsConf.recommendedCheckboxes[el],
              size: 16,
            })
        ],
        bullet: {
          level: 0
        }
      });
    }).concat(value.recommended.text.split("\n").map(el => {
      return new Paragraph({
        children: [
          new TextRun({
            text: el,
            size: 16,
          })
        ],
        bullet: {
          level: 0
        }
      });
    }));

    const doctor_fullname = `${appointmentModel.doctor.surname} ${appointmentModel.doctor.name.substring(0,1)}. ${appointmentModel.doctor.lastname.substring(0,1)}.`;

    const key = Date.now();

    const emptyParagraph = makeParagraph(AlignmentType.CENTER, 16, "");
    const children = [
      makeParagraph(AlignmentType.CENTER, 20, "Санкт-Петербургское государственное учреждение здравоохранения"),
      makeParagraph(AlignmentType.CENTER, 20, "\"Родильный дом №6 имени профессора Снегирева В.Ф.\""),
      makeParagraph(AlignmentType.CENTER, 20, "191014, Санкт-Петербург, ул. Маяковского, д.5"),
      makeParagraph(AlignmentType.CENTER, 20, "Тел.: +7(812) 273-58-34"),
      makeParagraph(AlignmentType.CENTER, 20, "e-mail: roddom6@zdrav.spb.ru"),
      makeParagraph(AlignmentType.CENTER, 20, "www.roddom6spb.ru"),
      emptyParagraph,
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({
          size: 20,
          text: "КОНСУЛЬТАТИВНОЕ ЗАКЛЮЧЕНИЕ",
          bold: true
        })]
      }),
      emptyParagraph,
      new Paragraph({
        alignment: AlignmentType.LEFT,
        children: [
          new TextRun({
            size: 16,
            bold: true,
            text: patient_fullname + ".  Возраст: " + this.getAge(appointmentModel.patient.birthday)
          }),
        ]
      }),
      emptyParagraph,
      new Paragraph({
        alignment: AlignmentType.LEFT,
        children: [new TextRun({
          size: 16,
          text: `Вес ${value.weight} кг, Рост ${value.height} см, ИМТ ${(()=>{
            const IMT = Math.floor(value.weight.replace(",",".") / Math.pow(value.height.replace(",",".")/100,2) * 10) / 10;
            if(IMT)
              return IMT > 200 ? '' : IMT;
            return '';})()}`
        })]
      }),
      new Paragraph({
        alignment: AlignmentType.LEFT,
        children: [new TextRun({
          size: 16,
          text: "Дата последних месячных - "+value.mensesDate
        })]
      }),
      new Paragraph({
        alignment: AlignmentType.LEFT,
        children: [new TextRun({
          size: 16,
          text: "Перенесенные заболевания: "+value.detailed.illnesses.map(i => constantsConf.detailed.illnesses[i]).join(", ")
        })]
      }),
      new Paragraph({
        alignment: AlignmentType.LEFT,
        children: [new TextRun({
          size: 16,
          text: "Операции, травмы: "+value.detailed.operations.map(i => constantsConf.detailed.operations[i]).concat(value.detailed.operationsCustom.length > 0 ? [value.detailed.operationsCustom] : []).join(", ")
        })]
      }),
      new Paragraph({
        alignment: AlignmentType.LEFT,
        children: [new TextRun({
          size: 16,
          text: "Туберкулез, венерические заболевания, гепатиты: "+(value.detailed.tvgCustom.length > 0 ? value.detailed.tvgCustom : "Отрицает")
        })]
      }),
      new Paragraph({
        alignment: AlignmentType.LEFT,
        children: [new TextRun({
          size: 16,
          text: "Аллергические реакции: "+(value.detailed.allergicCustom.length > 0 ? value.detailed.allergicCustom : "Отрицает")
        })]
      }),
      new Paragraph({
        alignment: AlignmentType.LEFT,
        children: [new TextRun({
          size: 16,
          text: "Гемотрансфузии: "+value.detailed.hemotransfusios.map(i => constantsConf.detailed.hemotransfusios[i]).concat(value.detailed.hemotransfusiosCustom.length > 0 ? [value.detailed.hemotransfusiosCustom] : []).join(", ")
        })]
      }),
      new Paragraph({
        alignment: AlignmentType.LEFT,
        children: [new TextRun({
          size: 16,
          text: "Наследственность: "+value.detailed.inheritance.map(i => constantsConf.detailed.inheritance[i]).concat(value.detailed.inheritanceCustom.length > 0 ? [value.detailed.inheritanceCustom] : []).join(", ")
        })]
      }),
      new Paragraph({
        alignment: AlignmentType.LEFT,
        children: [new TextRun({
          size: 16,
          text: "Обследование на наследственную тромбофилию: "+value.detailed.trombofilia.map(i => constantsConf.detailed.trombofilia[i]).join(", ")
        })]
      }),
      emptyParagraph,
      new Paragraph({
        alignment: AlignmentType.LEFT,
        children: [new TextRun({
          size: 16,
          text: "Гинекологические заболевания: "+(value.detailed.anameses_desiases.length > 0 ? value.detailed.anameses_desiases.map(i => constantsConf.detailed.anameses_desiases[i]).join(", ") : 'Отрицает')
        })]
      }),
      ...paragraphsFromField(value.anameses),
      emptyParagraph,
      ...tables,
      emptyParagraph,
      new Paragraph({
        children: [
          new TextRun({
            text: "Посевы",
            size: 16,
            underline: {type: UnderlineType.SINGLE},
          }),
        ]
      }),
      ...crops,
      emptyParagraph,
    ];

    if (uzi.length > 0)
      children.push(...uzi, emptyParagraph);
    if (pregnancy.length > 0)
      children.push(...pregnancy, emptyParagraph);
    if (hospital.length > 0)
      children.push(...hospital, emptyParagraph);
    if (research.length > 0)
      children.push(...research, emptyParagraph);
    if (docResearch.length > 0)
      children.push(...docResearch, emptyParagraph);
    if (additional.length > 0)
      children.push(...additional, emptyParagraph);

    children.push(
      ...diagnosis,
      new Paragraph({
        children: [
          new TextRun({
            text: "ОАГА (антенатальная гибель плода при сроке 30 недель, неразвивающаяся беременность 7 недель, преждевременные роды – эстренное кесарево сечение, ХПН, ГСД на инсулинотерапии).",
            size: 16
          }),
        ]
      }),
      emptyParagraph
    );

    children.push(recommended, ...recommended_list)

    children.push(
      emptyParagraph,
      new Paragraph({
        alignment: AlignmentType.LEFT,
        children: [new TextRun({
          size: 20,
          bold: true,
          text: doctor_fullname
        })]
      }),
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [new TextRun({
          size: 20,
          bold: true,
          text: date + " " + position
        })]
      })
    );

    const doc = new Document({
      creator: "Clinic",
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: "1cm",
                right: "1cm",
                bottom: "1cm",
                left: "2cm",
                header: 0,
                footer: "0.5cm",
                gutter: 0,
              }
            }
          },
          children
        }
      ]
    });

    const b64String = await Packer.toBase64String(doc);

    fs.writeFile(path.join(process.cwd(), 'files', key + '.docx'), Buffer.from(b64String, 'base64'), () => {})

    return {
      key
    };
  }

  getDoc(key: string) {
    const file = createReadStream(join(process.cwd(), 'files', key+'.docx'));
    return new StreamableFile(file);
  }
}
