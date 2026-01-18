import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { HttpService } from '../../shared/http-serve.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { GraniteBlock } from '../shared/GraniteBlock';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import {
  DialogData,
  StockgraniteblockComponent,
} from '../addstockgraniteblock/stockgraniteblock.component';
import { DispatchStatus } from '../../shared/enum/stausenum';
import { UpdategraniteBlockStatusComponent } from '../updategranite-block-status/updategranite-block-status.component';
import { AuthService } from '../../shared/auth.service';

interface ApiResponse {
  data: GraniteBlock[];
  totalCount: number;
}

@Component({
  selector: 'app-granitestocks',
  standalone: false,
  templateUrl: './granitestocks.component.html',
  styleUrls: ['./granitestocks.component.scss'],
})
export class GranitestocksComponent implements OnInit {
  dispatchStatus = DispatchStatus;
  dispatchStatusKeys: { key: number; label: string }[] = [];
  displayedColumns: string[] = [];

  dataSource = new MatTableDataSource<GraniteBlock>([]);
  totalItems = 0;
  pageSize = 10;
  pageIndex = 0;
  isLoading = false;
  showAdvancedFilters = false;

  // Role-based access
  isMember: boolean = false;
  isAdmin: boolean = false;
  isSuperAdmin: boolean = false;

  // Filter form with additional fields
  filterForm = new FormGroup({
    blockNo: new FormControl(''),
    status: new FormControl(''),
    startDate: new FormControl(''),
    endDate: new FormControl(''),
    pitNo: new FormControl(''),
    grade: new FormControl(''),
    minCbm: new FormControl(''),
    maxCbm: new FormControl(''),
    advancedTick: new FormControl(false),
    minLg: new FormControl(''),
    minWd: new FormControl(''),
    minHt: new FormControl(''),
  });

  showMeasurementFilters = false;

  // Options for dropdowns
  statusOptions = [
    { value: DispatchStatus.ReadyForDispatch, label: 'Ready For Dispatch' },
    { value: DispatchStatus.LoadedOnTruck, label: 'Loaded On Truck' },
    { value: DispatchStatus.AtPort, label: 'At Port' },
    { value: DispatchStatus.Shipped, label: 'Shipped' },
    { value: DispatchStatus.Cancelled, label: 'Cancelled' },
    {
      value: DispatchStatus.InspectionCompleted,
      label: 'Inspection completed',
    },
  ];
  pitOptions = [1, 2, 3, 4, 5];
  gradeOptions = ['A', 'B', 'C', 'D'];

  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private httpService: HttpService,
    private dialog: MatDialog,
    private authService: AuthService
  ) {
    // Set role flags
    const userRole = this.authService.getUserRole();
    this.isMember = userRole === 'member';
    this.isAdmin = userRole === 'admin';
    this.isSuperAdmin = userRole === 'superadmin';

    // Set displayed columns based on role
    this.setDisplayedColumns();
  }

  totals = { totalQuarryCbm: 0, totalDmgTonnage: 0, totalNetCbm: 0 };

  ngOnInit() {
    this.dispatchStatusKeys = Object.keys(this.dispatchStatus)
      .filter((key) => !isNaN(Number(key)))
      .map((key) => {
        const value = Number(key);
        return {
          key: value,
          label: DispatchStatus[value],
        };
      });

    // Set default date range (last month)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);

    this.filterForm.patchValue({
      startDate: this.formatDateForInput(startDate),
      endDate: this.formatDateForInput(endDate),
    });

    this.loadData();
    this.setupFilterSubscriptions();

    this.filterForm.get('advancedTick')?.valueChanges.subscribe((value) => {
      this.showMeasurementFilters = !!value;
      if (!value) {
        this.filterForm.patchValue({
          minLg: '',
          minWd: '',
          minHt: '',
        });
      }
    });
  }
