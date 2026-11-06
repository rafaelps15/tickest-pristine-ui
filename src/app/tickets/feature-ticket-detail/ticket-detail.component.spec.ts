import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { TicketDetailComponent } from './ticket-detail.component';
import { TicketDetailStore } from '../application/ticket-detail.store';
import { TicketAttachmentsStore } from '../application/ticket-attachments.store';
import { TicketHistoryStore } from '../application/ticket-history.store';
import { TicketMessagesStore } from '../application/ticket-messages.store';
import { TicketDetail } from '../entities/ticket';
import { TicketAttachment, TicketAttachmentPolicy } from '../entities/ticket-attachment';
import { TicketMessage } from '../entities/ticket-message';
import { TicketHistoryAction, TicketHistoryEntry } from '../entities/ticket-history';
import { TicketPriority } from '../entities/ticket-priority';
import { TicketStatus } from '../entities/ticket-status';
import { TicketSlaStatus } from '../entities/ticket-sla-status';
import { TicketSla, TicketSlaMetric, TicketSlaObjective, TicketSlaObjectiveState } from '../entities/ticket-sla';
import { ConfirmDialogService, SessionService, ToastService } from '../../shared';
import { TicketAssignee } from '../entities/ticket-assignee';
import { By } from '@angular/platform-browser';
import { TicketAssignDialogComponent } from '../../shared/ui/ticket-assign-dialog/ticket-assign-dialog.component';

/** Prazo do dono ainda aberto (o relógio dos testes nunca chega lá). */
const FAR_FUTURE = '2999-01-01T00:00:00Z';

/** Política de anexos como o back-end devolve (10 MB, PDF e PNG). */
const ATTACHMENT_POLICY: TicketAttachmentPolicy = {
  maxFileSizeBytes: 10_485_760, maxAttachmentsPerTicket: 20, maxTotalBytesPerTicket: 104_857_600,
  allowedTypes: [{ contentType: 'application/pdf', extensions: ['.pdf'] }, { contentType: 'image/png', extensions: ['.png'] }]
};

