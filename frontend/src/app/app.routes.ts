import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Home } from './pages/home/home';
import { authGuard } from './guards/auth.guard';
import { guestGuard } from './guards/guest.guard';
import { adminGuard } from './guards/admin.guard';
import { Dashboard } from './pages/dashboard/dashboard';
import { Recarga } from './pages/recarga/recarga';
import { Pix } from './pages/pix/pix';
import { UserCreate } from './pages/user-create/user-create';
import { UserList } from './pages/user-list/user-list';
import { Operators } from './pages/operators/operators';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: Login, canActivate: [guestGuard] },
  { path: 'home', component: Home, canActivate: [authGuard], children: [
    { path: '', component: Dashboard },
    { path: 'recarga', component: Recarga },
    { path: 'pix', component: Pix },
    { path: 'usuarios/novo', component: UserCreate, canActivate: [adminGuard] },
    { path: 'usuarios', component: UserList, canActivate: [adminGuard] },
    { path: 'operadores', component: Operators, canActivate: [adminGuard] },
  ] },
  { path: '**', redirectTo: 'login' },
];
