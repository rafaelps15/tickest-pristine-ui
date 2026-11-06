import { FILE_DOWNLOAD_URL_REVOKE_DELAY_MS, saveFile } from './file-download.util';

describe('file-download.util', () => {
  const file = new Blob(['conteúdo'], { type: 'application/pdf' });
  let link: HTMLAnchorElement;

  beforeEach(() => {
    jasmine.clock().install();
    spyOn(URL, 'createObjectURL').and.returnValue('blob:fake-url');
    spyOn(URL, 'revokeObjectURL');
    link = document.createElement('a');
    spyOn(link, 'click');
    spyOn(document, 'createElement').and.returnValue(link);
  });

  afterEach(() => jasmine.clock().uninstall());

  it('triggers the download through a temporary link to the file, with the given name', () => {
    saveFile(file, 'nota-fiscal.pdf');

    expect(URL.createObjectURL).toHaveBeenCalledOnceWith(file);
    expect(link.href).toBe('blob:fake-url');
    expect(link.download).toBe('nota-fiscal.pdf');
    expect(link.click).toHaveBeenCalledTimes(1);
  });

  it('revokes the URL of the file only after the interval, not right after the click', () => {
    saveFile(file, 'nota-fiscal.pdf');
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();

    jasmine.clock().tick(FILE_DOWNLOAD_URL_REVOKE_DELAY_MS - 1);
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();

    jasmine.clock().tick(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledOnceWith('blob:fake-url');
  });
});
