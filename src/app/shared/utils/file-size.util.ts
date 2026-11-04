/** Tamanho de arquivo para exibição: KB abaixo de 1 MB (sem casas) e MB com uma casa (ex.: "340 KB", "2.0 MB"). */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
