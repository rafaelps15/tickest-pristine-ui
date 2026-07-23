/** Corpo de resposta de GET /departments (item da lista). */
export interface DepartmentResponseDto {
    id: string;
    name: string;
    description: string;
    responsibleUserName: string | null;
    sectors: { id: string; name: string }[];
}
