export class UserFilterDto {
  role: number;
  fullName?: string;

  page?: number;

  hasAppointment?: boolean

  export?: boolean | null;
}
