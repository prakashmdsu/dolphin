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

const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      {
        path: 'dashboard',
        component: DashboardComponent,
      },
      {
        path: 'billing',
        component: BillingComponent,
      },

      {
        path: 'reports',
        component: ReportsComponent,
      },
      {
        path: 'granitestocks',
        component: GranitestocksComponent,
      },
      {
        path: 'addclient',
        component: AddclientComponent,
      },
      {
        path: 'summary',
        component: BillingSummaryComponent,
      },
    ],
    canActivate: [AuthGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FeaturesRoutingModule {}
