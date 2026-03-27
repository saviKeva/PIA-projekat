import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { ProfilClanMrezeComponent } from './profil_clan_mreze/profil_clan_mreze.component';
import { MenadzerProfilComponent } from './menadzer-profil/menadzer_profil.component';
import { AdminComponent } from './admin/admin.component';
import { AdminLoginComponent } from './admin-login/admin-login.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { PocetnaComponent } from './pocetna/pocetna.component';
import { DetaljiComponent } from './detalji/detalji.component';
import { ClanMrezeComponent } from './clan-mreze/clan-mreze.component';
import { PretragaIRezervacijaComponent } from './pretraga-i-rezervacija/pretraga-i-rezervacija.component';
import { DetaljiPretragaComponent } from './detalji-pretraga/detalji-pretraga.component';
import { MenadzerComponent } from './menadzer/menadzer.component';
import { MenadzerProstoriComponent } from './menadzer-prostori/menadzer-prostori.component';
import { MenadzerRezervacijeComponent } from './menadzer-rezervacije/menadzer-rezervacije.component';
import { MenadzerKalendarComponent } from './menadzer-kalendar/menadzer-kalendar.component';
import { MenadzerIzvestajComponent } from './menadzer-izvestaj/menadzer-izvestaj.component';
import { AdminUsersComponent } from './admin-users/admin-users.component';
import { AdminProstoriComponent } from './admin-prostori/admin-prostori.component';
import { AdminStatistikaComponent } from './admin-statistika/admin-statistika.component';
import { AdminAllUsersComponent } from './admin-all-users/admin-all-users.component';
import { AdminUpdateUserComponent } from './admin-update-user/admin-update-user.component';

export const routes: Routes = [
  { path: "", component: PocetnaComponent },
  { path: "pocetna", component: PocetnaComponent },
  { path: "login", component: LoginComponent },
  { path: "register", component: RegisterComponent },
  { path: "admin-login", component: AdminLoginComponent },
  { path: "forgot-password", component: ForgotPasswordComponent },
  { path: "reset-password/:token", component: ResetPasswordComponent },
  { path: "detalji/:id", component: DetaljiComponent },
  // STRUKTURA ZA ČLANA MREŽE (Sa Navbarom koji uvek ostaje)
  {
    path: "clanMreze",
    component: ClanMrezeComponent,
    children: [
      // profil - prva stanica
      { path: "", redirectTo: "profil", pathMatch: "full" },
      { path: "profil", component: ProfilClanMrezeComponent },
      { path: "pretraga", component: PretragaIRezervacijaComponent },
      { path: "detaljiPretraga/:id", component: DetaljiPretragaComponent }
    ]
  },
  {
    path:"menadzer",
    component: MenadzerComponent,
    children:[
      //profil je prva stranica
      {path:"", redirectTo:"profil",pathMatch:"full"},
      {path:"profil", component: MenadzerProfilComponent},
      {path:"prostori", component:MenadzerProstoriComponent},
      {path:"rezervacije",component:MenadzerRezervacijeComponent},
      {path:"kalendar", component:MenadzerKalendarComponent},
      {path:"izvestaj", component:MenadzerIzvestajComponent}
    ]
  },

  // OSTALI

  { path: "admin", component: AdminComponent, children:[
    {path:"", redirectTo:"admin-users",pathMatch:'full'},
    {path:"admin-users",component:AdminUsersComponent},
    {path:"admin-prostori", component:AdminProstoriComponent},
    {path:"admin-statistika",component:AdminStatistikaComponent},
    {path:"admin-allUsers", component:AdminAllUsersComponent},
    {path:"admin-updateUser/:kor_ime",component:AdminUpdateUserComponent}
  ] },

  //wildcard ruta - ako neko ukuca nepostojeću adresu, vratim ga na početnu
  { path: "**", redirectTo: "" },

];
