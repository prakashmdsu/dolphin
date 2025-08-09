import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { HttpService } from '../../shared/http-serve.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { Invoice } from '../shared/Invoice';
import { FormControl, FormGroup } from '@angular/forms';
import { Subject, debounceTime, takeUntil, distinctUntilChanged } from 'rxjs';

interface ApiResponse {
  data: Invoice[];
  totalCount: number;
}

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
})
export class ReportsComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = [
    'dispatchDate',
    'billTo',
    'gatePassNo',
    'gpType',
    'phone',
    'notes',
    'actions',
  ];

  dataSource = new MatTableDataSource<Invoice>([]);
  isLoading = false;
  totalItems = 0;
  pageSize = 10;
  pageIndex = 0;

  showAdvancedFilters = false;
  private destroy$ = new Subject<void>();

  // Filter form with additional fields
  filterForm = new FormGroup({
    blockNo: new FormControl(''),
    startDate: new FormControl(''),
    endDate: new FormControl(''),
    minCbm: new FormControl(''),
    maxCbm: new FormControl(''),
  });

  @ViewChild(MatSort) sort!: MatSort;

  constructor(private httpService: HttpService) {}

  ngOnInit() {
    this.initializeDateRange();
    this.setupFilterSubscription();
    this.loadData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeDateRange(): void {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);

    this.filterForm.patchValue({
      startDate: this.formatDateForInput(startDate),
      endDate: this.formatDateForInput(endDate),
    });
  }

  private setupFilterSubscription(): void {
    // Subscribe to form changes with debounce to avoid too many API calls
    this.filterForm.valueChanges
      .pipe(
        debounceTime(500), // Wait 500ms after user stops typing
        distinctUntilChanged(
          (prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)
        ),
        takeUntil(this.destroy$)
      )
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
    if (filters.startDate)
      params.startDate = new Date(filters.startDate).toISOString();
    if (filters.endDate)
      params.endDate = new Date(filters.endDate).toISOString();
    if (filters.minCbm) params.minCbm = filters.minCbm;
    if (filters.maxCbm) params.maxCbm = filters.maxCbm;

    this.httpService
      .getFilteroption<ApiResponse>('Dolphin/getallinvoicepaginated', {
        params,
      })
      .subscribe({
        next: (response) => {
          this.dataSource.data = response.data;
          this.totalItems = response.totalCount;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading data:', error);
          this.isLoading = false;
        },
      });
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.initializeDateRange(); // Reset to default date range
    this.pageIndex = 0;
    // loadData() will be called automatically via form subscription
  }

  private formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  // Manual refresh method (for refresh button)
  refreshData(): void {
    this.loadData();
  }

  // Pagination methods
  getTotalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize);
  }

  getStartIndex(): number {
    return this.totalItems === 0 ? 0 : this.pageIndex * this.pageSize + 1;
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
}