private setDisplayedColumns(): void {
  if (this.isMember) {
    // Member sees limited columns - add actions column
    this.displayedColumns = [
      'date',
      'pitNo',
      'blockNo',
      'categoryGrade',
      'measurement',
      'dmgTonnage',
      'status',
      'note',
      'actions',  // Add actions column for member
    ];
  } else if (this.isAdmin) {
    // Admin sees more columns including actions
    this.displayedColumns = [
      'date',
      'pitNo',
      'blockNo',
      'buyerBlockNo',
      'categoryGrade',
      'measurement',
      'quarryCbm',
      'dmgTonnage',
      'netCbm',
      'status',
      'note',
      'actions',
    ];
  } else if (this.isSuperAdmin) {
    // SuperAdmin sees all columns including actions
    this.displayedColumns = [
      'date',
      'pitNo',
      'blockNo',
      'buyerBlockNo',
      'categoryGrade',
      'measurement',
      'quarryCbm',
      'dmgTonnage',
      'netCbm',
      'status',
      'note',
      'actions',
    ];
  }
}
canEditBlock(block: GraniteBlock): boolean {
  const status = typeof block.status === 'string' 
    ? parseInt(block.status) 
    : block.status;
  
  return status === DispatchStatus.ReadyForDispatch;
}
  onEditBlock(block: GraniteBlock): void {
    // Fetch full block details using blockId
    this.httpService.get<any>(`dolphin/getgraniteblock/${block.id}`).subscribe({
      next: (response) => {
        const blockDetails = response.data || response;

        const dialogRef = this.dialog.open(StockgraniteblockComponent, {
          width: '800px',
          maxWidth: '90vw',
          disableClose: true,
          data: {
            mode: 'edit',
            block: blockDetails,
          } as DialogData,
        });

        dialogRef.afterClosed().subscribe((result) => {
          if (result) {
            console.log('Block updated:', result);
            this.loadData(); // Refresh the list
          }
        });
      },
      error: (error) => {
        console.error('Error fetching block details:', error);
        // Optionally show a snackbar/toast error message
      },
    });
  }
  private setupFilterSubscriptions() {
    this.filterForm.valueChanges
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe(() => {
        this.pageIndex = 0;
        this.loadData();
      });
  }

  loadData(): void {
    this.isLoading = true;
    const filters = this.filterForm.value;

    const params: any = {
      pageNumber: this.pageIndex + 1,
      pageSize: this.pageSize,
    };

    // Basic filter parameters (all roles)
    if (filters.blockNo) params.blockNo = filters.blockNo;
    if (filters.status !== '') params.status = filters.status;
    if (filters.startDate)
      params.startDate = new Date(filters.startDate).toISOString();
    if (filters.endDate)
      params.endDate = new Date(filters.endDate).toISOString();

    // Advanced filter parameters (SuperAdmin only)
    if (this.isSuperAdmin) {
      if (filters.pitNo) params.pitNo = filters.pitNo;
      if (filters.grade) params.grade = filters.grade;
      if (filters.minCbm) params.minCbm = filters.minCbm;
      if (filters.maxCbm) params.maxCbm = filters.maxCbm;

      if (filters.advancedTick) {
        params.advancedTick = true;
        if (filters.minLg) params.minLg = Number(filters.minLg);
        if (filters.minWd) params.minWd = Number(filters.minWd);
        if (filters.minHt) params.minHt = Number(filters.minHt);
      }
    }

    this.httpService
      .getFilteroption<any>('dolphin/getgranitesblockscategory', { params })
      .subscribe({
        next: (response) => {
          this.dataSource.data = response.data;
          this.totalItems = response.totalCount;
          this.totals = this.calculateTotals();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading data:', error);
          this.isLoading = false;
        },
      });
  }

  // Toggle advanced filters - only for superadmin
  toggleAdvancedFilters(): void {
    if (this.isSuperAdmin) {
      this.showAdvancedFilters = !this.showAdvancedFilters;
    }
  }

  // Pagination methods
  getTotalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize);
  }

  getStartIndex(): number {
    return this.pageIndex * this.pageSize + 1;
  }

  getEndIndex(): number {
    const endIndex = (this.pageIndex + 1) * this.pageSize;
    return endIndex > this.totalItems ? this.totalItems : endIndex;
  }

  goToFirstPage(): void {
    this.pageIndex = 0;
    this.loadData();
  }

  goToPreviousPage(): void {
    if (this.pageIndex > 0) {
      this.pageIndex--;
      this.loadData();
    }
  }

  goToNextPage(): void {
    if (this.pageIndex < this.getTotalPages() - 1) {
      this.pageIndex++;
      this.loadData();
    }
  }

  goToLastPage(): void {
    this.pageIndex = this.getTotalPages() - 1;
    this.loadData();
  }

  goToPage(pageIndex: number): void {
    this.pageIndex = pageIndex;
    this.loadData();
  }

  changePageSize(newPageSize: number): void {
    this.pageSize = newPageSize;
    this.pageIndex = 0;
    this.loadData();
  }

  getVisiblePages(): (number | string)[] {
    const totalPages = this.getTotalPages();
    const currentPage = this.pageIndex + 1;
    const visiblePages: (number | string)[] = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        visiblePages.push(i);
      }
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) {
          visiblePages.push(i);
        }
        visiblePages.push('...');
        visiblePages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        visiblePages.push(1);
        visiblePages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          visiblePages.push(i);
        }
      } else {
        visiblePages.push(1);
        visiblePages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          visiblePages.push(i);
        }
        visiblePages.push('...');
        visiblePages.push(totalPages);
      }
    }

    return visiblePages;
  }

  refreshData(): void {
    this.loadData();
  }

  exportData(): void {
    console.log('Export data functionality to be implemented');
  }

  getStatusIcon(status: number | string): string {
    const statusNum = typeof status === 'string' ? parseInt(status) : status;

    switch (statusNum) {
      case DispatchStatus.ReadyForDispatch:
        return 'inventory';
      case DispatchStatus.LoadedOnTruck:
        return 'local_shipping';
      case DispatchStatus.AtPort:
        return 'anchor';
      case DispatchStatus.Shipped:
        return 'sailing';
      case DispatchStatus.Cancelled:
        return 'cancel';
      default:
        return 'help';
    }
  }

  getStatusLabel(status: number | string): string {
    const statusNum = typeof status === 'string' ? parseInt(status) : status;
    return DispatchStatus[statusNum] || 'Unknown';
  }

  getStatusClass(status: number | string): string {
    const statusNum = typeof status === 'string' ? parseInt(status) : status;

    switch (statusNum) {
      case DispatchStatus.ReadyForDispatch:
        return 'status-ready';
      case DispatchStatus.LoadedOnTruck:
        return 'status-loaded';
      case DispatchStatus.AtPort:
        return 'status-port';
      case DispatchStatus.Shipped:
        return 'status-shipped';
      case DispatchStatus.Cancelled:
        return 'status-cancelled';
      default:
        return 'status-unknown';
    }
  }

  calculateTotals(): {
    totalQuarryCbm: number;
    totalDmgTonnage: number;
    totalNetCbm: number;
  } {
    let totalQuarryCbm = 0;
    let totalDmgTonnage = 0;
    let totalNetCbm = 0;

    this.dataSource.data.forEach((item) => {
      totalQuarryCbm += item.quarryCbm || 0;
      totalDmgTonnage += item.dmgTonnage || 0;
      totalNetCbm += item.netCbm || 0;
    });

    return {
      totalQuarryCbm: +totalQuarryCbm.toFixed(4),
      totalDmgTonnage: +totalDmgTonnage.toFixed(4),
      totalNetCbm: +totalNetCbm.toFixed(4),
    };
  }

  clearFilters(): void {
    this.filterForm.reset();
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);

    this.filterForm.patchValue({
      startDate: this.formatDateForInput(startDate),
      endDate: this.formatDateForInput(endDate),
    });
    this.pageIndex = 0;
  }

  private formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private calculateDerivedFields(measurement: {
    lg: number;
    wd: number;
    ht: number;
  }) {
    const lg = +measurement.lg || 0;
    const wd = +measurement.wd || 0;
    const ht = +measurement.ht || 0;

    const quarryCbm = +((lg * wd * ht) / 1000000).toFixed(4);
    const dmgTonnage = +(quarryCbm * 2.85).toFixed(4);
    const netCbm = +(dmgTonnage / 6.5).toFixed(4);

    return { quarryCbm, dmgTonnage, netCbm };
  }

  openAddBlockDialog(): void {
    const dialogRef = this.dialog.open(StockgraniteblockComponent, {
      width: '800px',
      maxWidth: '90vw',
      disableClose: true,
      data: {
        mode: 'add',
      } as DialogData,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        console.log('Block added:', result);
        this.loadData();
      }
    });
  }

  openUpadateBlockStockStatusDialog(): void {
    const dialogRef = this.dialog.open(UpdategraniteBlockStatusComponent, {
      width: '1000px',
      maxWidth: '90vw',
      disableClose: true,
      data: {
        mode: 'add',
      } as DialogData,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        console.log('Block added:', result);
        this.loadData();
      }
    });
  }

  openEditBlockDialog(block: GraniteBlock): void {
    const dialogRef = this.dialog.open(StockgraniteblockComponent, {
      width: '800px',
      maxWidth: '90vw',
      disableClose: true,
      data: {
        mode: 'edit',
        block: block,
      } as unknown as DialogData,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        console.log('Block updated:', result);
        this.loadData();
      }
    });
  }
}
