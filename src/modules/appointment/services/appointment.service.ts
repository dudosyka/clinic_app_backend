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
    console.log(model.value);
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
    const appointmentModel = await this._getOne(appointmentId);

    const patient_fullname =  `${appointmentModel.patient.surname} ${appointmentModel.patient.name} ${appointmentModel.patient.lastname}`;
    const value = JSON.parse(appointmentModel.value); // why..? because in my case, it returns like a plain text....
    const date = this.getDateStr();
    const position = appointmentModel.doctor.position;
    const anameses = value.anameses.replaceAll("\n","<br>");

    const tables = [];
    for (let i = 0; i < 3; i++) {
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
          new Paragraph({
            text: "\n"
          })
      );
    }

    const crops = value.crops.map(el => {
      let value = el.value == 0 ? "" : constantsConf.crops_constants[2][el.value];
      return new Paragraph({
        children: [
            new TextRun({
              size: 16,
              text: `${el.date} ${constantsConf.crops_constants[0][el.localization]} ${constantsConf.crops_constants[1][el.flora]} ${value}`
            })
        ]
      })
    });

    let uzi = null;

    if (value.uzi.text) {
      uzi = new Paragraph({
        children: [
          new TextRun({
            text: "Узи: ",
            size: 22,
            underline: {type: UnderlineType.SINGLE},
          }),
          new TextRun({
            size: 16,
            text: ` ${value.uzi.text}`,
          })
        ]
      })
    }

    let pregnancy = null;

    if (value.pregnancy.length) {
      pregnancy = new Paragraph({
        children: [
          new TextRun({
            text: "Течение настоящей беременности: ",
            size: 22,
            underline: {type: UnderlineType.SINGLE},
          }),
          new TextRun({
            size: 16,
            text: ` ${value.pregnancy}`,
          })
        ]
      })
    }

    let hospital = null;

    if (value.hospital.length) {
      hospital = new Paragraph({
        children: [
          new TextRun({
            text: "Госпитализации: ",
            size: 22,
            underline: {type: UnderlineType.SINGLE},
          }),
          new TextRun({
            size: 16,
            text: ` ${value.hospital}`,
          })
        ]
      })
    }

    let research = null;

    if (value.research.length) {
      research = new Paragraph({
        children: [
          new TextRun({
            text: "Объективное исследование: ",
            size: 22,
            underline: {type: UnderlineType.SINGLE},
          }),
          new TextRun({
            size: 16,
            text: ` ${value.research}`,
          })
        ]
      })
    }

    let docResearch = null;

    if (value.docResearch.length) {
      docResearch = new Paragraph({
        children: [
          new TextRun({
            text: "Гинекологический осмотр: ",
            size: 22,
            underline: {type: UnderlineType.SINGLE},
          }),
          new TextRun({
            size: 16,
            text: ` ${value.docResearch}`,
          })
        ]
      })
    }

    let additional = null;

    if (value.additional.length) {
      additional = new Paragraph({
        children: [
          new TextRun({
            text: `${value.additional}`,
            size: 16,
            break: 1
          })
        ]
      })
    }

    const weeks = value.diagnosis.weeks;

    let checkboxes = '';

    checkboxes += value.diagnosis.checkboxes.map(i => constantsConf.diagnosisCheckboxes[i])
      .concat(value.detailed.illnesses.map(i => constantsConf.illnesses[i]))
      .concat(value.detailed.trombofilia.map(i => constantsConf.trombofilia[i]))
      .join(", ");

    const dropdowns = Object.keys(value.diagnosis.dropdowns).filter(key => value.diagnosis.dropdowns[key] != 0).map(key => {
      const val = value.diagnosis.dropdowns[key];
      console.log(key);
      return constantsConf.dropdownsConstants.keyNames[key] + ": " +constantsConf.dropdownsConstants[key][parseInt(val)];
    }).join(", ");

    const diagnosis = new Paragraph({
      children: [
        new TextRun({
          text: "Диагноз: ",
          size: 22,
          underline: {
            type: UnderlineType.SINGLE
          }
        }),
        new TextRun({
          size: 16,
          text: `Беременность ${weeks} недель. ${checkboxes}, ${dropdowns}`
        })
      ]
    });

    const recommended = new Paragraph({
      children: [
          new TextRun({
            text: value.recommended.text,
            size: 16,
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
    });

    // const doctor_fullname = `${appointmentModel.doctor.surname} ${appointmentModel.doctor.name.substring(0,1)}. ${appointmentModel.doctor.lastname.substring(0,1)}.`;

    const key = Date.now();

    // fs.writeFile(path.join(process.cwd(), 'files', key + '.html'), html, () => {});
    //
    // const fileBuffer = await HTMLtoDOCX(html, null, {
    //   table: { row: { cantSplit: true } },
    //   footer: true,
    //   pageNumber: true,
    //   margins: {
    //     left: '0.5cm',
    //     top: '0.5cm',
    //     right: '0.5cm',
    //     bottom: '0.5cm',
    //     header: 0,
    //     footer: '1cm',
    //     gutter: 0
    //   },
    //   fontSize: 16
    // });
    // fs.writeFile(path.join(process.cwd(), 'files', key + '.docx'), fileBuffer, () => {})

    const children = [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({
          size: 48,
          text: "Консультативное заключение"
        })]
      }),
      new Paragraph({
        text: "\n"
      }),
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
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [new TextRun({
          size: 16,
          bold: true,
          text: date + " " + position
        })]
      }),
      new Paragraph({
        alignment: AlignmentType.LEFT,
        children: [new TextRun({
          text: anameses
        })]
      }),
      new Paragraph({
        text: "\n"
      }),
      ...tables,
      new Paragraph({
        children: [
          new TextRun({
            text: "Посевы",
            size: 22,
            underline: {type: UnderlineType.SINGLE},
          }),
        ]
      }),
      ...crops,
    ];

    if (uzi)
      children.push(uzi);
    if (pregnancy)
      children.push(pregnancy);
    if (hospital)
      children.push(hospital);
    if (research)
      children.push(research);
    if (docResearch)
      children.push(docResearch);
    if (additional)
      children.push(additional);

    children.push(diagnosis);

    children.push(recommended)
    recommended_list.forEach(el => {
      children.push(el)
    })

    children.push(
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({
            size: 16,
            bold: true,
            text: date + " " + position
          })]
        })
    );

    const doc = new Document({
      creator: "Clinic",
      sections: [
        {
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
