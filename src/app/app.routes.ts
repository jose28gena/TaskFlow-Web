import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'tasks' },
  {
    path: 'login',
    title: 'Iniciar sesión · TaskFlow',
    loadComponent: () => import('./features/login/login.component').then((m) => m.LoginComponent)
  },
  {
    path: 'tasks',
    title: 'Mis tareas · TaskFlow',
    canActivate: [authGuard],
    loadComponent: () => import('./features/tasks/tasks.component').then((m) => m.TasksComponent)
  },
  { path: '**', redirectTo: 'tasks' }
];
