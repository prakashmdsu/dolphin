// addclient.component.ts
import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  TemplateRef,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormControl,
  Validators,
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Sort } from '@angular/material/sort';
import { Subject, debounceTime, takeUntil, distinctUntilChanged } from 'rxjs';
import { trigger, transition, style, animate } from '@angular/animations';
import { Client } from '../shared/Client';
import { HttpService } from '../../shared/http-serve.service';

interface IndianState {
  name: string;
  code: number;
}

@Component({
  selector: 'app-addclient',
  standalone: false,
  templateUrl: './addclient.component.html',
  styleUrls: ['./addclient.component.scss'],
  animations: [
    trigger('slideDown', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-20px)' }),
        animate(
          '300ms ease-out',
          style({ opacity: 1, transform: 'translateY(0)' })
        ),
      ]),
      transition(':leave', [
        animate(
          '300ms ease-in',
          style({ opacity: 0, transform: 'translateY(-20px)' })
        ),
      ]),
    ]),
  ],
})
export class AddclientComponent implements OnInit, OnDestroy {
  // Form states
  clientForm!: FormGroup;
  filterForm!: FormGroup;
  isIndianClient = false;
  isEditMode = false;
  showForm = false;
  isLoading = false;
  isSubmitting = false;

  // Data
  allClients: Client[] = [];
  filteredClients: Client[] = [];
  paginatedClients: Client[] = [];
  selectedClient: Client | null = null;
  editingClientId: string | null = null;

  // Table columns
  displayedColumns: string[] = [
    'clientName',
    'clientType',
    'phone',
    'country',
    'stateName',
    'gstin',
    'address',
    'actions',
  ];

  // Pagination
  pageSize = 10;
  pageIndex = 0;

  // Sort
  currentSort: Sort = { active: '', direction: '' };

  private destroy$ = new Subject<void>();

  @ViewChild('viewDialogTemplate') viewDialogTemplate!: TemplateRef<any>;
  @ViewChild('deleteDialogTemplate') deleteDialogTemplate!: TemplateRef<any>;

  indianStates: IndianState[] = [
    { name: 'Jammu and Kashmir', code: 1 },
    { name: 'Himachal Pradesh', code: 2 },
    { name: 'Punjab', code: 3 },
    { name: 'Chandigarh', code: 4 },
    { name: 'Uttarakhand', code: 5 },
    { name: 'Haryana', code: 6 },
    { name: 'Delhi', code: 7 },
    { name: 'Rajasthan', code: 8 },
    { name: 'Uttar Pradesh', code: 9 },
    { name: 'Bihar', code: 10 },
    { name: 'Sikkim', code: 11 },
    { name: 'Arunachal Pradesh', code: 12 },
    { name: 'Nagaland', code: 13 },
    { name: 'Manipur', code: 14 },
    { name: 'Mizoram', code: 15 },
    { name: 'Tripura', code: 16 },
    { name: 'Meghalaya', code: 17 },
    { name: 'Assam', code: 18 },
    { name: 'West Bengal', code: 19 },
    { name: 'Jharkhand', code: 20 },
    { name: 'Odisha', code: 21 },
    { name: 'Chhattisgarh', code: 22 },
    { name: 'Madhya Pradesh', code: 23 },
    { name: 'Gujarat', code: 24 },
    { name: 'Dadra and Nagar Haveli and Daman and Diu', code: 25 },
    { name: 'Maharashtra', code: 27 },
    { name: 'Andhra Pradesh', code: 28 },
    { name: 'Karnataka', code: 29 },
    { name: 'Goa', code: 30 },
    { name: 'Lakshadweep', code: 31 },
    { name: 'Kerala', code: 32 },
    { name: 'Tamil Nadu', code: 33 },
    { name: 'Puducherry', code: 34 },
    { name: 'Andaman and Nicobar Islands', code: 35 },
    { name: 'Telangana', code: 36 },
    { name: 'Andhra Pradesh (New)', code: 37 },
    { name: 'Ladakh', code: 38 },
  ];

