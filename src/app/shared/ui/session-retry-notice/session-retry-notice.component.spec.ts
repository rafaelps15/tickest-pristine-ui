import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { SessionRetryNoticeComponent } from './session-retry-notice.component';

describe('SessionRetryNoticeComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionRetryNoticeComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();
  });

  /** Cria o aviso desligado, já desenhado. */
  async function render() {
    const fixture = TestBed.createComponent(SessionRetryNoticeComponent);
    await fixture.whenStable();
    return fixture;
  }

  it('keeps an empty live region in the DOM while the notice is off', async () => {
    const fixture = await render();
    const host = fixture.nativeElement as HTMLElement;

    const region = host.querySelector('[role="status"]');
    expect(region).toBeTruthy();
    expect(region?.textContent?.trim()).toBe('');
    expect(host.classList).not.toContain('is-active');
  });

  it('fills the same live region and covers the screen when the notice is turned on', async () => {
    const fixture = await render();
    const host = fixture.nativeElement as HTMLElement;
    const region = host.querySelector('[role="status"]');

    fixture.componentRef.setInput('active', true);
    await fixture.whenStable();

    expect(host.querySelector('[role="status"]')).toBe(region);
    expect(region?.textContent).toContain('Conectando ao servidor');
    expect(host.classList).toContain('is-active');
  });

  it('empties the live region again when the notice is turned off', async () => {
    const fixture = await render();
    const host = fixture.nativeElement as HTMLElement;
    fixture.componentRef.setInput('active', true);
    await fixture.whenStable();

    fixture.componentRef.setInput('active', false);
    await fixture.whenStable();

    expect(host.querySelector('[role="status"]')?.textContent?.trim()).toBe('');
    expect(host.classList).not.toContain('is-active');
  });
});
