import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { HttpService } from '../shared/http-serve.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { GraniteBlock } from '../shared/GraniteBlock';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

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
  displayedColumns: string[] = [
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
  ];

  dataSource = new MatTableDataSource<GraniteBlock>([]);
  totalItems = 0;
  pageSize = 10;
  pageIndex = 0;
  isLoading = false;
  showAdvancedFilters = false;

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
  });

  // Options for dropdowns
  statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'UnBilled', label: 'UnBilled' },
    { value: 'Billed', label: 'Billed' },
    // { value: 'Sold', label: 'Sold' },
    // { value: 'Reserved', label: 'Reserved' },
  ];

  pitOptions = [1, 2, 3, 4, 5]; // Add your pit options
  gradeOptions = ['A', 'B', 'C', 'D']; // Add your grade options

  @ViewChild(MatSort) sort!: MatSort;

  constructor(private httpService: HttpService) {}

  totals = { totalQuarryCbm: 0, totalDmgTonnage: 0, totalNetCbm: 0 };

  ngOnInit() {
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
  }

  private setupFilterSubscriptions() {
    // Subscribe to form changes with debounce
    this.filterForm.valueChanges
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe(() => {
        this.pageIndex = 0; // Reset to first page when filters change
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

    // Add all filter parameters
    if (filters.blockNo) params.blockNo = filters.blockNo;
    if (filters.status !== '') params.status = filters.status;
    if (filters.startDate)
      params.startDate = new Date(filters.startDate).toISOString();
    if (filters.endDate)
      params.endDate = new Date(filters.endDate).toISOString();
    if (filters.pitNo) params.pitNo = filters.pitNo;
    if (filters.grade) params.grade = filters.grade;
    if (filters.minCbm) params.minCbm = filters.minCbm;
    if (filters.maxCbm) params.maxCbm = filters.maxCbm;

    this.httpService
      .getFilteroption<ApiResponse>('dolphin/getgranitesblockscategory', {
        params,
      })
      .subscribe({
        next: (response) => {
          const enhancedData = response.data.map((block) => {
            const { quarryCbm, dmgTonnage, netCbm } =
              this.calculateDerivedFields(block.measurement);
            return {
              ...block,
              quarryCbm,
              dmgTonnage,
              netCbm,
            };
          });

          this.dataSource.data = enhancedData;
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

  // UI helper methods
  toggleAdvancedFilters(): void {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  refreshData(): void {
    this.loadData();
  }

  exportData(): void {
    // Implement export functionality
    console.log('Export data functionality to be implemented');
  }

  getStatusIcon(status: string): string {
    switch (status?.toLowerCase()) {
      case 'billing':
        return 'receipt';
      case 'sold':
        return 'check_circle';
      case 'reserved':
        return 'bookmark';
      default:
        return 'help';
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
    // Reset to default date range
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

    const quarryCbm = +((lg * wd * ht) / 1000000).toFixed(4); // m³
    const dmgTonnage = +(quarryCbm * 2.85).toFixed(4); // example factor
    const netCbm = +(dmgTonnage / 6.5).toFixed(4); // example factor

    return { quarryCbm, dmgTonnage, netCbm };
  }
}