  constructor(
    private fb: FormBuilder,
    private httpService: HttpService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initializeClientForm();
    this.initializeFilterForm();
    this.setupFilterSubscription();
    this.loadClients();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ==================== FORM INITIALIZATION ====================

  private initializeClientForm(): void {
    this.clientForm = this.fb.group({
      clientName: ['', Validators.required],
      clientType: ['INTERNATIONAL'],
      gstin: [''],
      panNumber: [''],
      phone: ['', Validators.required],
      country: ['', Validators.required],
      address: ['', Validators.required],
      state: [null],
    });
  }

  private initializeFilterForm(): void {
    this.filterForm = new FormGroup({
      clientName: new FormControl(''),
      clientType: new FormControl(''),
      country: new FormControl(''),
    });
  }

  private setupFilterSubscription(): void {
    this.filterForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(
          (prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)
        ),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.pageIndex = 0;
        this.applyFilters();
      });
  }

  // ==================== DATA LOADING ====================

  loadClients(): void {
    this.isLoading = true;
    this.httpService.get<Client[]>('Dolphin/getallclients').subscribe({
      next: (response) => {
        this.allClients = response || [];
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading clients:', error);
        this.showSnackBar('Error loading clients', 'error');
        this.isLoading = false;
      },
    });
  }

  refreshData(): void {
    this.loadClients();
  }

  // ==================== FILTERING ====================

  applyFilters(): void {
    const filters = this.filterForm.value;
    let result = [...this.allClients];

    if (filters.clientName) {
      result = result.filter((client) =>
        client.clientName
          ?.toLowerCase()
          .includes(filters.clientName.toLowerCase())
      );
    }

    if (filters.clientType) {
      result = result.filter(
        (client) => client.clientType === filters.clientType
      );
    }

    if (filters.country) {
      result = result.filter((client) =>
        client.country?.toLowerCase().includes(filters.country.toLowerCase())
      );
    }

    // Apply sorting
    if (this.currentSort.active && this.currentSort.direction) {
      result = this.sortClients(result);
    }

    this.filteredClients = result;
    this.updatePagination();
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.pageIndex = 0;
    this.applyFilters();
  }

  // ==================== SORTING ====================

  sortData(sort: Sort): void {
    this.currentSort = sort;
    this.applyFilters();
  }

  private sortClients(clients: Client[]): Client[] {
    const data = [...clients];
    const { active, direction } = this.currentSort;

    if (!active || direction === '') {
      return data;
    }

    return data.sort((a, b) => {
      const isAsc = direction === 'asc';
      switch (active) {
        case 'clientName':
          return this.compare(a.clientName, b.clientName, isAsc);
        case 'clientType':
          return this.compare(a.clientType, b.clientType, isAsc);
        case 'country':
          return this.compare(a.country, b.country, isAsc);
        default:
          return 0;
      }
    });
  }

  private compare(
    a: string | null | undefined,
    b: string | null | undefined,
    isAsc: boolean
  ): number {
    const valA = a || '';
    const valB = b || '';
    return (valA < valB ? -1 : 1) * (isAsc ? 1 : -1);
  }

  // ==================== PAGINATION ====================

  updatePagination(): void {
    const startIndex = this.pageIndex * this.pageSize;
    this.paginatedClients = this.filteredClients.slice(
      startIndex,
      startIndex + this.pageSize
    );
  }

  getTotalPages(): number {
    return Math.ceil(this.filteredClients.length / this.pageSize);
  }

  getStartIndex(): number {
    return this.filteredClients.length === 0
      ? 0
      : this.pageIndex * this.pageSize + 1;
  }

  getEndIndex(): number {
    const endIndex = (this.pageIndex + 1) * this.pageSize;
    return endIndex > this.filteredClients.length
      ? this.filteredClients.length
      : endIndex;
  }

  goToFirstPage(): void {
    this.pageIndex = 0;
    this.updatePagination();
  }

  goToPreviousPage(): void {
    if (this.pageIndex > 0) {
      this.pageIndex--;
      this.updatePagination();
    }
  }

  goToNextPage(): void {
    if (this.pageIndex < this.getTotalPages() - 1) {
      this.pageIndex++;
      this.updatePagination();
    }
  }

  goToLastPage(): void {
    this.pageIndex = this.getTotalPages() - 1;
    this.updatePagination();
  }

  goToPage(pageIndex: number): void {
    this.pageIndex = pageIndex;
    this.updatePagination();
  }

  changePageSize(newPageSize: number): void {
    this.pageSize = newPageSize;
    this.pageIndex = 0;
    this.updatePagination();
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
        for (let i = 1; i <= 5; i++) visiblePages.push(i);
        visiblePages.push('...');
        visiblePages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        visiblePages.push(1);
        visiblePages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) visiblePages.push(i);
      } else {
        visiblePages.push(1);
        visiblePages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++)
          visiblePages.push(i);
        visiblePages.push('...');
        visiblePages.push(totalPages);
      }
    }

    return visiblePages;
  }

  // ==================== FORM OPERATIONS ====================

  openAddForm(): void {
    this.isEditMode = false;
    this.editingClientId = null;
    this.showForm = true;
    this.resetForm();
  }

  closeForm(): void {
    this.showForm = false;
    this.isEditMode = false;
    this.editingClientId = null;
    this.resetForm();
  }

  toggleClientType(): void {
    this.isIndianClient = !this.isIndianClient;

    this.clientForm.patchValue({
      clientType: this.isIndianClient ? 'INDIAN' : 'INTERNATIONAL',
      country: this.isIndianClient ? 'India' : '',
    });

    this.updateValidators();
  }

  private updateValidators(): void {
    const gstinControl = this.clientForm.get('gstin');
    const panNumberControl = this.clientForm.get('panNumber');
    const stateControl = this.clientForm.get('state');

    if (this.isIndianClient) {
      gstinControl?.setValidators([Validators.required]);
      panNumberControl?.setValidators([Validators.required]);
      stateControl?.setValidators([Validators.required]);
    } else {
      gstinControl?.clearValidators();
      panNumberControl?.clearValidators();
      stateControl?.clearValidators();
      gstinControl?.setValue('');
      panNumberControl?.setValue('');
      stateControl?.setValue(null);
    }

    gstinControl?.updateValueAndValidity();
    panNumberControl?.updateValueAndValidity();
    stateControl?.updateValueAndValidity();
  }

  onSubmit(): void {
    if (this.clientForm.valid) {
      this.isSubmitting = true;
      const formValue = this.clientForm.value;

      const client: any = {
        clientName: formValue.clientName,
        clientType: formValue.clientType,
        gstin: formValue.gstin || null,
        panNumber: formValue.panNumber || null,
        phone: formValue.phone,
        country: formValue.country,
        address: formValue.address,
        stateName: formValue.state?.name || null,
        stateCode: formValue.state?.code || null,
      };

      if (this.isEditMode && this.editingClientId) {
        this.httpService
          .put<Client>(`Dolphin/client/${this.editingClientId}`, client)
          .subscribe({
            next: (res) => {
              this.showSnackBar('Client updated successfully', 'success');
              this.closeForm();
              this.loadClients();
              this.isSubmitting = false;
            },
            error: (error) => {
              console.error('Error updating client:', error);
              this.showSnackBar('Error updating client', 'error');
              this.isSubmitting = false;
            },
          });
      } else {
        this.httpService.post<Client>('Dolphin/addclient', client).subscribe({
          next: (res) => {
            this.showSnackBar('Client added successfully', 'success');
            this.closeForm();
            this.loadClients();
            this.isSubmitting = false;
          },
          error: (error) => {
            console.error('Error adding client:', error);
            this.showSnackBar('Error adding client', 'error');
            this.isSubmitting = false;
          },
        });
      }
    } else {
      this.markAllFieldsAsTouched();
    }
  }

  resetForm(): void {
    this.isIndianClient = false;
    this.clientForm.reset();
    this.initializeClientForm();
  }

  private markAllFieldsAsTouched(): void {
    Object.keys(this.clientForm.controls).forEach((key) => {
      this.clientForm.get(key)?.markAsTouched();
    });
  }

  // ==================== VIEW / EDIT / DELETE ====================

  viewClient(client: Client): void {
    this.selectedClient = client;
    this.dialog.open(this.viewDialogTemplate, {
      width: '550px',
      panelClass: 'client-dialog',
    });
  }

  editClient(client: Client): void {
    this.selectedClient = client;
    this.editingClientId = client.id || null;
    this.isEditMode = true;
    this.showForm = true;
    this.populateForm(client);
  }

  editFromDialog(): void {
    this.dialog.closeAll();
    if (this.selectedClient) {
      this.editClient(this.selectedClient);
    }
  }

  private populateForm(client: Client): void {
    this.isIndianClient = client.clientType === 'INDIAN';

    const selectedState = this.indianStates.find(
      (s) => s.code === client.stateCode
    );

    this.clientForm.patchValue({
      clientName: client.clientName,
      clientType: client.clientType || 'INTERNATIONAL',
      gstin: client.gstin || '',
      panNumber: client.panNumber || '',
      phone: client.phone,
      country: client.country,
      address: client.address,
      state: selectedState || null,
    });

    this.updateValidators();
  }

  confirmDelete(client: Client): void {
    this.selectedClient = client;
    this.dialog.open(this.deleteDialogTemplate, {
      width: '400px',
    });
  }

  deleteClient(): void {
    if (this.selectedClient?.id) {
      this.httpService
        .get(`Dolphin/deleteclient/${this.selectedClient.id}`)
        .subscribe({
          next: () => {
            this.showSnackBar('Client deleted successfully', 'success');
            this.dialog.closeAll();
            this.loadClients();
          },
          error: (error) => {
            console.error('Error deleting client:', error);
            this.showSnackBar('Error deleting client', 'error');
          },
        });
    }
  }

  // ==================== UTILITY ====================

  private showSnackBar(message: string, type: 'success' | 'error'): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: type === 'success' ? 'success-snackbar' : 'error-snackbar',
    });
  }
}