describe('TicketDetailComponent', () => {
  /** Objetivo de SLA "em branco", pra só sobrescrever os campos que cada cenário de teste precisa. */
  function makeObjective(overrides: Partial<TicketSlaObjective>): TicketSlaObjective {
    return {
      metric: TicketSlaMetric.Resolution, cycle: 1, state: TicketSlaObjectiveState.Running, targetMinutes: 480,
      startedAtUtc: '2026-01-01T12:00:00Z', warningAtUtc: '2026-01-02T10:00:00Z', dueAtUtc: '2026-01-02T12:00:00Z',
      completedAtUtc: null, stoppedAtUtc: null, consumedMinutes: 30, remainingMinutes: 450, isCurrentCycle: true,
      ...overrides
    };
  }

  const sla: TicketSla = {
    serverNowUtc: '2026-01-01T13:00:00Z',
    plan: { policyId: 'p1', policyName: 'Padrão', policyVersion: 1, calendarId: 'c1', calendarName: 'Expediente', isLegacy: false },
    objectives: [
      makeObjective({ metric: TicketSlaMetric.FirstResponse, targetMinutes: 60, dueAtUtc: '2026-01-01T13:00:00Z', consumedMinutes: 30, remainingMinutes: 30 }),
      makeObjective({ metric: TicketSlaMetric.Resolution })
    ]
  };

  const ticket: TicketDetail = {
    id: 't1', title: 'Impressora não funciona', description: 'A impressora do 3º andar não imprime.',
    priority: TicketPriority.Medium, status: TicketStatus.Open,
    openedByUserId: 'u1', openedByName: 'Maria Souza', canCancel: true, ownerCancelDeadlineUtc: FAR_FUTURE, assignedToUserId: null, assignedToName: null,
    sectorId: 's1', sectorName: 'Suporte',
    createdAtUtc: '2026-01-01T12:00:00Z', dueAtUtc: '2026-01-02T12:00:00Z', slaWarningAtUtc: '2026-01-02T06:00:00Z',
    resolvedAtUtc: null, slaStatus: TicketSlaStatus.OnTime, sla
  };
  const attachment: TicketAttachment = {
    id: 'a1', ticketId: 't1', uploadedByUserId: 'u1',
    fileName: 'foto.png', contentType: 'image/png', fileSizeBytes: 1024,
    uploadedAtUtc: '2026-01-01T12:00:00Z'
  };
  const historyEntry: TicketHistoryEntry = {
    id: 'h1', ticketId: 't1', changedByUserId: 'u1',
    action: TicketHistoryAction.Created, description: 'Chamado criado',
    oldValue: null, newValue: null, occurredAtUtc: '2026-01-01T12:00:00Z'
  };
  const message: TicketMessage = {
    id: 'm1', ticketId: 't1', authorUserId: 'u1', content: 'Já verifiquei, aguardando peça.',
    createdAtUtc: '2026-01-01T12:00:00Z', editedAtUtc: null
  };
  const candidate: TicketAssignee = { id: 'u2', fullName: 'João Pedro', sectorId: 's1', sectorName: 'Suporte' };

  /** Cria um store de detalhe falso com signals reais. */
  function createDetailStoreFake() {
    return {
      ticket: signal<TicketDetail | undefined>(ticket),
      state: signal({ loading: false, error: null as string | null }),
      mutationError: signal<string | null>(null),
      removingAssignee: signal(false),
      assigningTicket: signal(false),
      updatingStatus: signal(false),
      updatingDescription: signal(false),
      reopening: signal(false),
      sla: signal<TicketSla | null>(sla),
      slaError: signal<string | null>(null),
      refreshSla: jasmine.createSpy('refreshSla'),
      assigneeCandidates: signal<TicketAssignee[]>([]),
      searchingAssignees: signal(false),
      assigneeSearchError: signal<string | null>(null),
      loadTicket: jasmine.createSpy('loadTicket'),
      removeAssignee: jasmine.createSpy('removeAssignee'),
      assignTicket: jasmine.createSpy('assignTicket'),
      updateStatus: jasmine.createSpy('updateStatus'),
      updateDescription: jasmine.createSpy('updateDescription'),
      reopen: jasmine.createSpy('reopen'),
      searchAssignees: jasmine.createSpy('searchAssignees'),
      clearAssigneeSearch: jasmine.createSpy('clearAssigneeSearch'),
      clearMutationError: jasmine.createSpy('clearMutationError')
    };
  }

  function createHistoryStoreFake() {
    return {
      entries: signal<TicketHistoryEntry[]>([historyEntry]),
      state: signal({ loading: false, error: null as string | null }),
      hasMore: signal(false),
      loadingMore: signal(false),
      loadMoreError: signal<string | null>(null),
      loadForTicket: jasmine.createSpy('loadForTicket'),
      reload: jasmine.createSpy('reload'),
      loadMore: jasmine.createSpy('loadMore')
    };
  }

  function createAttachmentsStoreFake() {
    return {
      attachments: signal<TicketAttachment[]>([attachment]),
      policy: signal<TicketAttachmentPolicy | null>(ATTACHMENT_POLICY),
      hasMore: signal(false),
      loadingMore: signal(false),
      loadMoreError: signal<string | null>(null),
      loadMore: jasmine.createSpy('loadMore'),
      listState: signal({ loading: false, error: null as string | null }),
      mutationError: signal<string | null>(null),
      uploading: signal(false),
      uploadError: signal<string | null>(null),
      validationError: signal<string | null>(null),
      downloading: signal(false),
      downloadError: signal<string | null>(null),
      deleting: signal(false),
      loadForTicket: jasmine.createSpy('loadForTicket'),
      upload: jasmine.createSpy('upload'),
      uploadIfValid: jasmine.createSpy('uploadIfValid'),
      download: jasmine.createSpy('download'),
      delete: jasmine.createSpy('delete')
    };
  }

  function createMessagesStoreFake() {
    return {
      messages: signal<TicketMessage[]>([message]),
      listState: signal({ loading: false, error: null as string | null }),
      hasMore: signal(false),
      loadingMore: signal(false),
      loadMoreError: signal<string | null>(null),
      posting: signal(false),
      postError: signal<string | null>(null),
      savingEdit: signal(false),
      mutationError: signal<string | null>(null),
      deletingMessageId: signal<string | null>(null),
      loadForTicket: jasmine.createSpy('loadForTicket'),
      loadMore: jasmine.createSpy('loadMore'),
      post: jasmine.createSpy('post'),
      editMessage: jasmine.createSpy('editMessage'),
      deleteMessage: jasmine.createSpy('deleteMessage'),
      clearMutationError: jasmine.createSpy('clearMutationError')
    };
  }

  let detailStoreFake: ReturnType<typeof createDetailStoreFake>;
  let attachmentsStoreFake: ReturnType<typeof createAttachmentsStoreFake>;
  let historyStoreFake: ReturnType<typeof createHistoryStoreFake>;
  let messagesStoreFake: ReturnType<typeof createMessagesStoreFake>;
  let confirmDialogServiceFake: { confirm: jasmine.Spy };
  let sessionServiceFake: { hasPermission: jasmine.Spy; userId: ReturnType<typeof signal<string | null>> };
  let toastServiceFake: { show: jasmine.Spy };

  beforeEach(async () => {
    detailStoreFake = createDetailStoreFake();
    attachmentsStoreFake = createAttachmentsStoreFake();
    historyStoreFake = createHistoryStoreFake();
    messagesStoreFake = createMessagesStoreFake();
    confirmDialogServiceFake = { confirm: jasmine.createSpy('confirm').and.returnValue(of(true)) };
    sessionServiceFake = { hasPermission: jasmine.createSpy('hasPermission').and.returnValue(true), userId: signal<string | null>('viewer-1') };
    toastServiceFake = { show: jasmine.createSpy('show') };

    await TestBed.configureTestingModule({
      imports: [TicketDetailComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: TicketDetailStore, useValue: detailStoreFake },
        { provide: TicketAttachmentsStore, useValue: attachmentsStoreFake },
        { provide: TicketHistoryStore, useValue: historyStoreFake },
        { provide: TicketMessagesStore, useValue: messagesStoreFake },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: 't1' }), queryParamMap: convertToParamMap({}) } }
        },
        { provide: ConfirmDialogService, useValue: confirmDialogServiceFake },
        { provide: SessionService, useValue: sessionServiceFake },
        { provide: ToastService, useValue: toastServiceFake }
      ]
    }).compileComponents();
  });

  it('loads the ticket by the route id, the history and the attachments on init', async () => {
    const fixture = TestBed.createComponent(TicketDetailComponent);
    await fixture.whenStable();

    expect(detailStoreFake.loadTicket).toHaveBeenCalledWith('t1');
    expect(historyStoreFake.loadForTicket).toHaveBeenCalledWith('t1');
    expect(attachmentsStoreFake.loadForTicket).toHaveBeenCalledWith('t1');
    expect(fixture.nativeElement.textContent).toContain('Impressora não funciona');
  });

  it('shows "Meus Chamados" in the breadcrumb and goes back to /chamados by default, without ?from in the URL', async () => {
    const fixture = TestBed.createComponent(TicketDetailComponent);
    await fixture.whenStable();

    const crumbs = fixture.nativeElement.querySelector('nav[aria-label="Trilha"]') as HTMLElement;
    expect(Array.from(crumbs.querySelectorAll('li')).map(li => li.textContent?.trim())).toEqual(['Início', 'Meus Chamados']);
    expect(crumbs.querySelectorAll('a')[1]?.getAttribute('href')).toBe('/tickets');
    const backLink = fixture.nativeElement.querySelector('a.btn-outline-secondary') as HTMLAnchorElement;
    expect(backLink.getAttribute('href')).toBe('/tickets');
  });

  it('shows "Administração / Monitorar Chamados" in the breadcrumb and goes back to /chamados/monitorar when arriving with ?from=monitor', async () => {
    TestBed.overrideProvider(ActivatedRoute, {
      useValue: {
        snapshot: { paramMap: convertToParamMap({ id: 't1' }), queryParamMap: convertToParamMap({ from: 'monitor' }) }
      }
    });
    const fixture = TestBed.createComponent(TicketDetailComponent);
    await fixture.whenStable();

    const crumbs = fixture.nativeElement.querySelector('nav[aria-label="Trilha"]') as HTMLElement;
    expect(crumbs.textContent?.replace(/\s+/g, ' ').trim()).toBe('Administração Monitorar Chamados');
    expect(crumbs.querySelector('a')?.getAttribute('href')).toBe('/tickets/monitorar');
    const backLink = fixture.nativeElement.querySelector('a.btn-outline-secondary') as HTMLAnchorElement;
    expect(backLink.getAttribute('href')).toBe('/tickets/monitorar');
  });

  it('shows the SLA status with text, not only with color', async () => {
    detailStoreFake.ticket.set({ ...ticket, slaStatus: TicketSlaStatus.Breached });
    const fixture = TestBed.createComponent(TicketDetailComponent);
    await fixture.whenStable();

    const badge = Array.from(fixture.nativeElement.querySelectorAll('.badge') as NodeListOf<HTMLElement>)
      .find(b => b.textContent?.includes('SLA'));
    expect(badge?.textContent?.trim()).toBe('SLA: Atrasado');
    expect(badge?.classList).toContain('bg-label-danger');
  });

  it('shows the relative urgency of the due date and highlights in red when the SLA is breached', async () => {
    const overdueBy3Hours = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    detailStoreFake.ticket.set({ ...ticket, dueAtUtc: overdueBy3Hours, slaStatus: TicketSlaStatus.Breached, resolvedAtUtc: null });
    detailStoreFake.sla.set(null); // linha "Prazo" do resumo só aparece sem o painel de SLA
    const fixture = TestBed.createComponent(TicketDetailComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Atrasado há 3 horas');
    const prazoDd = fixture.nativeElement.querySelector('dd.text-danger');
    expect(prazoDd).withContext('a linha de Prazo deve ficar vermelha quando o SLA está violado').toBeTruthy();
  });

  it('shows "vence em" and highlights in yellow when the SLA is at risk, with no highlight when it is on time', async () => {
    const dueIn40Minutes = new Date(Date.now() + 40 * 60 * 1000).toISOString();
    detailStoreFake.ticket.set({ ...ticket, dueAtUtc: dueIn40Minutes, slaStatus: TicketSlaStatus.AtRisk, resolvedAtUtc: null });
    detailStoreFake.sla.set(null);
    const fixture = TestBed.createComponent(TicketDetailComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Vence em 40 minutos');
    expect(fixture.nativeElement.querySelector('dd.text-warning')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('dd.text-danger')).toBeFalsy();
  });

  it('does not show due date urgency for an already resolved ticket', async () => {
    detailStoreFake.ticket.set({ ...ticket, resolvedAtUtc: '2026-01-02T10:00:00Z', slaStatus: TicketSlaStatus.Met });
    detailStoreFake.sla.set(null);
    const fixture = TestBed.createComponent(TicketDetailComponent);
    await fixture.whenStable();

    // Escopado na linha "Prazo" do resumo do chamado — o painel de SLA abaixo tem sua própria
    // urgência relativa por objetivo, independente deste campo (ver describe('painel de SLA')).
    const prazoText = fixture.nativeElement.querySelector('dl.max-w-700')?.textContent;
    expect(prazoText).not.toContain('Vence em');
    expect(prazoText).not.toContain('Atrasado há');
  });

  it('shows "Resolvido em" when the ticket has a resolution date', async () => {
    detailStoreFake.ticket.set({ ...ticket, status: TicketStatus.Resolved, resolvedAtUtc: '2026-01-02T10:00:00Z' });
    const fixture = TestBed.createComponent(TicketDetailComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Resolvido em');
  });

  it('does not show "Resolvido em" when the ticket has not been resolved yet', async () => {
    const fixture = TestBed.createComponent(TicketDetailComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).not.toContain('Resolvido em');
  });

  it('shows who opened it, the sector and the assignee (or that it has not been assigned yet)', async () => {
    const fixture = TestBed.createComponent(TicketDetailComponent);
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Maria Souza');
    expect(text).toContain('Suporte');
    expect(text).toContain('Ainda não atribuído');
  });

  it('shows the load-more-attachments button only when there are more pages, and loads on click', async () => {
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

  it('renders the loaded attachments', async () => {
    const fixture = TestBed.createComponent(TicketDetailComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('foto.png');
    expect(fixture.nativeElement.textContent).toContain('1 KB');
  });

  it('the "Anexar arquivo" button is a real <button> (keyboard reachable) that opens the hidden file picker', async () => {
    const fixture = TestBed.createComponent(TicketDetailComponent);
    await fixture.whenStable();

    const uploadButton = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
      .find(b => b.textContent?.includes('Anexar arquivo'));
    expect(uploadButton).withContext('o botão de upload deve ser um <button>, não um <label>').toBeTruthy();

    const fileInput = fixture.nativeElement.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = spyOn(fileInput, 'click');
    uploadButton?.click();

    expect(clickSpy).toHaveBeenCalled();
  });

  it('the download/delete attachment buttons have an aria-label (they are icon-only)', async () => {
    const fixture = TestBed.createComponent(TicketDetailComponent);
    await fixture.whenStable();

    const downloadButton = fixture.nativeElement.querySelector('button[aria-label^="Baixar"]');
    const deleteButton = fixture.nativeElement.querySelector('button[aria-label="Excluir foto.png"]');
    expect(downloadButton?.getAttribute('aria-label')).toBe('Baixar foto.png');
    expect(deleteButton).toBeTruthy();
  });

  it('downloads through the store by the attachment id and saves the received file with the attachment name', async () => {
    const fixture = TestBed.createComponent(TicketDetailComponent);
    await fixture.whenStable();

    (fixture.nativeElement.querySelector('button[aria-label="Baixar foto.png"]') as HTMLButtonElement).click();

    expect(attachmentsStoreFake.download).toHaveBeenCalledOnceWith('a1', jasmine.any(Function));
    const onDownloaded = attachmentsStoreFake.download.calls.mostRecent().args[1] as (file: Blob) => void;
    const file = new Blob(['x'], { type: 'image/png' });
    spyOn(URL, 'createObjectURL').and.returnValue('blob:fake-url');
    const link = document.createElement('a');
    spyOn(link, 'click');
    spyOn(document, 'createElement').and.returnValue(link);

    // Relógio falso: a revogação da URL, adiada pelo utilitário, não fica pendente depois do teste.
    jasmine.clock().install();
    try {
      onDownloaded(file);
    } finally {
      jasmine.clock().uninstall();
    }

    expect(URL.createObjectURL).toHaveBeenCalledOnceWith(file);
    expect(link.download).toBe('foto.png');
    expect(link.click).toHaveBeenCalled();
  });

  it('hands the chosen file to the store, which checks the policy before uploading', async () => {
    const fixture = TestBed.createComponent(TicketDetailComponent);
    await fixture.whenStable();

    const file = new File(['x'], 'foto.png', { type: 'image/png' });
    const input = document.createElement('input');
    Object.defineProperty(input, 'files', { value: [file] });

    fixture.componentInstance.onFileSelected({ target: input } as unknown as Event);

    expect(attachmentsStoreFake.uploadIfValid).toHaveBeenCalledWith(file, jasmine.any(Function));
    expect(attachmentsStoreFake.upload).not.toHaveBeenCalled();
  });

  it('does not call the store when no file was chosen', async () => {
    const fixture = TestBed.createComponent(TicketDetailComponent);
    await fixture.whenStable();

    const input = document.createElement('input');
    Object.defineProperty(input, 'files', { value: [] });
    fixture.componentInstance.onFileSelected({ target: input } as unknown as Event);

    expect(attachmentsStoreFake.uploadIfValid).not.toHaveBeenCalled();
  });

  it('shows the policy rejection reason in an alert', async () => {
    attachmentsStoreFake.validationError.set('O arquivo excede o tamanho máximo permitido de 2.0 MB.');
    const fixture = TestBed.createComponent(TicketDetailComponent);
    await fixture.whenStable();

    const alerts = Array.from(fixture.nativeElement.querySelectorAll('[role="alert"]') as NodeListOf<HTMLElement>);
    expect(alerts.some(alert => alert.textContent?.includes('tamanho máximo permitido de 2.0 MB'))).toBeTrue();
  });

  it('prefers the rejection reason over the previous upload error, in a single alert', async () => {
    attachmentsStoreFake.validationError.set('O tipo de arquivo "application/x-msdownload" não é suportado.');
    attachmentsStoreFake.uploadError.set('Erro ao enviar o anexo.');
    const fixture = TestBed.createComponent(TicketDetailComponent);
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('não é suportado');
    expect(text).not.toContain('Erro ao enviar o anexo.');
  });

  it('shows the failure of an attachment deletion in an alert of its own, without "Tentar novamente"', async () => {
    attachmentsStoreFake.mutationError.set('Você não tem permissão para excluir este anexo.');
    const fixture = TestBed.createComponent(TicketDetailComponent);
    await fixture.whenStable();

    const alerts = Array.from(fixture.nativeElement.querySelectorAll('[role="alert"]') as NodeListOf<HTMLElement>);
    const deletionAlert = alerts.find(alert => alert.textContent?.includes('Você não tem permissão para excluir este anexo.'));
    expect(deletionAlert).toBeTruthy();
    expect(deletionAlert?.querySelector('button')).toBeNull();
    expect(Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
      .some(button => button.textContent?.includes('Tentar novamente'))).toBeFalse();
  });

  it('shows the failure of "Carregar mais anexos" below the button', async () => {
    attachmentsStoreFake.hasMore.set(true);
    attachmentsStoreFake.loadMoreError.set('Erro ao carregar mais anexos');
    const fixture = TestBed.createComponent(TicketDetailComponent);
    await fixture.whenStable();

    const loadMoreButton = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
      .find(button => button.textContent?.includes('Carregar mais anexos'));
    const alert = Array.from(fixture.nativeElement.querySelectorAll('[role="alert"]') as NodeListOf<HTMLElement>)
      .find(element => element.textContent?.includes('Erro ao carregar mais anexos'));
    expect(loadMoreButton).toBeTruthy();
    expect(alert).toBeTruthy();
    expect(loadMoreButton!.compareDocumentPosition(alert!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('shows a success toast when the attachment is uploaded', async () => {
    attachmentsStoreFake.uploadIfValid.and.callFake((_file: File, onSuccess?: () => void) => onSuccess?.());
    const fixture = TestBed.createComponent(TicketDetailComponent);
    await fixture.whenStable();

    const file = new File(['x'], 'foto.png', { type: 'image/png' });
    const input = document.createElement('input');
    Object.defineProperty(input, 'files', { value: [file] });
    fixture.componentInstance.onFileSelected({ target: input } as unknown as Event);

    expect(toastServiceFake.show).toHaveBeenCalledWith('Anexo enviado.');
  });

  it('deletes the attachment when confirmed', async () => {
    confirmDialogServiceFake.confirm.and.returnValue(of(true));
    const fixture = TestBed.createComponent(TicketDetailComponent);
    await fixture.whenStable();

    fixture.componentInstance.onDeleteAttachment('a1', 'foto.png');

    expect(attachmentsStoreFake.delete).toHaveBeenCalledWith('a1', jasmine.any(Function));
  });

  it('shows a success toast when the attachment is deleted', async () => {
    confirmDialogServiceFake.confirm.and.returnValue(of(true));
    attachmentsStoreFake.delete.and.callFake((_id: string, onSuccess?: () => void) => onSuccess?.());
    const fixture = TestBed.createComponent(TicketDetailComponent);
    await fixture.whenStable();

    fixture.componentInstance.onDeleteAttachment('a1', 'foto.png');

    expect(toastServiceFake.show).toHaveBeenCalledWith('Anexo excluído.');
  });

  it('does not delete the attachment when the confirmation is cancelled', async () => {
    confirmDialogServiceFake.confirm.and.returnValue(of(false));
    const fixture = TestBed.createComponent(TicketDetailComponent);
    await fixture.whenStable();

    fixture.componentInstance.onDeleteAttachment('a1', 'foto.png');

    expect(attachmentsStoreFake.delete).not.toHaveBeenCalled();
  });

  it('shows the store error message when the ticket cannot be loaded (e.g. 403)', async () => {
    detailStoreFake.ticket.set(undefined);
    detailStoreFake.state.set({ loading: false, error: 'Você não tem acesso a este chamado.' });
    const fixture = TestBed.createComponent(TicketDetailComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Você não tem acesso a este chamado.');
  });

  it('shows a not-found notice when there is neither a ticket nor an error', async () => {
    detailStoreFake.ticket.set(undefined);
    const fixture = TestBed.createComponent(TicketDetailComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Não encontramos esse chamado');
  });

  it('does not show SLA, messages, attachments or history when the ticket does not exist, only the notice and the way back', async () => {
    detailStoreFake.ticket.set(undefined);
    const fixture = TestBed.createComponent(TicketDetailComponent);
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent;
    expect(text).not.toContain('Mensagens');
    expect(text).not.toContain('Anexar arquivo');
    expect(text).not.toContain('Histórico');
    const back = fixture.nativeElement.querySelector('.alert a') as HTMLAnchorElement;
    expect(back.getAttribute('href')).toBe('/tickets');
  });

  it('reloads the ticket when clicking "Tentar novamente" on failure, but does not show the button when it is only "não encontrado"', async () => {
    detailStoreFake.ticket.set(undefined);
    detailStoreFake.state.set({ loading: false, error: 'Você não tem acesso a este chamado.' });
    const fixture = TestBed.createComponent(TicketDetailComponent);
    await fixture.whenStable();

    const retryButton = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
      .find(b => b.textContent?.includes('Tentar novamente'));
    retryButton?.click();
    expect(detailStoreFake.loadTicket).toHaveBeenCalledWith('t1');

    detailStoreFake.state.set({ loading: false, error: null });
    fixture.detectChanges();
    expect(Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
      .some(b => b.textContent?.includes('Tentar novamente'))).toBeFalse();
  });

  it('reloads the attachments and the history when clicking "Tentar novamente" on the respective errors', async () => {
    attachmentsStoreFake.listState.set({ loading: false, error: 'Erro ao carregar anexos' });
    historyStoreFake.state.set({ loading: false, error: 'Erro ao carregar histórico' });
    const fixture = TestBed.createComponent(TicketDetailComponent);
    await fixture.whenStable();

    const retryButtons = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
      .filter(b => b.textContent?.includes('Tentar novamente'));
    expect(retryButtons.length).toBe(2);
    retryButtons.forEach(b => b.click());

    expect(attachmentsStoreFake.loadForTicket).toHaveBeenCalledWith('t1');
    expect(historyStoreFake.loadForTicket).toHaveBeenCalledWith('t1');
  });

  it('shows a spinner, not the not-found notice, while the ticket is still loading', async () => {
    detailStoreFake.ticket.set(undefined);
    detailStoreFake.state.set({ loading: true, error: null });
    const fixture = TestBed.createComponent(TicketDetailComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.spinner-border')).not.toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Não encontramos esse chamado');
  });

  describe('remove assignee', () => {
    function findRemoveButton(fixture: ReturnType<typeof TestBed.createComponent<TicketDetailComponent>>): HTMLButtonElement | undefined {
      return Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
        .find(b => b.textContent?.includes('Remover responsável'));
    }

    it('shows the button when the user has permission, the ticket is active and has an assignee', async () => {
      detailStoreFake.ticket.set({ ...ticket, status: TicketStatus.InProgress, assignedToName: 'João Pedro' });
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(findRemoveButton(fixture)).not.toBeUndefined();
    });

    it('does not show the button without the tickets:manage permission', async () => {
      sessionServiceFake.hasPermission.and.returnValue(false);
      detailStoreFake.ticket.set({ ...ticket, status: TicketStatus.InProgress, assignedToName: 'João Pedro' });
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(findRemoveButton(fixture)).toBeUndefined();
    });

    it('does not show the button when the ticket is not active (Resolvido)', async () => {
      detailStoreFake.ticket.set({ ...ticket, status: TicketStatus.Resolved, assignedToName: 'João Pedro' });
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(findRemoveButton(fixture)).toBeUndefined();
    });

    it('does not show the button when there is no assigned assignee', async () => {
      detailStoreFake.ticket.set({ ...ticket, status: TicketStatus.Open, assignedToName: null });
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(findRemoveButton(fixture)).toBeUndefined();
    });

    it('asks for confirmation and removes the assignee, reloading the history on success', async () => {
      detailStoreFake.ticket.set({ ...ticket, status: TicketStatus.Open, assignedToName: 'João Pedro' });
      confirmDialogServiceFake.confirm.and.returnValue(of(true));
      detailStoreFake.removeAssignee.and.callFake((_id: string, onSuccess?: () => void) => onSuccess?.());
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      findRemoveButton(fixture)!.click();

      expect(confirmDialogServiceFake.confirm).toHaveBeenCalled();
      expect(detailStoreFake.removeAssignee).toHaveBeenCalledWith('t1', jasmine.any(Function));
      expect(historyStoreFake.reload).toHaveBeenCalled();
      expect(toastServiceFake.show).toHaveBeenCalledWith('Responsável removido.');
    });

    it('does not remove the assignee when the confirmation is cancelled', async () => {
      detailStoreFake.ticket.set({ ...ticket, status: TicketStatus.Open, assignedToName: 'João Pedro' });
      confirmDialogServiceFake.confirm.and.returnValue(of(false));
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      findRemoveButton(fixture)!.click();

      expect(detailStoreFake.removeAssignee).not.toHaveBeenCalled();
    });

    it('shows the mutation error message when the removal fails', async () => {
      detailStoreFake.ticket.set({ ...ticket, status: TicketStatus.Open, assignedToName: 'João Pedro' });
      detailStoreFake.mutationError.set('O chamado não está ativo.');
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(fixture.nativeElement.textContent).toContain('O chamado não está ativo.');
    });
  });

  describe('assign assignee', () => {
    function findAssignButton(fixture: ReturnType<typeof TestBed.createComponent<TicketDetailComponent>>): HTMLButtonElement | undefined {
      return Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
        .find(b => b.textContent?.includes('Atribuir responsável') || b.textContent?.includes('Alterar responsável'));
    }

    it('does not show "Atribuir responsável" to someone with tickets:manage but without tickets:assign', async () => {
      sessionServiceFake.hasPermission.and.callFake((code: string) => code === 'tickets:manage');
      detailStoreFake.ticket.set({ ...ticket, status: TicketStatus.Open, assignedToName: null });
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(findAssignButton(fixture)).toBeFalsy();
    });

    /** Botão "Atribuir a mim", ou undefined quando não aparece. */
    function findAssignToMeButton(fixture: ReturnType<typeof TestBed.createComponent<TicketDetailComponent>>): HTMLButtonElement | undefined {
      return Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
        .find(b => b.textContent?.includes('Atribuir a mim'));
    }

    it('the seed Atendente (tickets:manage without tickets:assign) sees "Atribuir a mim" and takes the ticket for themselves', async () => {
      sessionServiceFake.hasPermission.and.callFake((code: string) =>
        ['tickets:create', 'tickets:view-own', 'tickets:update-own', 'tickets:reopen-own', 'tickets:manage'].includes(code));
      detailStoreFake.ticket.set({ ...ticket, status: TicketStatus.Open, assignedToUserId: null, assignedToName: null });
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(findAssignButton(fixture)).toBeUndefined();
      findAssignToMeButton(fixture)!.click();
      expect(detailStoreFake.assignTicket).toHaveBeenCalledWith('t1', 'viewer-1', jasmine.any(Function));

      detailStoreFake.assignTicket.calls.mostRecent().args[2]();
      expect(toastServiceFake.show).toHaveBeenCalledWith('Chamado atribuído a você.');
      expect(historyStoreFake.reload).toHaveBeenCalled();
    });

    it('does not offer "Atribuir a mim" on a ticket that already has an assignee, on an inactive one, or without tickets:manage', async () => {
      detailStoreFake.ticket.set({ ...ticket, status: TicketStatus.InProgress, assignedToUserId: 'u2', assignedToName: 'Maria Souza' });
      const assigned = TestBed.createComponent(TicketDetailComponent);
      await assigned.whenStable();
      expect(findAssignToMeButton(assigned)).toBeUndefined();

      detailStoreFake.ticket.set({ ...ticket, status: TicketStatus.Resolved, assignedToUserId: null, assignedToName: null });
      const resolved = TestBed.createComponent(TicketDetailComponent);
      await resolved.whenStable();
      expect(findAssignToMeButton(resolved)).toBeUndefined();

      sessionServiceFake.hasPermission.and.callFake((code: string) => code !== 'tickets:manage');
      detailStoreFake.ticket.set({ ...ticket, status: TicketStatus.Open, assignedToUserId: null, assignedToName: null });
      const withoutManage = TestBed.createComponent(TicketDetailComponent);
      await withoutManage.whenStable();
      expect(findAssignToMeButton(withoutManage)).toBeUndefined();
    });

    it('shows "Atribuir responsável" when the ticket is active and has no assignee', async () => {
      detailStoreFake.ticket.set({ ...ticket, status: TicketStatus.Open, assignedToName: null });
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(findAssignButton(fixture)?.textContent).toContain('Atribuir responsável');
    });

    it('shows "Alterar responsável" when the ticket already has an assignee', async () => {
      detailStoreFake.ticket.set({ ...ticket, status: TicketStatus.InProgress, assignedToName: 'Maria Souza' });
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(findAssignButton(fixture)?.textContent).toContain('Alterar responsável');
    });

    it('does not show the button without the tickets:manage permission', async () => {
      sessionServiceFake.hasPermission.and.returnValue(false);
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(findAssignButton(fixture)).toBeUndefined();
    });

    it('does not show the button when the ticket is not active (Resolvido)', async () => {
      detailStoreFake.ticket.set({ ...ticket, status: TicketStatus.Resolved });
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(findAssignButton(fixture)).toBeUndefined();
    });

    /** Diálogo de atribuição renderizado (só existe enquanto aberto). */
    function assignDialog(fixture: ReturnType<typeof TestBed.createComponent<TicketDetailComponent>>): TicketAssignDialogComponent | undefined {
      return fixture.debugElement.query(By.directive(TicketAssignDialogComponent))?.componentInstance;
    }

    it('opens the dialog from the button, without inheriting the search or the error from a previous opening', async () => {
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();
      expect(assignDialog(fixture)).toBeUndefined();

      findAssignButton(fixture)!.click();
      await fixture.whenStable();

      expect(assignDialog(fixture)).toBeDefined();
      expect(detailStoreFake.clearMutationError).toHaveBeenCalled();
      expect(detailStoreFake.clearAssigneeSearch).toHaveBeenCalled();
    });

    it('passes the dialog the current assignee, the candidates and the mutation error, and wires the search to the store', async () => {
      detailStoreFake.ticket.set({ ...ticket, status: TicketStatus.Open, assignedToName: 'Maria Souza' });
      detailStoreFake.assigneeCandidates.set([candidate]);
      detailStoreFake.mutationError.set('O usuário não atende chamados e não pode ser o responsável.');
      const fixture = TestBed.createComponent(TicketDetailComponent);
      fixture.componentInstance.onOpenAssignModal();
      await fixture.whenStable();

      const dialog = assignDialog(fixture)!;
      expect(dialog.currentName()).toBe('Maria Souza');
      expect(dialog.candidates()).toEqual([candidate]);
      expect(fixture.nativeElement.textContent).toContain('O usuário não atende chamados e não pode ser o responsável.');

      dialog.searchRequested.emit('joão');
      expect(detailStoreFake.searchAssignees).toHaveBeenCalledWith('joão');
    });

    it('assigns the confirmed candidate, reloads the history, notifies and closes the dialog', async () => {
      detailStoreFake.assignTicket.and.callFake((_id: string, _userId: string, onSuccess?: () => void) => onSuccess?.());
      const fixture = TestBed.createComponent(TicketDetailComponent);
      fixture.componentInstance.onOpenAssignModal();
      await fixture.whenStable();

      assignDialog(fixture)!.confirm.emit({ userId: 'u2', name: 'João Pedro' });
      await fixture.whenStable();

      expect(detailStoreFake.assignTicket).toHaveBeenCalledWith('t1', 'u2', jasmine.any(Function));
      expect(historyStoreFake.reload).toHaveBeenCalled();
      expect(toastServiceFake.show).toHaveBeenCalledWith('João Pedro agora é o responsável.');
      expect(assignDialog(fixture)).toBeUndefined();
    });
  });

  describe('change status', () => {
    function findButton(fixture: ReturnType<typeof TestBed.createComponent<TicketDetailComponent>>, text: string): HTMLButtonElement | undefined {
      return Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
        .find(b => b.textContent?.includes(text));
    }

    it('with a Resolvido ticket, only "Fechar chamado" is primary and "Reabrir" stays secondary', async () => {
      detailStoreFake.ticket.set({ ...ticket, status: TicketStatus.Resolved });
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      const buttons = Array.from(fixture.nativeElement.querySelectorAll('.ticket-actions button') as NodeListOf<HTMLButtonElement>);
      const primaries = buttons.filter(b => b.classList.contains('btn-primary')).map(b => b.textContent?.trim());
      expect(primaries).toEqual(['Fechar chamado']);
      expect(buttons.find(b => b.textContent?.includes('Reabrir'))?.classList).toContain('btn-outline-primary');
    });

    it('shows the valid next statuses for an Aberto ticket', async () => {
      detailStoreFake.ticket.set({ ...ticket, status: TicketStatus.Open });
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(findButton(fixture, 'Iniciar atendimento')).toBeTruthy();
      expect(findButton(fixture, 'Cancelar chamado')).toBeTruthy();
      expect(findButton(fixture, 'Marcar como resolvido')).toBeFalsy();
    });

    it('shows the spinner only on the clicked status button, and disables the others', async () => {
      detailStoreFake.ticket.set({ ...ticket, status: TicketStatus.Open });
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      findButton(fixture, 'Iniciar atendimento')!.click();
      detailStoreFake.updatingStatus.set(true);
      await fixture.whenStable();

      const startButton = findButton(fixture, 'Iniciar atendimento')!;
      const cancelButton = findButton(fixture, 'Cancelar chamado')!;
      expect(startButton.querySelector('.spinner-border')).not.toBeNull();
      expect(cancelButton.querySelector('.spinner-border')).toBeNull();
      expect(cancelButton.disabled).toBeTrue();
    });

    it('shows only "Fechar chamado" for a Resolvido ticket', async () => {
      detailStoreFake.ticket.set({ ...ticket, status: TicketStatus.Resolved });
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(findButton(fixture, 'Fechar chamado')).toBeTruthy();
      expect(findButton(fixture, 'Cancelar chamado')).toBeFalsy();
    });

    it('does not show any transition button without the tickets:manage permission', async () => {
      sessionServiceFake.hasPermission.and.returnValue(false);
      // Quem não é dono nem tem tickets:cancel recebe canCancel = false do back-end.
      detailStoreFake.ticket.set({ ...ticket, status: TicketStatus.Open, canCancel: false });
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(findButton(fixture, 'Iniciar atendimento')).toBeFalsy();
      expect(findButton(fixture, 'Cancelar chamado')).toBeFalsy();
    });

    it('does not show any transition button for a Fechado (terminal) ticket', async () => {
      detailStoreFake.ticket.set({ ...ticket, status: TicketStatus.Closed });
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(findButton(fixture, 'Iniciar atendimento')).toBeFalsy();
      expect(findButton(fixture, 'Marcar como resolvido')).toBeFalsy();
      expect(findButton(fixture, 'Fechar chamado')).toBeFalsy();
    });

    it('changes the status without confirmation for a routine transition (Iniciar atendimento)', async () => {
      detailStoreFake.ticket.set({ ...ticket, status: TicketStatus.Open });
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      findButton(fixture, 'Iniciar atendimento')!.click();

      expect(confirmDialogServiceFake.confirm).not.toHaveBeenCalled();
      expect(detailStoreFake.updateStatus).toHaveBeenCalledWith('t1', TicketStatus.InProgress, jasmine.any(Function));
    });

    it('changes the status without confirmation for "Marcar como resolvido"', async () => {
      detailStoreFake.ticket.set({ ...ticket, status: TicketStatus.InProgress });
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      findButton(fixture, 'Marcar como resolvido')!.click();

      expect(confirmDialogServiceFake.confirm).not.toHaveBeenCalled();
      expect(detailStoreFake.updateStatus).toHaveBeenCalledWith('t1', TicketStatus.Resolved, jasmine.any(Function));
    });

    it('asks the store to close a Resolvido ticket with "Fechar chamado", without confirmation', async () => {
      detailStoreFake.ticket.set({ ...ticket, status: TicketStatus.Resolved });
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      findButton(fixture, 'Fechar chamado')!.click();

      expect(confirmDialogServiceFake.confirm).not.toHaveBeenCalled();
      expect(detailStoreFake.updateStatus).toHaveBeenCalledWith('t1', TicketStatus.Closed, jasmine.any(Function));
    });

    it('asks for confirmation before cancelling, and cancels when confirmed', async () => {
      detailStoreFake.ticket.set({ ...ticket, status: TicketStatus.Open });
      confirmDialogServiceFake.confirm.and.returnValue(of(true));
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      findButton(fixture, 'Cancelar chamado')!.click();

      expect(confirmDialogServiceFake.confirm).toHaveBeenCalled();
      expect(detailStoreFake.updateStatus).toHaveBeenCalledWith('t1', TicketStatus.Canceled, jasmine.any(Function));
    });

    it('does not cancel when the confirmation is denied', async () => {
      detailStoreFake.ticket.set({ ...ticket, status: TicketStatus.Open });
      confirmDialogServiceFake.confirm.and.returnValue(of(false));
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      findButton(fixture, 'Cancelar chamado')!.click();

      expect(detailStoreFake.updateStatus).not.toHaveBeenCalled();
    });

    it('shows a toast and reloads the history when the status change succeeds', async () => {
      detailStoreFake.ticket.set({ ...ticket, status: TicketStatus.InProgress });
      detailStoreFake.updateStatus.and.callFake((_id: string, _status: TicketStatus, onSuccess?: () => void) => onSuccess?.());
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      findButton(fixture, 'Marcar como resolvido')!.click();

      expect(toastServiceFake.show).toHaveBeenCalledWith('Chamado marcado como resolvido.');
      expect(historyStoreFake.reload).toHaveBeenCalled();
    });
  });

  describe('reopen', () => {
    function findReopenButton(fixture: ReturnType<typeof TestBed.createComponent<TicketDetailComponent>>): HTMLButtonElement | undefined {
      return Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
        .find(b => b.textContent?.includes('Reabrir chamado'));
    }

    it('shows the "Reabrir chamado" button for a Resolvido/Fechado/Cancelado ticket', async () => {
      detailStoreFake.ticket.set({ ...ticket, status: TicketStatus.Canceled });
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(findReopenButton(fixture)).toBeTruthy();
    });

    it('shows "Reabrir chamado" to the owner with tickets:reopen-own, without tickets:manage', async () => {
      sessionServiceFake.userId.set(ticket.openedByUserId);
      sessionServiceFake.hasPermission.and.callFake((code: string) => code === 'tickets:reopen-own');
      detailStoreFake.ticket.set({ ...ticket, status: TicketStatus.Resolved });
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(findReopenButton(fixture)).toBeTruthy();
    });

    it('does not show "Reabrir chamado" to someone who is neither the owner nor has tickets:manage (the API would respond 403)', async () => {
      sessionServiceFake.userId.set('outro-usuario');
      sessionServiceFake.hasPermission.and.callFake((code: string) => code === 'tickets:reopen-own');
      detailStoreFake.ticket.set({ ...ticket, status: TicketStatus.Resolved });
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(findReopenButton(fixture)).toBeFalsy();
    });

    it('does not show "Reabrir chamado" to the owner with tickets:manage but without tickets:reopen-own: the back end requires reopen-own from the owner', async () => {
      sessionServiceFake.userId.set(ticket.openedByUserId);
      sessionServiceFake.hasPermission.and.callFake((code: string) => code === 'tickets:manage');
      detailStoreFake.ticket.set({ ...ticket, status: TicketStatus.Resolved });
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(findReopenButton(fixture)).toBeFalsy();
    });

    it('shows "Reabrir chamado" to someone who is not the owner and has tickets:manage, even without tickets:reopen-own', async () => {
      sessionServiceFake.userId.set('outro-usuario');
      sessionServiceFake.hasPermission.and.callFake((code: string) => code === 'tickets:manage');
      detailStoreFake.ticket.set({ ...ticket, status: TicketStatus.Closed });
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(findReopenButton(fixture)).toBeTruthy();
    });

    it('does not show the "Reabrir chamado" button for an active ticket', async () => {
      detailStoreFake.ticket.set({ ...ticket, status: TicketStatus.Open });
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(findReopenButton(fixture)).toBeFalsy();
    });

    it('reopens the ticket, shows a toast and reloads the history on success', async () => {
      detailStoreFake.ticket.set({ ...ticket, status: TicketStatus.Resolved });
      detailStoreFake.reopen.and.callFake((_id: string, _reason: string | null, onSuccess?: () => void) => onSuccess?.());
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      findReopenButton(fixture)!.click();
      await fixture.whenStable();
      expect(fixture.nativeElement.querySelector('app-ticket-reopen-dialog')).not.toBeNull();

      (fixture.nativeElement.querySelector('app-ticket-reopen-dialog button[type="submit"]') as HTMLButtonElement).click();

      expect(detailStoreFake.reopen).toHaveBeenCalledWith('t1', null, jasmine.any(Function));
      expect(toastServiceFake.show).toHaveBeenCalledWith('Chamado reaberto.');
      expect(historyStoreFake.reload).toHaveBeenCalled();
      expect(messagesStoreFake.post).not.toHaveBeenCalled();
    });

    it('sends the reason in the reopen call itself and reloads the conversation, without posting the message separately', async () => {
      detailStoreFake.ticket.set({ ...ticket, status: TicketStatus.Resolved });
      detailStoreFake.reopen.and.callFake((_id: string, _reason: string | null, onSuccess?: () => void) => onSuccess?.());
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      findReopenButton(fixture)!.click();
      await fixture.whenStable();
      messagesStoreFake.loadForTicket.calls.reset();
      fixture.debugElement.componentInstance['onReopenConfirm']('A impressora parou de novo.');

      expect(detailStoreFake.reopen).toHaveBeenCalledWith('t1', 'A impressora parou de novo.', jasmine.any(Function));
      expect(messagesStoreFake.post).not.toHaveBeenCalled();
      expect(messagesStoreFake.loadForTicket).toHaveBeenCalledWith('t1');
    });
  });

  describe('edit description', () => {
    function findEditButton(fixture: ReturnType<typeof TestBed.createComponent<TicketDetailComponent>>): HTMLButtonElement | undefined {
      return fixture.nativeElement.querySelector(`[aria-label="Editar a descrição do chamado ${ticket.title}"]`) ?? undefined;
    }

    it('shows "Editar" to those who manage tickets even when not the owner, with the ticket active', async () => {
      sessionServiceFake.userId.set('outro-usuario');
      sessionServiceFake.hasPermission.and.returnValue(true);
      detailStoreFake.ticket.set({ ...ticket, status: TicketStatus.Open });
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(findEditButton(fixture)).toBeTruthy();
    });

    it('shows "Editar" to the owner with tickets:update-own even without tickets:manage, with the ticket active', async () => {
      sessionServiceFake.userId.set(ticket.openedByUserId);
      sessionServiceFake.hasPermission.and.callFake((code: string) => code === 'tickets:update-own');
      detailStoreFake.ticket.set({ ...ticket, status: TicketStatus.Open });
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(findEditButton(fixture)).toBeTruthy();
    });

    it('does not show "Editar" to the owner without tickets:update-own (the API would respond 403)', async () => {
      sessionServiceFake.userId.set(ticket.openedByUserId);
      sessionServiceFake.hasPermission.and.returnValue(false);
      detailStoreFake.ticket.set({ ...ticket, status: TicketStatus.Open, canCancel: false });
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(findEditButton(fixture)).toBeFalsy();
    });

    it('does not show "Editar" to someone who is neither the owner nor manages tickets', async () => {
      sessionServiceFake.userId.set('outro-usuario');
      sessionServiceFake.hasPermission.and.returnValue(false);
      detailStoreFake.ticket.set({ ...ticket, status: TicketStatus.Open, canCancel: false });
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(findEditButton(fixture)).toBeFalsy();
    });

    it('does not show "Editar" to the owner when the ticket is not active', async () => {
      sessionServiceFake.userId.set(ticket.openedByUserId);
      sessionServiceFake.hasPermission.and.returnValue(false);
      detailStoreFake.ticket.set({ ...ticket, status: TicketStatus.Resolved });
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(findEditButton(fixture)).toBeFalsy();
    });

    it('opens the modal clearing the error from a previous mutation, and saves the description reloading the history', async () => {
      sessionServiceFake.userId.set(ticket.openedByUserId);
      sessionServiceFake.hasPermission.and.callFake((code: string) => code === 'tickets:update-own');
      detailStoreFake.ticket.set({ ...ticket, status: TicketStatus.Open });
      detailStoreFake.updateDescription.and.callFake(
        (_id: string, _desc: string, onSuccess?: () => void) => onSuccess?.());
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      findEditButton(fixture)!.click();
      expect(detailStoreFake.clearMutationError).toHaveBeenCalled();
      expect(fixture.componentInstance.editingTicket()).toEqual(jasmine.objectContaining({ id: 't1' }));

      fixture.componentInstance.onEditSave('Descrição corrigida com mais detalhes.');

      expect(detailStoreFake.updateDescription).toHaveBeenCalledWith('t1', 'Descrição corrigida com mais detalhes.', jasmine.any(Function));
      expect(toastServiceFake.show).toHaveBeenCalledWith('Descrição atualizada.');
      expect(historyStoreFake.reload).toHaveBeenCalled();
      expect(fixture.componentInstance.editingTicket()).toBeNull();
    });
  });

  describe('cancel as owner', () => {
    it('shows the dedicated "Cancelar chamado" button to the owner without chamados:manage', async () => {
      sessionServiceFake.userId.set(ticket.openedByUserId);
      sessionServiceFake.hasPermission.and.returnValue(false);
      detailStoreFake.ticket.set({ ...ticket, status: TicketStatus.Open });
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      const cancelButton = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
        .find(b => b.textContent?.includes('Cancelar chamado'));
      expect(cancelButton).toBeTruthy();

      cancelButton!.click();
      expect(confirmDialogServiceFake.confirm).toHaveBeenCalled();
      expect(detailStoreFake.updateStatus).toHaveBeenCalledWith('t1', TicketStatus.Canceled, jasmine.any(Function));
    });

    it('does not duplicate the "Cancelar chamado" button for those who already manage tickets (it already comes from the status transitions)', async () => {
      sessionServiceFake.userId.set(ticket.openedByUserId);
      sessionServiceFake.hasPermission.and.returnValue(true);
      detailStoreFake.ticket.set({ ...ticket, status: TicketStatus.Open });
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      const cancelButtons = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
        .filter(b => b.textContent?.includes('Cancelar chamado'));
      expect(cancelButtons.length).toBe(1);
    });

    it('does not show "Cancelar chamado" to someone who is neither the owner nor manages tickets', async () => {
      sessionServiceFake.userId.set('outro-usuario');
      sessionServiceFake.hasPermission.and.returnValue(false);
      detailStoreFake.ticket.set({ ...ticket, status: TicketStatus.Open, canCancel: false });
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      const cancelButton = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
        .find(b => b.textContent?.includes('Cancelar chamado'));
      expect(cancelButton).toBeFalsy();
    });
  });

  describe('cancellation window (spec 016)', () => {
    /** Data UTC a N minutos de agora. */
    function minutesFromNow(minutes: number): string {
      return new Date(Date.now() + minutes * 60_000).toISOString();
    }

    /** Primeiro botão da tela com o texto informado. */
    function findButton(fixture: ReturnType<typeof TestBed.createComponent<TicketDetailComponent>>, text: string): HTMLButtonElement | undefined {
      return Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
        .find(b => b.textContent?.includes(text));
    }

    it('shows the owner how much time is left to cancel', async () => {
      sessionServiceFake.userId.set(ticket.openedByUserId);
      sessionServiceFake.hasPermission.and.returnValue(false);
      detailStoreFake.ticket.set({ ...ticket, status: TicketStatus.Open, ownerCancelDeadlineUtc: minutesFromNow(8) });
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(fixture.nativeElement.querySelector('.cancel-window')?.textContent?.trim()).toBe('Dá pra cancelar por mais 8 min.');
    });

    it('hides the owner\'s Cancelar when the window has expired', async () => {
      sessionServiceFake.userId.set(ticket.openedByUserId);
      sessionServiceFake.hasPermission.and.returnValue(false);
      detailStoreFake.ticket.set({ ...ticket, status: TicketStatus.Open, ownerCancelDeadlineUtc: minutesFromNow(-1) });
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      const cancelButton = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
        .find(b => b.textContent?.includes('Cancelar chamado'));
      expect(cancelButton).toBeFalsy();
      expect(fixture.nativeElement.querySelector('.cancel-window')).toBeNull();
    });

    it('with tickets:manage but without tickets:cancel, the transitions do not include Cancelar', async () => {
      sessionServiceFake.hasPermission.and.callFake((code: string) => code === 'tickets:manage');
      detailStoreFake.ticket.set({ ...ticket, status: TicketStatus.Open, canCancel: false });
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(findButton(fixture, 'Iniciar atendimento')).toBeTruthy();
      expect(findButton(fixture, 'Cancelar chamado')).toBeFalsy();
    });

    it('with tickets:cancel, cancels with no deadline and no countdown', async () => {
      detailStoreFake.ticket.set({ ...ticket, status: TicketStatus.Open, ownerCancelDeadlineUtc: minutesFromNow(-60) });
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(findButton(fixture, 'Cancelar chamado')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('.cancel-window')).toBeNull();
    });
  });

  describe('SLA panel', () => {
    it('shows business time in hours and minutes, not in raw minutes', async () => {
      detailStoreFake.sla.set({
        ...sla,
        objectives: [
          makeObjective({ metric: TicketSlaMetric.FirstResponse, consumedMinutes: 0, remainingMinutes: 120 }),
          makeObjective({ metric: TicketSlaMetric.Resolution, consumedMinutes: 45, remainingMinutes: 555 })
        ]
      });
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      const text = fixture.nativeElement.textContent;
      expect(text).toContain('2h úteis restantes · 0 min consumidos');
      expect(text).toContain('9h 15min úteis restantes · 45 min consumidos');
      expect(text).not.toContain('555');
    });

    it('does not repeat the "Prazo" row in the summary when the SLA panel is present', async () => {
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      const summaryLabels = Array.from(fixture.nativeElement.querySelectorAll('dl.max-w-700 dt') as NodeListOf<HTMLElement>)
        .map(dt => dt.textContent?.trim());
      expect(summaryLabels).not.toContain('Prazo');
      expect(fixture.nativeElement.textContent).toContain('Prazo:');
    });

    it('highlights the objective deadline in red when it was exceeded and in amber when it is at risk', async () => {
      detailStoreFake.sla.set({
        ...sla,
        objectives: [
          makeObjective({ metric: TicketSlaMetric.FirstResponse, state: TicketSlaObjectiveState.Breached }),
          makeObjective({ metric: TicketSlaMetric.Resolution, state: TicketSlaObjectiveState.AtRisk })
        ]
      });
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      const prazoLines = Array.from(fixture.nativeElement.querySelectorAll('p') as NodeListOf<HTMLElement>)
        .filter(p => p.textContent?.trim().startsWith('Prazo:'));
      expect(prazoLines.length).toBe(2);
      expect(prazoLines[0].classList).toContain('text-danger');
      expect(prazoLines[1].classList).toContain('text-warning');
    });

    it('shows both cards (Primeira resposta and Resolução) for a new ticket', async () => {
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      const text = fixture.nativeElement.textContent;
      expect(text).toContain('Primeira resposta');
      expect(text).toContain('Resolução');
      expect(text).toContain('Padrão · Expediente');
      expect(text).toContain('30 min úteis restantes · 30 min consumidos');
      expect(text).toContain('7h 30min úteis restantes · 30 min consumidos');
    });

    it('shows the "Legado (horas corridas)" badge and "Sem meta de primeira resposta" on a legacy ticket', async () => {
      detailStoreFake.sla.set({
        serverNowUtc: '2026-01-01T13:00:00Z',
        plan: { policyId: null, policyName: 'Legado', policyVersion: 0, calendarId: 'c0', calendarName: 'Corrido', isLegacy: true },
        objectives: [
          makeObjective({
            metric: TicketSlaMetric.FirstResponse, state: TicketSlaObjectiveState.NotApplicable, targetMinutes: null,
            startedAtUtc: null, warningAtUtc: null, dueAtUtc: null, consumedMinutes: null, remainingMinutes: null
          }),
          makeObjective({ metric: TicketSlaMetric.Resolution })
        ]
      });
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      const text = fixture.nativeElement.textContent;
      expect(text).toContain('Legado (horas corridas)');
      expect(text).toContain('Sem meta de primeira resposta.');
    });

    it('shows the current cycle and the "Ciclos anteriores" area on a reopened ticket', async () => {
      detailStoreFake.sla.set({
        ...sla,
        objectives: [
          makeObjective({ metric: TicketSlaMetric.FirstResponse, dueAtUtc: '2026-01-01T13:00:00Z' }),
          makeObjective({
            metric: TicketSlaMetric.Resolution, cycle: 1, isCurrentCycle: false, state: TicketSlaObjectiveState.Missed,
            stoppedAtUtc: '2026-01-02T12:30:00Z', consumedMinutes: 480, remainingMinutes: 0
          }),
          makeObjective({ metric: TicketSlaMetric.Resolution, cycle: 2, isCurrentCycle: true })
        ]
      });
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();
      expect(fixture.nativeElement.textContent).not.toContain('Ciclo 1');

      const toggleButton = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
        .find(b => b.textContent?.includes('Ciclos anteriores'));
      toggleButton!.click();
      await fixture.whenStable();

      const text = fixture.nativeElement.textContent;
      expect(text).toContain('Resolução — Ciclo 1');
      expect(text).toContain('Parado em');
    });

    it('shows the 7 objective states with the right label and badge', async () => {
      const statesAndBadges: [TicketSlaObjectiveState, string, string][] = [
        [TicketSlaObjectiveState.Running, 'Em andamento', 'bg-label-success'],
        [TicketSlaObjectiveState.AtRisk, 'Em risco', 'bg-label-warning'],
        [TicketSlaObjectiveState.Breached, 'Atrasado', 'bg-label-danger'],
        [TicketSlaObjectiveState.Met, 'Cumprido', 'bg-label-success'],
        [TicketSlaObjectiveState.Missed, 'Perdido', 'bg-label-danger'],
        [TicketSlaObjectiveState.Stopped, 'Parado', 'bg-label-secondary'],
        [TicketSlaObjectiveState.NotApplicable, 'Sem meta', 'bg-label-secondary']
      ];

      for (const [state, label, badgeClass] of statesAndBadges) {
        detailStoreFake.sla.set({
          ...sla,
          objectives: [makeObjective({ metric: TicketSlaMetric.FirstResponse, state })]
        });
        const fixture = TestBed.createComponent(TicketDetailComponent);
        await fixture.whenStable();

        const badge = Array.from(fixture.nativeElement.querySelectorAll('.badge') as NodeListOf<HTMLElement>)
          .find(b => b.textContent?.trim() === label);
        expect(badge).withContext(`estado ${state}`).toBeTruthy();
        expect(badge?.classList).toContain(badgeClass);
      }
    });

    it('uses serverNowUtc (server time), not the local clock, for the relative objective deadline', async () => {
      // serverNowUtc fica bem no passado — se o cálculo usasse Date.now(), o resultado seria outro.
      detailStoreFake.sla.set({
        ...sla,
        serverNowUtc: '2020-01-01T11:20:00Z',
        objectives: [makeObjective({ metric: TicketSlaMetric.FirstResponse, dueAtUtc: '2020-01-01T12:00:00Z' })]
      });
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(fixture.nativeElement.textContent).toContain('Vence em 40 minutos');
    });

    it('does not show the panel when there is no sla (still loading, for example)', async () => {
      detailStoreFake.sla.set(null);
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(fixture.nativeElement.textContent).not.toContain('Padrão · Expediente');
    });
  });

  describe('messages', () => {
    it('loads the ticket messages on init', async () => {
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(messagesStoreFake.loadForTicket).toHaveBeenCalledWith('t1');
    });

    it('shows the loaded messages, with author and date', async () => {
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      const text = fixture.nativeElement.textContent;
      expect(text).toContain('Já verifiquei, aguardando peça.');
      expect(text).toContain('Maria Souza'); // authorUserId 'u1' == ticket.openedByUserId
    });

    it('resolves the author name: "Você" when it is the logged-in user', async () => {
      messagesStoreFake.messages.set([{ ...message, authorUserId: 'viewer-1' }]);
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(fixture.nativeElement.textContent).toContain('Você');
    });

    it('resolves the author name from the current assignee of the ticket', async () => {
      detailStoreFake.ticket.set({ ...ticket, assignedToUserId: 'u2', assignedToName: 'João Pedro' });
      messagesStoreFake.messages.set([{ ...message, authorUserId: 'u2' }]);
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(fixture.nativeElement.textContent).toContain('João Pedro');
    });

    it('uses "Equipe" as a generic label when the author is not the requester, the assignee or the logged-in user', async () => {
      messagesStoreFake.messages.set([{ ...message, authorUserId: 'outro-admin' }]);
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(fixture.nativeElement.textContent).toContain('Equipe');
    });

    it('shows "(editada)" when the message has editedAtUtc', async () => {
      messagesStoreFake.messages.set([{ ...message, editedAtUtc: '2026-01-01T13:00:00Z' }]);
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(fixture.nativeElement.textContent).toContain('(editada)');
    });

    it('shows a message when there are none yet', async () => {
      messagesStoreFake.messages.set([]);
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(fixture.nativeElement.textContent).toContain('Nenhuma mensagem ainda.');
    });

    it('sends the new message, clears the box and reloads the history on success', async () => {
      messagesStoreFake.post.and.callFake((_id: string, _content: string, onSuccess?: () => void) => onSuccess?.());
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();
      fixture.componentInstance.newMessageContent.set('Resolvido, pode confirmar.');

      fixture.componentInstance.onSendMessage();

      expect(messagesStoreFake.post).toHaveBeenCalledWith('t1', 'Resolvido, pode confirmar.', jasmine.any(Function));
      expect(fixture.componentInstance.newMessageContent()).toBe('');
      expect(toastServiceFake.show).toHaveBeenCalledWith('Mensagem enviada.');
      expect(historyStoreFake.reload).toHaveBeenCalled();
      expect(detailStoreFake.refreshSla).toHaveBeenCalled();
    });

    it('does not update the SLA when posting fails (post without calling onSuccess)', async () => {
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();
      fixture.componentInstance.newMessageContent.set('Resolvido, pode confirmar.');

      fixture.componentInstance.onSendMessage();

      expect(messagesStoreFake.post).toHaveBeenCalled();
      expect(detailStoreFake.refreshSla).not.toHaveBeenCalled();
    });

    it('does not send an empty message (only spaces)', async () => {
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();
      fixture.componentInstance.newMessageContent.set('   ');

      fixture.componentInstance.onSendMessage();

      expect(messagesStoreFake.post).not.toHaveBeenCalled();
    });

    it('shows the "Editar" button only to the one who wrote the message', async () => {
      messagesStoreFake.messages.set([{ ...message, authorUserId: 'viewer-1' }]);
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(fixture.nativeElement.querySelector('button[aria-label="Editar mensagem"]')).toBeTruthy();
    });

    it('does not show the "Editar" button to those who did not write the message', async () => {
      messagesStoreFake.messages.set([{ ...message, authorUserId: 'outro-admin' }]);
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(fixture.nativeElement.querySelector('button[aria-label="Editar mensagem"]')).toBeFalsy();
    });

    it('shows the "Excluir" button to those with chamados:manage, even when not the author', async () => {
      sessionServiceFake.hasPermission.and.returnValue(true);
      messagesStoreFake.messages.set([{ ...message, authorUserId: 'outro-admin' }]);
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(fixture.nativeElement.querySelector('button[aria-label="Excluir mensagem"]')).toBeTruthy();
    });

    it('does not show the "Excluir" button without being the author or having chamados:manage', async () => {
      sessionServiceFake.hasPermission.and.returnValue(false);
      messagesStoreFake.messages.set([{ ...message, authorUserId: 'outro-admin' }]);
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(fixture.nativeElement.querySelector('button[aria-label="Excluir mensagem"]')).toBeFalsy();
    });

    it('edits the message inline and saves, reloading the history on success', async () => {
      messagesStoreFake.messages.set([{ ...message, authorUserId: 'viewer-1' }]);
      messagesStoreFake.editMessage.and.callFake((_id: string, _content: string, onSuccess?: () => void) => onSuccess?.());
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      fixture.componentInstance.onStartEdit({ ...message, authorUserId: 'viewer-1' });
      await fixture.whenStable();
      expect(fixture.componentInstance.editMessageContent()).toBe(message.content);

      fixture.componentInstance.editMessageContent.set('Texto corrigido.');
      fixture.componentInstance.onSaveEdit('m1');

      expect(messagesStoreFake.editMessage).toHaveBeenCalledWith('m1', 'Texto corrigido.', jasmine.any(Function));
      expect(toastServiceFake.show).toHaveBeenCalledWith('Mensagem editada.');
      expect(fixture.componentInstance.editingMessageId()).toBeNull();
      expect(historyStoreFake.reload).toHaveBeenCalled();
    });

    it('cancels the inline edit without saving', async () => {
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();
      fixture.componentInstance.onStartEdit(message);

      fixture.componentInstance.onCancelEdit();

      expect(fixture.componentInstance.editingMessageId()).toBeNull();
      expect(messagesStoreFake.editMessage).not.toHaveBeenCalled();
    });

    it('asks for confirmation and deletes the message, reloading the history on success', async () => {
      confirmDialogServiceFake.confirm.and.returnValue(of(true));
      messagesStoreFake.deleteMessage.and.callFake((_id: string, onSuccess?: () => void) => onSuccess?.());
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      fixture.componentInstance.onDeleteMessage('m1');

      expect(confirmDialogServiceFake.confirm).toHaveBeenCalled();
      expect(messagesStoreFake.deleteMessage).toHaveBeenCalledWith('m1', jasmine.any(Function));
      expect(toastServiceFake.show).toHaveBeenCalledWith('Mensagem excluída.');
      expect(historyStoreFake.reload).toHaveBeenCalled();
    });

    it('does not delete the message when the confirmation is cancelled', async () => {
      confirmDialogServiceFake.confirm.and.returnValue(of(false));
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      fixture.componentInstance.onDeleteMessage('m1');

      expect(messagesStoreFake.deleteMessage).not.toHaveBeenCalled();
    });

    it('shows the load-more-messages button only when there are more pages, and loads on click', async () => {
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();
      expect(fixture.nativeElement.textContent).not.toContain('Carregar mais mensagens');

      messagesStoreFake.hasMore.set(true);
      await fixture.whenStable();

      const button = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
        .find(b => b.textContent?.includes('Carregar mais mensagens'));
      button!.click();

      expect(messagesStoreFake.loadMore).toHaveBeenCalled();
    });

    it('shows the store posting error message', async () => {
      messagesStoreFake.postError.set('Você não tem permissão para enviar mensagens neste chamado.');
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(fixture.nativeElement.textContent).toContain('Você não tem permissão para enviar mensagens neste chamado.');
    });
  });

  describe('history', () => {
    it('shows the loaded events', async () => {
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(fixture.nativeElement.textContent).toContain('Chamado criado');
    });

    it('shows a message when there are no events', async () => {
      historyStoreFake.entries.set([]);
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(fixture.nativeElement.textContent).toContain('Nenhum evento registrado ainda.');
    });

    it('shows a spinner while the history loads', async () => {
      historyStoreFake.state.set({ loading: true, error: null });
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(fixture.nativeElement.querySelectorAll('.spinner-border').length).toBeGreaterThan(0);
    });

    it('shows the load-more-events button only when there are more pages, and loads on click', async () => {
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();
      expect(fixture.nativeElement.textContent).not.toContain('Carregar mais eventos');

      historyStoreFake.hasMore.set(true);
      await fixture.whenStable();

      const button = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
        .find(b => b.textContent?.includes('Carregar mais eventos'));
      button!.click();

      expect(historyStoreFake.loadMore).toHaveBeenCalled();
    });

    it('shows the history error message when loading fails', async () => {
      historyStoreFake.state.set({ loading: false, error: 'Erro ao carregar o histórico' });
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(fixture.nativeElement.textContent).toContain('Erro ao carregar o histórico');
    });
  });

  it('shows "Excluir" for the attachment only to the one who uploaded the file or manages tickets (same rule as the back end)', async () => {
    sessionServiceFake.hasPermission.and.returnValue(false);
    sessionServiceFake.userId.set('outra-pessoa');
    const fixture = TestBed.createComponent(TicketDetailComponent);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('[aria-label="Excluir foto.png"]')).toBeNull();

    sessionServiceFake.userId.set('u1');
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('[aria-label="Excluir foto.png"]')).not.toBeNull();
  });
});
