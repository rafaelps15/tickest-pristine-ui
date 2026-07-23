/** Corpo de resposta de GET /roles (item da lista). */
export interface RoleResponseDto {
    id: string;
    name: string;
    permissionCodes: string[];
}
