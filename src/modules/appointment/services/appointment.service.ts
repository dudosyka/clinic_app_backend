import {Injectable, StreamableFile} from '@nestjs/common';
import { AppointmentModel } from '../models/appointment.model';
import { BaseService } from '../../base/base.service';
import { AppointmentCreateDto } from '../dtos/appointment-create.dto';
import { AppointmentUpdateDto } from '../dtos/appointment-update.dto';
import { TransactionUtil } from '../../../utils/TransactionUtil';
import { Sequelize } from 'sequelize-typescript';
import { ModelNotFoundException } from '../../../exceptions/model-not-found.exception';
import { UserModel } from '../../user/models/user.model';
import { BadRequestException } from '../../../exceptions/bad-request.exception';
import {AppointmentFilterDto} from "../dtos/appointment-filter.dto";
import {Op} from "sequelize";
import mainConf from "../../../confs/main.conf";
import {UserFilesModel} from "../../user/models/user-files.model";
import {createReadStream} from 'fs';
import {join} from 'path'
import * as process from "process";
import * as fs from "fs";
import * as path from "path";
const HTMLtoDOCX = require('html-to-docx')

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
          {
            name: {
              [Op.like]: `%${patientFullname[1]}%`
            },
          },
          {
            lastname: {
              [Op.like]: `%${patientFullname[2]}%`
            }
          }
        ]
      }
    }

    let page = 1;
    if (filters.page)
      page = filters.page

    return AppointmentModel.findAll({
      attributes: ['id', 'createdAt'],
      offset: (page-1)*mainConf.limit,
      limit: mainConf.limit,
      order,
      include: [ { model: UserModel, as: 'patient', where, attributes:['name', 'surname', 'lastname', 'birthday'] }, { model: UserModel, as: 'doctor',  attributes:['name', 'surname', 'lastname'] } ]
    });
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
    const analyze_constants = [
      ["Протромбиновый индекс", "МНО", "Фибриноген", "АПТВ", "Тромбиновое время", "Антитромбин III", "Тест на LA", "Д-димер", "Гомоцистеин", "Протеин C", "Протеин S"],
      ["АТ к β2-гликопротеину", "АТ к кардиолипину", "АТ к аннексину V", "АТ к ХГЧ", "АТ к протромбину", "АТ к фосфатидилсерину", "АТ к фосфатидил к-те", "АТ к фосфатидилинозитолу", "Антинуклеарный фактор", "АТ к 2сп ДНК"],
      ["Lei", "Hb", "Ht", "Tr", "Ферритин", "ТТГ"]
    ];
    const crops_constants = [
      ["Посев мочи", "Посев из ц/канала", "Посев из носа", "Посев из зева"],
      ["Не выделена", "E. coli", "Enterococcus sp.", "Enterococcus faecalis", "Klebsiella sp.", "Staphyloc. ep.", "Streptococcus anginosus", "Streptococcus agalact.", "Streptococcus or.", "Streptococcus spp", "Streptococcus pneumoniae", "Candida albicans", "Lactobacillus sp.", "Proteus mirabilis", "Citrobacter", "Enterobacteriaceae", "Pseudomonas aeruginosa", "Haemophilus influenzae", "Moraxella catarrhalis", "Neisseria sicca", "Neisseria spp.", "Corynebacterium spp"],
      ["Не выделена", "10³ КОЕ/мл", "10⁴ КОЕ/мл", "10⁵ КОЕ/мл", "10⁶ КОЕ/мл", "10⁷ КОЕ/мл", "10⁸ КОЕ/мл"]
    ];
    const dropdownsConstants = {
      rubec: [
        "Отсутствует",
        "Рубец на матке после  кесарева сечения",
        "Рубец на матке после 2-х операций кесарева сечения",
        "Рубец на матке после малого кесарева сечения",
        "Рубец на матке после перфорации матки",
        "Рубец на матке после консервативной миомэктомии"
      ],
      hemodynamics: [
        "Отсутствуют",
        "I степени",
        "II степени",
        "III степени"
      ],
      eye_disease: [
        "Отсутствуют",
        "Миопия слабой степени",
        "Миопия средней степени",
        "Миопия высокой степени",
        "Миопический астигматизм",
        "Врожденная катаракта",
        "ПХРД"
      ],
      diabetes: [
        "Отсутствует",
        "1 типа",
        "2 типа на диете",
        "2 типа на инсулине"
      ],
      oaga: [
        "Отсутствует",
        "ST I",
        "ST II",
        "CIN III",
        "Ca incitu",
        "Рубцовая деформация ш/м",
        "Дермоидные кисты яичников",
        "НГЭ III, комбинированое лечение",
        "НГЭ II",
      ],
    }
    const appointmentModel = await this._getOne(appointmentId);
    // console.log(appointmentModel.value);
    const patient_fullname =  `${appointmentModel.patient.surname} ${appointmentModel.patient.name} ${appointmentModel.patient.lastname}`;
    const date = this.getDateStr();
    const position = appointmentModel.doctor.position;
    const anameses = appointmentModel.value.anameses;
    const value = appointmentModel.value;
    const tables = [];
    for (let i = 0; i < 3; i++) {
      const header = value["analyzes_" + (i + 1)].map(el => {
        return `<td>${el.date}</td>`;
      })
      let rows = analyze_constants[i].map((el) => {
        return `
        <tr>
            <td>${el}</td>
      `;
      });
      value["analyzes_" + (i + 1)].forEach(el => {
        el.values.forEach((el, index) => {
          rows[index] += `
          <td>${el}</td>
        `;
        })
      });
      rows = rows.map(el => {
        return el + '</tr>';
      });
      tables.push({
        header: header.join(''), rows: rows.join('')
      })
    }

    const crops = value.crops.map(el => {
      let value = el.value == 0 ? "" : crops_constants[2][el.value];
      return `
        <p>
            <span>${el.date}</span> <span>${crops_constants[0][el.localization]}</span> <span>${crops_constants[1][el.flora]}</span> <span>${value}</span>
        </p>
      `;
    }).join('');

    const uzi = value.uzi.text;

    const pregnancy = value.pregnancy.length ? `Течение настоящей беременности: ${value.pregnancy.replaceAll('\n', '<br>')}` : '';
    const hospital = value.hospital.length ? `Госпитализации: ${value.hospital.replaceAll('\n', '<br>')}` : '';
    const research = value.research.length ? `Объективное исследование: ${value.research.replaceAll('\n', '<br>')}` : '';
    const docResearch = value.docResearch.length ? `Гинекологический осмотр: ${value.docResearch.replaceAll('\n', '<br>')}` : '';

    const additional = value.additional.length ? `${value.additional}` : '';

    const weeks = value.diagnosis.weeks;
    let checkboxes = '';
    value.diagnosis.checkboxes.forEach(item => {
      item.boxes.filter(el => {
        return el.value;
      }).forEach(el => {
        checkboxes += `${el.label} `;
      });
    });
    const dropdowns = Object.keys(value.diagnosis.dropdowns).filter(key => value.diagnosis.dropdowns[key] != 0).map(key => {
      const val = value.diagnosis.dropdowns[key];
      console.log(key);
      return dropdownsConstants[key][parseInt(val)];
    }).join(", ");

    const recommended = value.recommended.text;
    const recommended_list = value.recommended.checkboxes.filter(el => el.value).map(el => {
      return `<li>${el.label}</li>`;
    }).join('');

    const doctor_fullname = `${appointmentModel.doctor.surname} ${appointmentModel.doctor.name} ${appointmentModel.doctor.lastname}`;

    let html = fs.readFileSync(path.join(process.cwd(), 'files', 'appointment.template.html')).toString();

    html = html.replace('{patient.name}', patient_fullname);
    html = html.replace('{patient.age}', this.getAge(appointmentModel.patient.birthday));
    html = html.replace('{date}', date);
    html = html.replace('{date}', date);
    html = html.replace('{date}', date);
    html = html.replace('{doctor.position}', position);
    html = html.replace('{doctor.position}', position);
    html = html.replace('{anameses}', anameses);
    tables.forEach((el, index) => {
      html = html.replace(`{${index}_table_header}`, el.header);
      html = html.replace(`{${index}_table_rows}`, el.rows);
    });

    html = html.replace('{pregnancy}', pregnancy);
    html = html.replace('{hospital}', hospital);
    html = html.replace('{research}', research);
    html = html.replace('{docResearch}', docResearch);
    html = html.replace('{additional}', additional);

    html = html.replace('{crops}', crops);
    html = html.replace('{uzi}', uzi);

    html = html.replace('{weeks}', weeks);
    html = html.replace('{checkboxes}', checkboxes);
    html = html.replace('{dropdowns}', dropdowns);

    html = html.replace('{recommended_list}', recommended_list);
    html = html.replace('{recommended}', recommended);

    html = html.replace('{doctor.name}', doctor_fullname);

    // fs.writeFile(path.join(process.cwd(), 'src', 'assets', 'exmaple2.html'), html, err => {})

    const key = Date.now();

    fs.writeFile(path.join(process.cwd(), 'files', key + '.html'), html, err => {});

    const fileBuffer = await HTMLtoDOCX(html, null, {
      table: { row: { cantSplit: true } },
      footer: true,
      pageNumber: true,
    });
    fs.writeFile(path.join(process.cwd(), 'files', key + '.docx'), fileBuffer, err => {})

    return {
      key
    };
  }

  getDocPreview(key: string) {
    const file = createReadStream(join(process.cwd(), 'files', key+'.html'));
    return new StreamableFile(file);
  }

  getDoc(key: string) {
    const file = createReadStream(join(process.cwd(), 'files', key+'.docx'));
    return new StreamableFile(file);
  }
}
