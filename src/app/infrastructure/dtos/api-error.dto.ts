/** Corpo de erro (RFC 7807 ProblemDetails) devolvido pela API em falhas. */
export interface ApiErrorDto {
  type?: string;
  title: string;
  status: number;
  detail?: string;
  errors?: Record<string, string[]>;
}
