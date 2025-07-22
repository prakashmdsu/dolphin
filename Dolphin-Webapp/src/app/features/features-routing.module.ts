import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { BillingComponent } from './billing/billing.component';
import { ReportsComponent } from './reports/reports.component';
import { LayoutComponent } from './layout/layout.component';
import { StockgraniteblockComponent } from './stockgraniteblock/stockgraniteblock.component';
import { GranitestocksComponent } from './granitestocks/granitestocks.component';
import { AddclientComponent } from './addclient/addclient.component';
import { BillingSummaryComponent } from './billing-summary/billing-summary.component';

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
        path: 'stockentry',
        component: StockgraniteblockComponent,
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
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FeaturesRoutingModule {}
