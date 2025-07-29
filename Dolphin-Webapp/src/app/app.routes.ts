import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// export const routes: Routes = [];
export const routes: Routes = [
  {
    path: 'features',
    loadChildren: () =>
      import('./features/features.module').then((m) => m.FeaturesModule),
  },
  {
    path: 'login',
    loadChildren: () =>
      import('./login/login.module').then((m) => m.LoginModule),
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' }, // Optional default route
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
