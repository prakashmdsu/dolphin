// app/features/features-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { BillingComponent } from './billing/billing.component';
import { ReportsComponent } from './reports/reports.component';
import { LayoutComponent } from './layout/layout.component';
import { StockgraniteblockComponent } from './addstockgraniteblock/stockgraniteblock.component';
import { GranitestocksComponent } from './granitestockslist/granitestocks.component';
import { AddclientComponent } from './addclient/addclient.component';
import { BillingSummaryComponent } from './billing-summary/billing-summary.component';
import { AuthGuard } from '../shared/auth.guard';
import { roleGuard } from '../shared/role.guard';

const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    canActivate: [AuthGuard],
    children: [
      // Admin & SuperAdmin only
      {
        path: 'dashboard',
        component: DashboardComponent,
        canActivate: [roleGuard(['admin', 'superadmin'])],
      },
      // Admin & SuperAdmin only
      {
        path: 'billing',
        component: BillingComponent,
        canActivate: [roleGuard(['admin', 'superadmin'])],
      },
      // Admin & SuperAdmin only
      {
        path: 'reports',
        component: ReportsComponent,
        canActivate: [roleGuard(['member', 'admin', 'superadmin'])],
      },
      // All roles can access (member, admin, superadmin)
      {
        path: 'granitestocks',
        component: GranitestocksComponent,
        canActivate: [roleGuard(['member', 'admin', 'superadmin'])],
      },
      // SuperAdmin only
      {
        path: 'addclient',
        component: AddclientComponent,
        canActivate: [roleGuard(['superadmin'])],
      },
      // Admin & SuperAdmin only
      {
        path: 'summary',
        component: BillingSummaryComponent,
        canActivate: [roleGuard(['admin', 'superadmin'])],
      },
      // Default redirect based on role handled in component
      {
        path: '',
        redirectTo: 'granitestocks',
        pathMatch: 'full',
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FeaturesRoutingModule {}
