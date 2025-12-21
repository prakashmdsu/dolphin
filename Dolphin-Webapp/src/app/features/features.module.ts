import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardComponent } from './dashboard/dashboard.component';
import { BillingComponent } from './billing/billing.component';
import { ReportsComponent } from './reports/reports.component';
import { FeaturesRoutingModule } from './features-routing.module';
import { LayoutComponent } from './layout/layout.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon'; // Make sure this is imported
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatTableModule } from '@angular/material/table';
import { MatOptionModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { StockgraniteblockComponent } from './addstockgraniteblock/stockgraniteblock.component';
import { GranitestocksComponent } from './granitestockslist/granitestocks.component';
import { AddclientComponent } from './addclient/addclient.component';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatChipsModule } from '@angular/material/chips';
import { NavbarComponent } from './navbar/navbar.component';
import { BillingSummaryComponent } from './billing-summary/billing-summary.component';
import { MatDialogModule } from '@angular/material/dialog';
import { UpdategraniteBlockStatusComponent } from './updategranite-block-status/updategranite-block-status.component';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio'; // Add this for radio buttons
import { MatMenuModule } from '@angular/material/menu'; // Add this for menu

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
    UpdategraniteBlockStatusComponent,
  ],
  imports: [
    CommonModule,
    FeaturesRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatDialogModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule, // This is required for mat-icon
    MatToolbarModule,
    MatCardModule,
    MatDividerModule,
    MatTableModule,
    MatOptionModule,
    MatTooltipModule,
    MatPaginatorModule,
    MatChipsModule,
    MatCheckboxModule,
    MatRadioModule, // Add this
    MatMenuModule, // Add this
  ],
})
export class FeaturesModule {}
