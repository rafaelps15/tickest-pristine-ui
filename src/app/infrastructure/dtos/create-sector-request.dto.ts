/** Corpo da requisição POST /sectors. */
export interface CreateSectorRequestDto {
    name: string;
    description?: string;
    departmentId: string;
}
