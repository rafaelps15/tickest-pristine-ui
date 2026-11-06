/**
 * Espera até liberar a URL temporária do arquivo baixado. O navegador lê essa URL depois do clique, fora
 * da chamada que clicou: revogada na hora, o download pode falhar (relatado no Firefox e no Safari).
 * 40 s é o intervalo que o FileSaver.js usa para isso; o arquivo só fica na memória durante esse tempo.
 */
export const FILE_DOWNLOAD_URL_REVOKE_DELAY_MS = 40_000;

/**
 * Dispara no navegador o download do arquivo, com o nome informado, por um link temporário; a URL do
 * arquivo é revogada depois de {@link FILE_DOWNLOAD_URL_REVOKE_DELAY_MS}.
 */
export function saveFile(file: Blob, fileName: string): void {
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), FILE_DOWNLOAD_URL_REVOKE_DELAY_MS);
}
