import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ToastContainerComponent } from './toast-container.component';
import { ToastService } from '../../services/toast.service';

describe('ToastContainerComponent', () => {
  let toastService: ToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToastContainerComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();
    toastService = TestBed.inject(ToastService);
  });

  it('renders the toast message, with no action button when there is no action', async () => {
    const fixture = TestBed.createComponent(ToastContainerComponent);
    toastService.show('Cadastro concluído.');
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Cadastro concluído.');
    expect(fixture.nativeElement.querySelector('.toast-action')).toBeNull();
  });

  it('shows the action button and, on click, runs the action and closes the toast', async () => {
    const run = jasmine.createSpy('run');
    const fixture = TestBed.createComponent(ToastContainerComponent);
    toastService.show('Acesso desativado.', 'success', { label: 'Desfazer', run });
    await fixture.whenStable();

    const action = fixture.nativeElement.querySelector('.toast-action') as HTMLButtonElement;
    expect(action.textContent?.trim()).toBe('Desfazer');
    action.click();
    await fixture.whenStable();

    expect(run).toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('.toast')).toBeNull();
  });

  it('closes the toast via the X without running the action', async () => {
    const run = jasmine.createSpy('run');
    const fixture = TestBed.createComponent(ToastContainerComponent);
    toastService.show('Acesso desativado.', 'success', { label: 'Desfazer', run });
    await fixture.whenStable();

    (fixture.nativeElement.querySelector('.btn-close') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(run).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('.toast')).toBeNull();
  });
});
