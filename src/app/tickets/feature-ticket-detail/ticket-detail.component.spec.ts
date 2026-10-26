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
import { TicketAttachment } from '../entities/ticket-attachment';
import { TicketMessage } from '../entities/ticket-message';
import { TicketHistoryAction, TicketHistoryEntry } from '../entities/ticket-history';
import { TicketPriority } from '../entities/ticket-priority';
import { TicketStatus } from '../entities/ticket-status';
import { TicketSlaStatus } from '../entities/ticket-sla-status';
import { TicketSla, TicketSlaMetric, TicketSlaObjective, TicketSlaObjectiveState } from '../entities/ticket-sla';
import { ConfirmDialogService, SessionService, ToastService, setRoleColor } from '../../shared';
import { UserSummary } from '../../users';

const ROLE_COLOR_STORAGE_KEY = 'tickest.roleColors';

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
    openedByUserId: 'u1', openedByName: 'Maria Souza', assignedToUserId: null, assignedToName: null,
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
  const candidate: UserSummary = {
    id: 'u2', email: 'joao.pedro@empresa.com', firstName: 'João', lastName: 'Pedro',
    roles: [{ name: 'Atendente' }], isActive: true, createdAtUtc: '2025-01-01T12:00:00Z', deactivatedAtUtc: null
  };

  /** Cria um store de detalhe falso com signals reais. */
  function createDetailStoreFake() {
    return {
      ticket: signal<TicketDetail | undefined>(ticket),
      state: signal({ loading: false, error: null as string | null }),
      mutationError: signal<string | null>(null),
      removingAssignee: signal(false),
      assigningTicket: signal(false),
      updatingStatus: signal(false),
      reopening: signal(false),
      sla: signal<TicketSla | null>(sla),
      slaRefreshing: signal(false),
      slaError: signal<string | null>(null),
      refreshSla: jasmine.createSpy('refreshSla'),
      assigneeCandidates: signal<UserSummary[]>([]),
      searchingAssignees: signal(false),
      assigneeSearchError: signal<string | null>(null),
      loadTicket: jasmine.createSpy('loadTicket'),
      removeAssignee: jasmine.createSpy('removeAssignee'),
      assignTicket: jasmine.createSpy('assignTicket'),
      updateStatus: jasmine.createSpy('updateStatus'),
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
      clearPostError: jasmine.createSpy('clearPostError'),
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
    localStorage.removeItem(ROLE_COLOR_STORAGE_KEY);
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

  it('carrega o ticket pelo id da rota, o histórico e os anexos ao inicializar', async () => {
    const fixture = TestBed.createComponent(TicketDetailComponent);
    await fixture.whenStable();

    expect(detailStoreFake.loadTicket).toHaveBeenCalledWith('t1');
    expect(historyStoreFake.loadForTicket).toHaveBeenCalledWith('t1');
    expect(attachmentsStoreFake.loadForTicket).toHaveBeenCalledWith('t1');
    expect(fixture.nativeElement.textContent).toContain('Impressora não funciona');
  });

  it('mostra "Meus Tickets" no trilho e volta pra /tickets por padrão, sem ?from na URL', async () => {
    const fixture = TestBed.createComponent(TicketDetailComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Meus Tickets /');
    const backLink = fixture.nativeElement.querySelector('a.btn-outline-secondary') as HTMLAnchorElement;
    expect(backLink.getAttribute('href')).toBe('/tickets');
  });

  it('mostra "Administração / Monitorar Tickets" no trilho e volta pra /tickets/monitorar quando chega com ?from=monitor', async () => {
    TestBed.overrideProvider(ActivatedRoute, {
      useValue: {
        snapshot: { paramMap: convertToParamMap({ id: 't1' }), queryParamMap: convertToParamMap({ from: 'monitor' }) }
      }
    });
    const fixture = TestBed.createComponent(TicketDetailComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Administração / Monitorar Tickets /');
    const backLink = fixture.nativeElement.querySelector('a.btn-outline-secondary') as HTMLAnchorElement;
    expect(backLink.getAttribute('href')).toBe('/tickets/monitorar');
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

  it('mostra a urgência relativa do prazo e destaca em vermelho quando o SLA está violado', async () => {
    const overdueBy3Hours = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    detailStoreFake.ticket.set({ ...ticket, dueAtUtc: overdueBy3Hours, slaStatus: TicketSlaStatus.Breached, resolvedAtUtc: null });
    const fixture = TestBed.createComponent(TicketDetailComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Atrasado há 3 horas');
    const prazoDd = fixture.nativeElement.querySelector('dd.text-danger');
    expect(prazoDd).withContext('a linha de Prazo deve ficar vermelha quando o SLA está violado').toBeTruthy();
  });

  it('mostra "vence em" e destaca em amarelo quando o SLA está em risco, sem destaque quando está no prazo', async () => {
    const dueIn40Minutes = new Date(Date.now() + 40 * 60 * 1000).toISOString();
    detailStoreFake.ticket.set({ ...ticket, dueAtUtc: dueIn40Minutes, slaStatus: TicketSlaStatus.AtRisk, resolvedAtUtc: null });
    const fixture = TestBed.createComponent(TicketDetailComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Vence em 40 minutos');
    expect(fixture.nativeElement.querySelector('dd.text-warning')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('dd.text-danger')).toBeFalsy();
  });

  it('não mostra urgência de prazo pra um chamado já resolvido', async () => {
    detailStoreFake.ticket.set({ ...ticket, resolvedAtUtc: '2026-01-02T10:00:00Z', slaStatus: TicketSlaStatus.Met });
    const fixture = TestBed.createComponent(TicketDetailComponent);
    await fixture.whenStable();

    // Escopado na linha "Prazo" do resumo do chamado — o painel de SLA abaixo tem sua própria
    // urgência relativa por objetivo, independente deste campo (ver describe('painel de SLA')).
    const prazoText = fixture.nativeElement.querySelector('dl.max-w-700')?.textContent;
    expect(prazoText).not.toContain('Vence em');
    expect(prazoText).not.toContain('Atrasado há');
  });

  it('mostra "Resolvido em" quando o chamado tem data de resolução', async () => {
    detailStoreFake.ticket.set({ ...ticket, status: TicketStatus.Resolved, resolvedAtUtc: '2026-01-02T10:00:00Z' });
    const fixture = TestBed.createComponent(TicketDetailComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Resolvido em');
  });

  it('não mostra "Resolvido em" quando o chamado ainda não foi resolvido', async () => {
    const fixture = TestBed.createComponent(TicketDetailComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).not.toContain('Resolvido em');
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

  it('o botão "Anexar arquivo" é um <button> real (alcançável por teclado) que abre o seletor de arquivo oculto', async () => {
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

  it('os botões de baixar/excluir anexo têm aria-label (são ícone-apenas)', async () => {
    const fixture = TestBed.createComponent(TicketDetailComponent);
    await fixture.whenStable();

    const downloadButton = fixture.nativeElement.querySelector('button[aria-label^="Baixar"]');
    const deleteButton = fixture.nativeElement.querySelector('button[aria-label="Excluir foto.png"]');
    expect(downloadButton?.getAttribute('aria-label')).toBe('Baixar foto.png');
    expect(deleteButton).toBeTruthy();
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

    expect(attachmentsStoreFake.upload).toHaveBeenCalledWith(file, jasmine.any(Function));
    expect(fixture.componentInstance.fileValidationError()).toBeNull();
  });

  it('mostra um toast de sucesso ao enviar o anexo', async () => {
    attachmentsStoreFake.upload.and.callFake((_file: File, onSuccess?: () => void) => onSuccess?.());
    const fixture = TestBed.createComponent(TicketDetailComponent);
    await fixture.whenStable();

    const file = new File(['x'], 'foto.png', { type: 'image/png' });
    const input = document.createElement('input');
    Object.defineProperty(input, 'files', { value: [file] });
    fixture.componentInstance.onFileSelected({ target: input } as unknown as Event);

    expect(toastServiceFake.show).toHaveBeenCalledWith('Anexo enviado.');
  });

  it('exclui o anexo quando confirmado', async () => {
    confirmDialogServiceFake.confirm.and.returnValue(of(true));
    const fixture = TestBed.createComponent(TicketDetailComponent);
    await fixture.whenStable();

    fixture.componentInstance.onDeleteAttachment('a1', 'foto.png');

    expect(attachmentsStoreFake.delete).toHaveBeenCalledWith('a1', jasmine.any(Function));
  });

  it('mostra um toast de sucesso ao excluir o anexo', async () => {
    confirmDialogServiceFake.confirm.and.returnValue(of(true));
    attachmentsStoreFake.delete.and.callFake((_id: string, onSuccess?: () => void) => onSuccess?.());
    const fixture = TestBed.createComponent(TicketDetailComponent);
    await fixture.whenStable();

    fixture.componentInstance.onDeleteAttachment('a1', 'foto.png');

    expect(toastServiceFake.show).toHaveBeenCalledWith('Anexo excluído.');
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

  it('recarrega o ticket ao clicar em "Tentar novamente" quando falhar, mas não mostra o botão quando é só "não encontrado"', async () => {
    detailStoreFake.ticket.set(undefined);
    detailStoreFake.state.set({ loading: false, error: 'Você não tem acesso a este ticket.' });
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

  it('recarrega os anexos e o histórico ao clicar em "Tentar novamente" nos respectivos erros', async () => {
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

  it('mostra um spinner — não o aviso de não encontrado — enquanto o ticket ainda está carregando', async () => {
    detailStoreFake.ticket.set(undefined);
    detailStoreFake.state.set({ loading: true, error: null });
    const fixture = TestBed.createComponent(TicketDetailComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.spinner-border')).not.toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Não encontramos esse ticket');
  });

  describe('remover responsável', () => {
    function findRemoveButton(fixture: ReturnType<typeof TestBed.createComponent<TicketDetailComponent>>): HTMLButtonElement | undefined {
      return Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
        .find(b => b.textContent?.includes('Remover responsável'));
    }

    it('mostra o botão quando o usuário tem permissão, o chamado está ativo e tem responsável', async () => {
      detailStoreFake.ticket.set({ ...ticket, status: TicketStatus.InProgress, assignedToName: 'João Pedro' });
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(findRemoveButton(fixture)).not.toBeUndefined();
    });

    it('não mostra o botão sem a permissão tickets:manage', async () => {
      sessionServiceFake.hasPermission.and.returnValue(false);
      detailStoreFake.ticket.set({ ...ticket, status: TicketStatus.InProgress, assignedToName: 'João Pedro' });
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(findRemoveButton(fixture)).toBeUndefined();
    });

    it('não mostra o botão quando o chamado não está ativo (Resolvido)', async () => {
      detailStoreFake.ticket.set({ ...ticket, status: TicketStatus.Resolved, assignedToName: 'João Pedro' });
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(findRemoveButton(fixture)).toBeUndefined();
    });

    it('não mostra o botão quando não há responsável atribuído', async () => {
      detailStoreFake.ticket.set({ ...ticket, status: TicketStatus.Open, assignedToName: null });
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(findRemoveButton(fixture)).toBeUndefined();
    });

    it('pede confirmação e remove o responsável, recarregando o histórico em caso de sucesso', async () => {
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

    it('não remove o responsável quando a confirmação for cancelada', async () => {
      detailStoreFake.ticket.set({ ...ticket, status: TicketStatus.Open, assignedToName: 'João Pedro' });
      confirmDialogServiceFake.confirm.and.returnValue(of(false));
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      findRemoveButton(fixture)!.click();

      expect(detailStoreFake.removeAssignee).not.toHaveBeenCalled();
    });

    it('mostra a mensagem de erro da mutação quando a remoção falhar', async () => {
      detailStoreFake.ticket.set({ ...ticket, status: TicketStatus.Open, assignedToName: 'João Pedro' });
      detailStoreFake.mutationError.set('O chamado não está ativo.');
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(fixture.nativeElement.textContent).toContain('O chamado não está ativo.');
    });
  });

  describe('atribuir responsável', () => {
    function findAssignButton(fixture: ReturnType<typeof TestBed.createComponent<TicketDetailComponent>>): HTMLButtonElement | undefined {
      return Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
        .find(b => b.textContent?.includes('Atribuir responsável') || b.textContent?.includes('Alterar responsável'));
    }

    it('mostra "Atribuir responsável" quando o chamado está ativo e sem responsável', async () => {
      detailStoreFake.ticket.set({ ...ticket, status: TicketStatus.Open, assignedToName: null });
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(findAssignButton(fixture)?.textContent).toContain('Atribuir responsável');
    });

    it('mostra "Alterar responsável" quando o chamado já tem responsável', async () => {
      detailStoreFake.ticket.set({ ...ticket, status: TicketStatus.InProgress, assignedToName: 'Maria Souza' });
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(findAssignButton(fixture)?.textContent).toContain('Alterar responsável');
    });

    it('não mostra o botão sem a permissão tickets:manage', async () => {
      sessionServiceFake.hasPermission.and.returnValue(false);
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(findAssignButton(fixture)).toBeUndefined();
    });

    it('não mostra o botão quando o chamado não está ativo (Resolvido)', async () => {
      detailStoreFake.ticket.set({ ...ticket, status: TicketStatus.Resolved });
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(findAssignButton(fixture)).toBeUndefined();
    });

    it('reseta a busca, a seleção e o erro de mutação ao abrir o modal', async () => {
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();
      fixture.componentInstance.assigneeSearchInput.set('joão');
      fixture.componentInstance.selectedAssigneeId.set('u2');

      findAssignButton(fixture)!.click();

      expect(fixture.componentInstance.assigneeSearchInput()).toBe('');
      expect(fixture.componentInstance.selectedAssigneeId()).toBeNull();
      expect(detailStoreFake.clearMutationError).toHaveBeenCalled();
      expect(detailStoreFake.clearAssigneeSearch).toHaveBeenCalled();
    });

    it('busca com debounce de 300ms após parar de digitar', async () => {
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      fixture.componentInstance.assigneeSearchInput.set('joão');
      await new Promise(resolve => setTimeout(resolve, 350));

      expect(detailStoreFake.searchAssignees).toHaveBeenCalledWith('joão');
    });

    it('não dispara a busca antes dos 300ms', async () => {
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      fixture.componentInstance.assigneeSearchInput.set('joão');
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(detailStoreFake.searchAssignees).not.toHaveBeenCalled();
      await new Promise(resolve => setTimeout(resolve, 300));
    });

    it('mostra os candidatos encontrados e permite selecionar um deles', async () => {
      detailStoreFake.assigneeCandidates.set([candidate]);
      const fixture = TestBed.createComponent(TicketDetailComponent);
      fixture.componentInstance.assigneeSearchInput.set('joão');
      await fixture.whenStable();

      expect(fixture.nativeElement.textContent).toContain('João Pedro');

      const candidateRow = Array.from(fixture.nativeElement.querySelectorAll('li') as NodeListOf<HTMLElement>)
        .find(li => li.textContent?.includes('joao.pedro@empresa.com'));
      candidateRow!.click();
      await fixture.whenStable();

      expect(fixture.componentInstance.selectedAssigneeId()).toBe('u2');
      expect(candidateRow!.classList).toContain('is-selected');
      expect(candidateRow!.getAttribute('aria-selected')).toBe('true');
    });

    it('usa a cor customizada da função quando escolhida (prévia local)', async () => {
      setRoleColor('Atendente', '#ff3e1d');
      detailStoreFake.assigneeCandidates.set([candidate]);
      const fixture = TestBed.createComponent(TicketDetailComponent);
      fixture.componentInstance.assigneeSearchInput.set('joão');
      await fixture.whenStable();

      const candidateRow = Array.from(fixture.nativeElement.querySelectorAll('li') as NodeListOf<HTMLElement>)
        .find(li => li.textContent?.includes('joao.pedro@empresa.com'));
      const badge = candidateRow!.querySelector('.badge') as HTMLElement;
      expect(badge.classList).toContain('badge-role-custom');
      expect(badge.style.getPropertyValue('--role-color')).toBe('#ff3e1d');
    });

    it('mostra no máximo 2 badges de função por candidato, agrupando o resto num badge "+N"', async () => {
      const multiRoleCandidate: UserSummary = {
        ...candidate,
        roles: [{ name: 'Atendente' }, { name: 'Administrador' }, { name: 'Supervisor' }]
      };
      detailStoreFake.assigneeCandidates.set([multiRoleCandidate]);
      const fixture = TestBed.createComponent(TicketDetailComponent);
      fixture.componentInstance.assigneeSearchInput.set('joão');
      await fixture.whenStable();

      const text = fixture.nativeElement.textContent;
      expect(text).toContain('Atendente');
      expect(text).toContain('Administrador');
      expect(text).not.toContain('Supervisor');
      expect(text).toContain('+1');
    });

    it('desmarca o candidato ao clicar de novo nele', async () => {
      detailStoreFake.assigneeCandidates.set([candidate]);
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();
      fixture.componentInstance.onSelectAssignee('u2', 0);

      fixture.componentInstance.onSelectAssignee('u2', 0);

      expect(fixture.componentInstance.selectedAssigneeId()).toBeNull();
    });

    it('navega entre os candidatos com as setas e move o foco circulante', async () => {
      const other: UserSummary = { ...candidate, id: 'u3', firstName: 'Ana', lastName: 'Lima', email: 'ana.lima@empresa.com' };
      detailStoreFake.assigneeCandidates.set([candidate, other]);
      const fixture = TestBed.createComponent(TicketDetailComponent);
      fixture.componentInstance.assigneeSearchInput.set('a');
      await fixture.whenStable();

      fixture.componentInstance.onAssigneeListKeydown({ key: 'ArrowDown', preventDefault: () => {} } as KeyboardEvent, 2);
      expect(fixture.componentInstance.focusedAssigneeIndex()).toBe(1);

      fixture.componentInstance.onAssigneeListKeydown({ key: 'ArrowDown', preventDefault: () => {} } as KeyboardEvent, 2);
      expect(fixture.componentInstance.focusedAssigneeIndex()).toBe(0);

      fixture.componentInstance.onAssigneeListKeydown({ key: 'ArrowUp', preventDefault: () => {} } as KeyboardEvent, 2);
      expect(fixture.componentInstance.focusedAssigneeIndex()).toBe(1);
    });

    it('mostra uma mensagem para digitar quando o campo de busca está vazio', async () => {
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(fixture.nativeElement.textContent).toContain('Digite para buscar um usuário ativo.');
    });

    it('mostra uma mensagem quando a busca não encontra ninguém', async () => {
      const fixture = TestBed.createComponent(TicketDetailComponent);
      fixture.componentInstance.assigneeSearchInput.set('inexistente');
      await fixture.whenStable();

      expect(fixture.nativeElement.textContent).toContain('Nenhum usuário encontrado.');
    });

    it('mostra o erro de busca (ex.: sem permissão users:read) em vez da lista', async () => {
      detailStoreFake.assigneeSearchError.set('Você não tem permissão para buscar usuários.');
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(fixture.nativeElement.textContent).toContain('Você não tem permissão para buscar usuários.');
    });

    it('não confirma a atribuição sem um candidato selecionado', async () => {
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      fixture.componentInstance.onConfirmAssign();

      expect(detailStoreFake.assignTicket).not.toHaveBeenCalled();
    });

    it('atribui o candidato selecionado e recarrega o histórico em caso de sucesso', async () => {
      detailStoreFake.assignTicket.and.callFake((_id: string, _userId: string, onSuccess?: () => void) => onSuccess?.());
      detailStoreFake.assigneeCandidates.set([candidate]);
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();
      fixture.componentInstance.selectedAssigneeId.set('u2');

      fixture.componentInstance.onConfirmAssign();

      expect(detailStoreFake.assignTicket).toHaveBeenCalledWith('t1', 'u2', jasmine.any(Function));
      expect(historyStoreFake.reload).toHaveBeenCalled();
      expect(toastServiceFake.show).toHaveBeenCalledWith('João Pedro agora é o responsável.');
    });

    it('mostra a mensagem de erro da mutação quando a atribuição falhar', async () => {
      detailStoreFake.mutationError.set('O usuário não atende chamados e não pode ser o responsável.');
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(fixture.nativeElement.textContent).toContain('O usuário não atende chamados e não pode ser o responsável.');
    });

    it('o botão de confirmação diz "Atribuir" numa primeira atribuição e "Reatribuir" ao trocar o responsável', async () => {
      detailStoreFake.ticket.set({ ...ticket, status: TicketStatus.Open, assignedToName: null });
      const fixtureSemResponsavel = TestBed.createComponent(TicketDetailComponent);
      await fixtureSemResponsavel.whenStable();
      expect(fixtureSemResponsavel.nativeElement.textContent).toContain('Atribuir');
      expect(fixtureSemResponsavel.nativeElement.textContent).not.toContain('Reatribuir');

      detailStoreFake.ticket.set({ ...ticket, status: TicketStatus.Open, assignedToName: 'Maria Souza' });
      const fixtureComResponsavel = TestBed.createComponent(TicketDetailComponent);
      await fixtureComResponsavel.whenStable();
      expect(fixtureComResponsavel.nativeElement.textContent).toContain('Reatribuir');
    });

    it('avisa que a atribuição substitui o responsável atual quando um candidato está selecionado', async () => {
      detailStoreFake.ticket.set({ ...ticket, status: TicketStatus.Open, assignedToName: 'Maria Souza' });
      detailStoreFake.assigneeCandidates.set([candidate]);
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();
      expect(fixture.nativeElement.textContent).not.toContain('Isso substitui');

      fixture.componentInstance.onSelectAssignee('u2', 0);
      await fixture.whenStable();

      const text = fixture.nativeElement.textContent;
      expect(text).toContain('Isso substitui');
      expect(text).toContain('Maria Souza');
      expect(text).toContain('João Pedro');
    });
  });

  describe('mudar status', () => {
    function findButton(fixture: ReturnType<typeof TestBed.createComponent<TicketDetailComponent>>, text: string): HTMLButtonElement | undefined {
      return Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
        .find(b => b.textContent?.includes(text));
    }

    it('mostra os próximos status válidos pra um chamado Aberto', async () => {
      detailStoreFake.ticket.set({ ...ticket, status: TicketStatus.Open });
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(findButton(fixture, 'Iniciar atendimento')).toBeTruthy();
      expect(findButton(fixture, 'Cancelar chamado')).toBeTruthy();
      expect(findButton(fixture, 'Marcar como resolvido')).toBeFalsy();
    });

    it('mostra só "Fechar chamado" pra um chamado Resolvido', async () => {
      detailStoreFake.ticket.set({ ...ticket, status: TicketStatus.Resolved });
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(findButton(fixture, 'Fechar chamado')).toBeTruthy();
      expect(findButton(fixture, 'Cancelar chamado')).toBeFalsy();
    });

    it('não mostra nenhum botão de transição sem a permissão tickets:manage', async () => {
      sessionServiceFake.hasPermission.and.returnValue(false);
      detailStoreFake.ticket.set({ ...ticket, status: TicketStatus.Open });
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(findButton(fixture, 'Iniciar atendimento')).toBeFalsy();
      expect(findButton(fixture, 'Cancelar chamado')).toBeFalsy();
    });

    it('não mostra nenhum botão de transição pra um chamado Fechado (terminal)', async () => {
      detailStoreFake.ticket.set({ ...ticket, status: TicketStatus.Closed });
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(findButton(fixture, 'Iniciar atendimento')).toBeFalsy();
      expect(findButton(fixture, 'Marcar como resolvido')).toBeFalsy();
      expect(findButton(fixture, 'Fechar chamado')).toBeFalsy();
    });

    it('muda o status sem confirmação para uma transição de rotina (Iniciar atendimento)', async () => {
      detailStoreFake.ticket.set({ ...ticket, status: TicketStatus.Open });
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      findButton(fixture, 'Iniciar atendimento')!.click();

      expect(confirmDialogServiceFake.confirm).not.toHaveBeenCalled();
      expect(detailStoreFake.updateStatus).toHaveBeenCalledWith('t1', TicketStatus.InProgress, ticket.description, jasmine.any(Function));
    });

    it('pede confirmação antes de cancelar, e cancela quando confirmado', async () => {
      detailStoreFake.ticket.set({ ...ticket, status: TicketStatus.Open });
      confirmDialogServiceFake.confirm.and.returnValue(of(true));
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      findButton(fixture, 'Cancelar chamado')!.click();

      expect(confirmDialogServiceFake.confirm).toHaveBeenCalled();
      expect(detailStoreFake.updateStatus).toHaveBeenCalledWith('t1', TicketStatus.Canceled, ticket.description, jasmine.any(Function));
    });

    it('não cancela quando a confirmação é negada', async () => {
      detailStoreFake.ticket.set({ ...ticket, status: TicketStatus.Open });
      confirmDialogServiceFake.confirm.and.returnValue(of(false));
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      findButton(fixture, 'Cancelar chamado')!.click();

      expect(detailStoreFake.updateStatus).not.toHaveBeenCalled();
    });

    it('mostra um toast e recarrega o histórico ao mudar o status com sucesso', async () => {
      detailStoreFake.ticket.set({ ...ticket, status: TicketStatus.InProgress });
      detailStoreFake.updateStatus.and.callFake((_id: string, _status: TicketStatus, _desc: string, onSuccess?: () => void) => onSuccess?.());
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      findButton(fixture, 'Marcar como resolvido')!.click();

      expect(toastServiceFake.show).toHaveBeenCalledWith('Chamado marcado como resolvido.');
      expect(historyStoreFake.reload).toHaveBeenCalled();
    });
  });

  describe('reabrir', () => {
    function findReopenButton(fixture: ReturnType<typeof TestBed.createComponent<TicketDetailComponent>>): HTMLButtonElement | undefined {
      return Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
        .find(b => b.textContent?.includes('Reabrir chamado'));
    }

    it('mostra o botão "Reabrir chamado" pra um chamado Resolvido/Fechado/Cancelado', async () => {
      detailStoreFake.ticket.set({ ...ticket, status: TicketStatus.Canceled });
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(findReopenButton(fixture)).toBeTruthy();
    });

    it('não mostra o botão "Reabrir chamado" pra um chamado ativo', async () => {
      detailStoreFake.ticket.set({ ...ticket, status: TicketStatus.Open });
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(findReopenButton(fixture)).toBeFalsy();
    });

    it('reabre o chamado, mostra um toast e recarrega o histórico em caso de sucesso', async () => {
      detailStoreFake.ticket.set({ ...ticket, status: TicketStatus.Resolved });
      detailStoreFake.reopen.and.callFake((_id: string, onSuccess?: () => void) => onSuccess?.());
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      findReopenButton(fixture)!.click();

      expect(detailStoreFake.reopen).toHaveBeenCalledWith('t1', jasmine.any(Function));
      expect(toastServiceFake.show).toHaveBeenCalledWith('Chamado reaberto.');
      expect(historyStoreFake.reload).toHaveBeenCalled();
    });
  });

  describe('painel de SLA', () => {
    it('mostra os dois cartões (Primeira resposta e Resolução) de um chamado novo', async () => {
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      const text = fixture.nativeElement.textContent;
      expect(text).toContain('Primeira resposta');
      expect(text).toContain('Resolução');
      expect(text).toContain('Padrão · Expediente');
      expect(text).toContain('30 min consumidos / 30 min restantes (úteis)');
      expect(text).toContain('30 min consumidos / 450 min restantes (úteis)');
    });

    it('mostra o selo "Legado (horas corridas)" e "Sem meta de primeira resposta" num chamado legado', async () => {
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

    it('mostra o ciclo vigente e a área "Ciclos anteriores" num chamado reaberto', async () => {
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

    it('mostra os 7 estados de objetivo com o rótulo e o badge certos', async () => {
      const statesAndBadges: [TicketSlaObjectiveState, string, string][] = [
        [TicketSlaObjectiveState.Running, 'Em andamento', 'bg-label-success'],
        [TicketSlaObjectiveState.AtRisk, 'Em risco', 'bg-label-warning'],
        [TicketSlaObjectiveState.Breached, 'Violado', 'bg-label-danger'],
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

    it('usa serverNowUtc (hora do servidor), não o relógio local, pro prazo relativo do objetivo', async () => {
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

    it('não mostra o painel quando não há sla (ainda carregando, por exemplo)', async () => {
      detailStoreFake.sla.set(null);
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(fixture.nativeElement.textContent).not.toContain('Padrão · Expediente');
    });
  });

  describe('mensagens', () => {
    it('carrega as mensagens do ticket ao inicializar', async () => {
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(messagesStoreFake.loadForTicket).toHaveBeenCalledWith('t1');
    });

    it('mostra as mensagens carregadas, com autor e data', async () => {
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      const text = fixture.nativeElement.textContent;
      expect(text).toContain('Já verifiquei, aguardando peça.');
      expect(text).toContain('Maria Souza'); // authorUserId 'u1' == ticket.openedByUserId
    });

    it('resolve o nome do autor: "Você" quando é o usuário logado', async () => {
      messagesStoreFake.messages.set([{ ...message, authorUserId: 'viewer-1' }]);
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(fixture.nativeElement.textContent).toContain('Você');
    });

    it('resolve o nome do autor pelo responsável atual do chamado', async () => {
      detailStoreFake.ticket.set({ ...ticket, assignedToUserId: 'u2', assignedToName: 'João Pedro' });
      messagesStoreFake.messages.set([{ ...message, authorUserId: 'u2' }]);
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(fixture.nativeElement.textContent).toContain('João Pedro');
    });

    it('usa "Equipe" como rótulo genérico quando o autor não é o solicitante, o responsável, nem o usuário logado', async () => {
      messagesStoreFake.messages.set([{ ...message, authorUserId: 'outro-admin' }]);
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(fixture.nativeElement.textContent).toContain('Equipe');
    });

    it('mostra "(editada)" quando a mensagem tem editedAtUtc', async () => {
      messagesStoreFake.messages.set([{ ...message, editedAtUtc: '2026-01-01T13:00:00Z' }]);
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(fixture.nativeElement.textContent).toContain('(editada)');
    });

    it('mostra uma mensagem quando não há nenhuma ainda', async () => {
      messagesStoreFake.messages.set([]);
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(fixture.nativeElement.textContent).toContain('Nenhuma mensagem ainda.');
    });

    it('envia a nova mensagem, limpa a caixa e recarrega o histórico em caso de sucesso', async () => {
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

    it('não atualiza o SLA quando a publicação falhar (post sem chamar onSuccess)', async () => {
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();
      fixture.componentInstance.newMessageContent.set('Resolvido, pode confirmar.');

      fixture.componentInstance.onSendMessage();

      expect(messagesStoreFake.post).toHaveBeenCalled();
      expect(detailStoreFake.refreshSla).not.toHaveBeenCalled();
    });

    it('não envia uma mensagem vazia (só espaços)', async () => {
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();
      fixture.componentInstance.newMessageContent.set('   ');

      fixture.componentInstance.onSendMessage();

      expect(messagesStoreFake.post).not.toHaveBeenCalled();
    });

    it('mostra o botão "Editar" só pra quem escreveu a mensagem', async () => {
      messagesStoreFake.messages.set([{ ...message, authorUserId: 'viewer-1' }]);
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(fixture.nativeElement.querySelector('button[aria-label="Editar mensagem"]')).toBeTruthy();
    });

    it('não mostra o botão "Editar" pra quem não escreveu a mensagem', async () => {
      messagesStoreFake.messages.set([{ ...message, authorUserId: 'outro-admin' }]);
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(fixture.nativeElement.querySelector('button[aria-label="Editar mensagem"]')).toBeFalsy();
    });

    it('mostra o botão "Excluir" pra quem tem tickets:manage, mesmo não sendo o autor', async () => {
      sessionServiceFake.hasPermission.and.returnValue(true);
      messagesStoreFake.messages.set([{ ...message, authorUserId: 'outro-admin' }]);
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(fixture.nativeElement.querySelector('button[aria-label="Excluir mensagem"]')).toBeTruthy();
    });

    it('não mostra o botão "Excluir" sem ser o autor nem ter tickets:manage', async () => {
      sessionServiceFake.hasPermission.and.returnValue(false);
      messagesStoreFake.messages.set([{ ...message, authorUserId: 'outro-admin' }]);
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(fixture.nativeElement.querySelector('button[aria-label="Excluir mensagem"]')).toBeFalsy();
    });

    it('edita a mensagem inline e salva, recarregando o histórico em caso de sucesso', async () => {
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

    it('cancela a edição inline sem salvar', async () => {
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();
      fixture.componentInstance.onStartEdit(message);

      fixture.componentInstance.onCancelEdit();

      expect(fixture.componentInstance.editingMessageId()).toBeNull();
      expect(messagesStoreFake.editMessage).not.toHaveBeenCalled();
    });

    it('pede confirmação e exclui a mensagem, recarregando o histórico em caso de sucesso', async () => {
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

    it('não exclui a mensagem quando a confirmação for cancelada', async () => {
      confirmDialogServiceFake.confirm.and.returnValue(of(false));
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      fixture.componentInstance.onDeleteMessage('m1');

      expect(messagesStoreFake.deleteMessage).not.toHaveBeenCalled();
    });

    it('mostra o botão de carregar mais mensagens só quando há mais páginas, e carrega ao clicar', async () => {
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

    it('mostra a mensagem de erro de publicação do store', async () => {
      messagesStoreFake.postError.set('Você não tem permissão para enviar mensagens neste chamado.');
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(fixture.nativeElement.textContent).toContain('Você não tem permissão para enviar mensagens neste chamado.');
    });
  });

  describe('histórico', () => {
    it('mostra os eventos carregados', async () => {
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(fixture.nativeElement.textContent).toContain('Chamado criado');
    });

    it('mostra uma mensagem quando não há eventos', async () => {
      historyStoreFake.entries.set([]);
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(fixture.nativeElement.textContent).toContain('Nenhum evento registrado ainda.');
    });

    it('mostra um spinner enquanto o histórico carrega', async () => {
      historyStoreFake.state.set({ loading: true, error: null });
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(fixture.nativeElement.querySelectorAll('.spinner-border').length).toBeGreaterThan(0);
    });

    it('mostra o botão de carregar mais eventos só quando há mais páginas, e carrega ao clicar', async () => {
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

    it('mostra a mensagem de erro do histórico quando o carregamento falhar', async () => {
      historyStoreFake.state.set({ loading: false, error: 'Erro ao carregar o histórico' });
      const fixture = TestBed.createComponent(TicketDetailComponent);
      await fixture.whenStable();

      expect(fixture.nativeElement.textContent).toContain('Erro ao carregar o histórico');
    });
  });
});
