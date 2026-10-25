import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { TicketDetailComponent } from './ticket-detail.component';
import { TicketDetailStore } from '../application/ticket-detail.store';
import { TicketAttachmentsStore } from '../application/ticket-attachments.store';
import { TicketHistoryStore } from '../application/ticket-history.store';
import { TicketDetail } from '../entities/ticket';
import { TicketAttachment } from '../entities/ticket-attachment';
import { TicketHistoryAction, TicketHistoryEntry } from '../entities/ticket-history';
import { TicketPriority } from '../entities/ticket-priority';
import { TicketStatus } from '../entities/ticket-status';
import { TicketSlaStatus } from '../entities/ticket-sla-status';
import { ConfirmDialogService, SessionService, ToastService, setRoleColor } from '../../shared';
import { UserSummary } from '../../users';

const ROLE_COLOR_STORAGE_KEY = 'tickest.roleColors';

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
  const historyEntry: TicketHistoryEntry = {
    id: 'h1', ticketId: 't1', changedByUserId: 'u1',
    action: TicketHistoryAction.Created, description: 'Chamado criado',
    oldValue: null, newValue: null, occurredAtUtc: '2026-01-01T12:00:00Z'
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

  let detailStoreFake: ReturnType<typeof createDetailStoreFake>;
  let attachmentsStoreFake: ReturnType<typeof createAttachmentsStoreFake>;
  let historyStoreFake: ReturnType<typeof createHistoryStoreFake>;
  let confirmDialogServiceFake: { confirm: jasmine.Spy };
  let sessionServiceFake: { hasPermission: jasmine.Spy };
  let toastServiceFake: { show: jasmine.Spy };

  beforeEach(async () => {
    localStorage.removeItem(ROLE_COLOR_STORAGE_KEY);
    detailStoreFake = createDetailStoreFake();
    attachmentsStoreFake = createAttachmentsStoreFake();
    historyStoreFake = createHistoryStoreFake();
    confirmDialogServiceFake = { confirm: jasmine.createSpy('confirm').and.returnValue(of(true)) };
    sessionServiceFake = { hasPermission: jasmine.createSpy('hasPermission').and.returnValue(true) };
    toastServiceFake = { show: jasmine.createSpy('show') };

    await TestBed.configureTestingModule({
      imports: [TicketDetailComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: TicketDetailStore, useValue: detailStoreFake },
        { provide: TicketAttachmentsStore, useValue: attachmentsStoreFake },
        { provide: TicketHistoryStore, useValue: historyStoreFake },
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

    expect(fixture.nativeElement.textContent).not.toContain('Vence em');
    expect(fixture.nativeElement.textContent).not.toContain('Atrasado há');
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
    const deleteButton = fixture.nativeElement.querySelector('button[aria-label^="Excluir"]');
    expect(downloadButton?.getAttribute('aria-label')).toBe('Baixar foto.png');
    expect(deleteButton?.getAttribute('aria-label')).toBe('Excluir foto.png');
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
