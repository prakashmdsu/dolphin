import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardComponent } from './dashboard/dashboard.component';
import { BillingComponent } from './billing/billing.component';
import { ReportsComponent } from './reports/reports.component';
import { FeaturesRoutingModule } from './features-routing.module';
import { LayoutComponent } from './layout/layout.component';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatTableModule } from '@angular/material/table';
import { MatOptionModule } from '@angular/material/core'; // sometimes needed explicitly
import { MatTooltipModule } from '@angular/material/tooltip';
import { StockgraniteblockComponent } from './stockgraniteblock/stockgraniteblock.component';
import { HttpService } from './shared/http-serve.service';
import { GranitestocksComponent } from './granitestocks/granitestocks.component';
import { AddclientComponent } from './addclient/addclient.component';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatChipsModule } from '@angular/material/chips';
import { NavbarComponent } from './navbar/navbar.component';
import { BillingSummaryComponent } from './billing-summary/billing-summary.component';
import { MatDialogModule } from '@angular/material/dialog';
@NgModule({
  declarations: [
    LayoutComponent,
    DashboardComponent,
    BillingComponent,
    ReportsComponent,
    StockgraniteblockComponent,
    GranitestocksComponent,
    AddclientComponent,
    NavbarComponent,
    BillingSummaryComponent,
  ],
  providers: [HttpService],
  imports: [
    CommonModule,
    FeaturesRoutingModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatDialogModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatCardModule,
    MatDividerModule,
    MatTableModule,
    MatOptionModule,
    MatTooltipModule,
    MatPaginatorModule,
    MatChipsModule,
  ],
})
export class FeaturesModule {}
