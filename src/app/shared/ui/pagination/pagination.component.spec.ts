import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { PaginationComponent, pageWindow } from './pagination.component';

describe('pageWindow', () => {
  it('lista todas as páginas quando são até 7', () => {
    expect(pageWindow(3, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it('usa reticências nos saltos quando há muitas páginas', () => {
    expect(pageWindow(25, 50)).toEqual([1, '…', 24, 25, 26, '…', 50]);
  });

  it('não repete reticências nas pontas', () => {
    expect(pageWindow(1, 50)).toEqual([1, 2, '…', 50]);
    expect(pageWindow(50, 50)).toEqual([1, '…', 49, 50]);
  });
});

describe('PaginationComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaginationComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();
  });

  /** Cria o rodapé com os valores informados. */
  async function create(values: { page?: number; totalPages?: number; total?: number; pageSize?: number; disabled?: boolean } = {}) {
    const fixture = TestBed.createComponent(PaginationComponent);
    fixture.componentRef.setInput('page', values.page ?? 1);
    fixture.componentRef.setInput('totalPages', values.totalPages ?? 3);
    fixture.componentRef.setInput('total', values.total ?? 45);
    fixture.componentRef.setInput('pageSize', values.pageSize ?? 20);
    fixture.componentRef.setInput('noun', 'chamados');
    fixture.componentRef.setInput('disabled', values.disabled ?? false);
    await fixture.whenStable();
    return fixture;
  }

  /** Botão do rodapé pelo texto. */
  function button(fixture: { nativeElement: HTMLElement }, text: string): HTMLButtonElement | undefined {
    return Array.from(fixture.nativeElement.querySelectorAll('button')).find(b => b.textContent?.trim() === text);
  }

  it('mostra o intervalo exibido com o nome dos itens', async () => {
    const fixture = await create({ page: 2 });
    expect(fixture.nativeElement.textContent).toContain('Exibindo 21–40 de 45 chamados');
  });

  it('mostra 0–0 quando não há itens', async () => {
    const fixture = await create({ total: 0, totalPages: 0 });
    expect(fixture.nativeElement.textContent).toContain('Exibindo 0–0 de 0 chamados');
  });

  it('esconde os controles de página quando há só uma página, mas mantém o "Por página"', async () => {
    const fixture = await create({ totalPages: 1 });
    expect(fixture.nativeElement.querySelector('nav')).toBeNull();
    expect(fixture.nativeElement.querySelector('select')).not.toBeNull();
  });

  it('marca a página atual com aria-current', async () => {
    const fixture = await create();
    expect(button(fixture, '1')?.getAttribute('aria-current')).toBe('page');
    expect(button(fixture, '2')?.getAttribute('aria-current')).toBeNull();
  });

  it('pede a página clicada, a anterior e a próxima', async () => {
    const fixture = await create({ page: 2 });
    const emitted: number[] = [];
    fixture.componentInstance.pageChange.subscribe(page => emitted.push(page));

    button(fixture, '3')?.click();
    button(fixture, 'Anterior')?.click();
    button(fixture, 'Próxima')?.click();

    expect(emitted).toEqual([3, 1, 3]);
  });

  it('desabilita Anterior na primeira página, Próxima na última, e ambos enquanto carrega', async () => {
    const first = await create({ page: 1 });
    expect(button(first, 'Anterior')?.disabled).toBeTrue();
    expect(button(first, 'Próxima')?.disabled).toBeFalse();

    const last = await create({ page: 3 });
    expect(button(last, 'Próxima')?.disabled).toBeTrue();

    const loading = await create({ page: 2, disabled: true });
    expect(button(loading, 'Anterior')?.disabled).toBeTrue();
    expect(button(loading, 'Próxima')?.disabled).toBeTrue();
  });

  it('pede a troca da quantidade por página, ligando o rótulo ao seletor', async () => {
    const fixture = await create();
    const emitted: number[] = [];
    fixture.componentInstance.pageSizeChange.subscribe(size => emitted.push(size));

    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    expect(fixture.nativeElement.querySelector(`label[for="${select.id}"]`)).not.toBeNull();
    select.value = '50';
    select.dispatchEvent(new Event('change'));

    expect(emitted).toEqual([50]);
  });
});
