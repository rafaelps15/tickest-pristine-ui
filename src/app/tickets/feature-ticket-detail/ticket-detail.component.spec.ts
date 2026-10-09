import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { TicketDetailComponent } from './ticket-detail.component';
import { TicketDetailStore } from '../application/ticket-detail.store';
import { TicketAttachmentsStore } from '../application/ticket-attachments.store';
import { TicketDetail } from '../entities/ticket';
import { TicketAttachment } from '../entities/ticket-attachment';
import { TicketPriority } from '../entities/ticket-priority';
import { TicketStatus } from '../entities/ticket-status';
import { TicketSlaStatus } from '../entities/ticket-sla-status';
import { ConfirmDialogService } from '../../shared';

describe('TicketDetailComponent', () => {
  const ticket: TicketDetail = {
    id: 't1', title: 'Impressora não funciona', description: 'A impressora do 3º andar não imprime.',
    priority: TicketPriority.Medium, status: TicketStatus.Open,
    openedByUserId: 'u1', openedByName: 'Maria Souza', assignedToUserId: null, assignedToName: null,
    sectorId: 's1', sectorName: 'Suporte',
    createdAtUtc: '2026-01-01T12:00:00Z', dueAtUtc: '2026-01-02T12:00:00Z', slaWarningAtUtc: '2026-01-02T06:00:00Z',
    resolvedAtUtc: null, slaStatus: TicketSlaStatus.OnTime
  };
  const attachment: TicketAttachment = {
    id: 'a1', ticketId: 't1', uploadedByUserId: 'u1',
    fileName: 'foto.png', contentType: 'image/png', fileSizeBytes: 1024,
    uploadedAtUtc: '2026-01-01T12:00:00Z'
  };

  /** Cria um store de detalhe falso com signals reais. */
  function createDetailStoreFake() {
    return {
      ticket: signal<TicketDetail | undefined>(ticket),
      state: signal({ loading: false, error: null as string | null }),
      loadTicket: jasmine.createSpy('loadTicket')
    };
  }

  function createAttachmentsStoreFake() {
    return {
      attachments: signal<TicketAttachment[]>([attachment]),
      hasMore: signal(false),
      loadingMore: signal(false),
      loadMore: jasmine.createSpy('loadMore'),
      listState: signal({ loading: false, error: null as string | null }),
      uploading: signal(false),
      uploadError: signal<string | null>(null),
      downloading: signal(false),
      downloadError: signal<string | null>(null),
      deleting: signal(false),
      loadForTicket: jasmine.createSpy('loadForTicket'),
      upload: jasmine.createSpy('upload'),
      download: jasmine.createSpy('download'),
      delete: jasmine.createSpy('delete')
    };
  }

  let detailStoreFake: ReturnType<typeof createDetailStoreFake>;
  let attachmentsStoreFake: ReturnType<typeof createAttachmentsStoreFake>;
  let confirmDialogServiceFake: { confirm: jasmine.Spy };

  beforeEach(async () => {
    detailStoreFake = createDetailStoreFake();
    attachmentsStoreFake = createAttachmentsStoreFake();
    confirmDialogServiceFake = { confirm: jasmine.createSpy('confirm').and.returnValue(of(true)) };

    await TestBed.configureTestingModule({
      imports: [TicketDetailComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: TicketDetailStore, useValue: detailStoreFake },
        { provide: TicketAttachmentsStore, useValue: attachmentsStoreFake },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: 't1' }) } } },
        { provide: ConfirmDialogService, useValue: confirmDialogServiceFake }
      ]
    }).compileComponents();
  });

  it('carrega o ticket pelo id da rota e os anexos ao inicializar', async () => {
    const fixture = TestBed.createComponent(TicketDetailComponent);
    await fixture.whenStable();

    expect(detailStoreFake.loadTicket).toHaveBeenCalledWith('t1');
    expect(attachmentsStoreFake.loadForTicket).toHaveBeenCalledWith('t1');
    expect(fixture.nativeElement.textContent).toContain('Impressora não funciona');
  });

  it('mostra a situação do SLA com texto, e não só com a cor', async () => {
    detailStoreFake.ticket.set({ ...ticket, slaStatus: TicketSlaStatus.Breached });
    const fixture = TestBed.createComponent(TicketDetailComponent);
    await fixture.whenStable();

    const badge = Array.from(fixture.nativeElement.querySelectorAll('.badge') as NodeListOf<HTMLElement>)
      .find(b => b.textContent?.includes('SLA'));
    expect(badge?.textContent?.trim()).toBe('SLA: Atrasado');
    expect(badge?.classList).toContain('bg-label-danger');
  });

  it('mostra quem abriu, o setor e o responsável (ou que ainda não foi atribuído)', async () => {
    const fixture = TestBed.createComponent(TicketDetailComponent);
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Maria Souza');
    expect(text).toContain('Suporte');
    expect(text).toContain('Ainda não atribuído');
  });

  it('mostra o botão de carregar mais anexos só quando há mais páginas, e carrega ao clicar', async () => {
    const fixture = TestBed.createComponent(TicketDetailComponent);
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).not.toContain('Carregar mais anexos');

    attachmentsStoreFake.hasMore.set(true);
    await fixture.whenStable();

    const button = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
      .find(b => b.textContent?.includes('Carregar mais anexos'));
    button!.click();

    expect(attachmentsStoreFake.loadMore).toHaveBeenCalled();
  });

  it('renderiza os anexos carregados', async () => {
    const fixture = TestBed.createComponent(TicketDetailComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('foto.png');
    expect(fixture.nativeElement.textContent).toContain('1 KB');
  });

  it('rejeita um arquivo maior que o limite, sem chamar o store', async () => {
    const fixture = TestBed.createComponent(TicketDetailComponent);
    await fixture.whenStable();

    const bigFile = new File([new Uint8Array(11 * 1024 * 1024)], 'grande.pdf', { type: 'application/pdf' });
    const input = document.createElement('input');
    Object.defineProperty(input, 'files', { value: [bigFile] });

    fixture.componentInstance.onFileSelected({ target: input } as unknown as Event);

    expect(attachmentsStoreFake.upload).not.toHaveBeenCalled();
    expect(fixture.componentInstance.fileValidationError()).toContain('tamanho máximo');
  });

  it('rejeita um tipo de arquivo não suportado, sem chamar o store', async () => {
    const fixture = TestBed.createComponent(TicketDetailComponent);
    await fixture.whenStable();

    const file = new File(['x'], 'script.exe', { type: 'application/x-msdownload' });
    const input = document.createElement('input');
    Object.defineProperty(input, 'files', { value: [file] });

    fixture.componentInstance.onFileSelected({ target: input } as unknown as Event);

    expect(attachmentsStoreFake.upload).not.toHaveBeenCalled();
    expect(fixture.componentInstance.fileValidationError()).toContain('não é suportado');
  });

  it('envia o upload quando o arquivo é válido', async () => {
    const fixture = TestBed.createComponent(TicketDetailComponent);
    await fixture.whenStable();

    const file = new File(['x'], 'foto.png', { type: 'image/png' });
    const input = document.createElement('input');
    Object.defineProperty(input, 'files', { value: [file] });

    fixture.componentInstance.onFileSelected({ target: input } as unknown as Event);

    expect(attachmentsStoreFake.upload).toHaveBeenCalledWith(file);
    expect(fixture.componentInstance.fileValidationError()).toBeNull();
  });

  it('exclui o anexo quando confirmado', async () => {
    confirmDialogServiceFake.confirm.and.returnValue(of(true));
    const fixture = TestBed.createComponent(TicketDetailComponent);
    await fixture.whenStable();

    fixture.componentInstance.onDeleteAttachment('a1', 'foto.png');

    expect(attachmentsStoreFake.delete).toHaveBeenCalledWith('a1');
  });

  it('não exclui o anexo quando a confirmação for cancelada', async () => {
    confirmDialogServiceFake.confirm.and.returnValue(of(false));
    const fixture = TestBed.createComponent(TicketDetailComponent);
    await fixture.whenStable();

    fixture.componentInstance.onDeleteAttachment('a1', 'foto.png');

    expect(attachmentsStoreFake.delete).not.toHaveBeenCalled();
  });

  it('mostra a mensagem de erro do store quando o ticket não pode ser carregado (ex.: 403)', async () => {
    detailStoreFake.ticket.set(undefined);
    detailStoreFake.state.set({ loading: false, error: 'Você não tem acesso a este ticket.' });
    const fixture = TestBed.createComponent(TicketDetailComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Você não tem acesso a este ticket.');
  });

  it('mostra um aviso de não encontrado quando não há ticket nem erro', async () => {
    detailStoreFake.ticket.set(undefined);
    const fixture = TestBed.createComponent(TicketDetailComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Não encontramos esse ticket');
  });

  it('mostra um spinner — não o aviso de não encontrado — enquanto o ticket ainda está carregando', async () => {
    detailStoreFake.ticket.set(undefined);
    detailStoreFake.state.set({ loading: true, error: null });
    const fixture = TestBed.createComponent(TicketDetailComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.spinner-border')).not.toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Não encontramos esse ticket');
  });
});
