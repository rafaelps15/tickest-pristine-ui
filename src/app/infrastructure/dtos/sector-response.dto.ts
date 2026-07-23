/** Corpo de resposta de GET /sectors (item da lista). */
export interface SectorResponseDto {
    id: string;
    name: string;
    description: string | null;
    departmentId: string;
}
