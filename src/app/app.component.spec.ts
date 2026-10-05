import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { AppComponent } from './app.component';
import { AuthService } from './core/auth.service';

describe('AppComponent', () => {
  const email = signal<string | null>(null);
  const logout = jasmine.createSpy('logout');

  beforeEach(() => {
    email.set(null);
    logout.calls.reset();
    TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: { email, logout } }]
    });
  });

  it('muestra la marca y oculta la sesión cuando no hay usuario', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('.brand')?.textContent).toBe('TaskFlow');
    expect(el.querySelector('.session')).toBeNull();
  });

  it('muestra el correo y permite cerrar sesión', () => {
    email.set('ana@test.com');
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('.session')?.textContent).toContain('ana@test.com');

    (el.querySelector('.session button') as HTMLButtonElement).click();

    expect(logout).toHaveBeenCalled();
  });
});
