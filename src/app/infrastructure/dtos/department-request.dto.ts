/** Corpo da requisição POST /departments e PUT /departments/{departmentId}. */
export interface DepartmentRequestDto {
    name: string;
    description: string;
    responsibleUserId?: string;
}
