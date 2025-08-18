import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SelectionModel } from '@angular/cdk/collections';
import { StockGraniteBlock } from '../shared/StockBlock';
import { HttpService } from '../../shared/http-serve.service';
import { DispatchStatus } from '../../shared/enum/stausenum';

export interface DialogData {
  block?: StockGraniteBlock;
  mode: 'add' | 'edit';
}

export interface BlockData {
  id: string;
  blockNo: number;
  status: number;
  gatePassNo: string;
}

// export enum DispatchStatus {
//   AtPort = 0,
//   Shipped = 1
// }

@Component({
  selector: 'app-updategranite-block-status',
  standalone: false,
  templateUrl: './updategranite-block-status.component.html',
  styleUrl: './updategranite-block-status.component.scss'
})
export class UpdategraniteBlockStatusComponent implements OnInit {
  blockNumber: string = '';
  blocksData: BlockData[] = [];
  displayedColumns: string[] = ['select', 'blockNo', 'gatePassNo', 'status'];
  selection = new SelectionModel<BlockData>(true, []);
  updateForm: FormGroup;
  
  statusOptions = [
    { value: DispatchStatus.AtPort, label: 'At Port' },
    { value: DispatchStatus.Shipped, label: 'Shipped' },
    { value: DispatchStatus.ReadyForDispatch, label: 'Ready for Dispatch' },
     { value: DispatchStatus.LoadedOnTruck, label: 'Loaded on Truck' },
  ];

  constructor(
    private fb: FormBuilder,
    private httpService: HttpService,
    public dialogRef: MatDialogRef<UpdategraniteBlockStatusComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.updateForm = this.fb.group({
      status: ['', Validators.required]
    });
  }

  ngOnInit() {
    // Initialize with empty data or load initial data if needed
  }

  searchBlockNumber() {
    if (!this.blockNumber.trim()) {
      return;
    }
    
    // If your HttpService supports generics:
this.httpService.get<BlockData[]>(`dolphin/getgranitesblockscategorybygatepassorblockno?gatePassNo=${this.blockNumber}`)
  .subscribe({
    next: (res) => {
      console.log('API Response:', res);
      this.blocksData = res || [];
      this.selection.clear();
    },
    error: (err) => {
      console.error('API Error:', err);
      this.blocksData = [];
    },
  });
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.blocksData.length;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  toggleAllRows() {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }
    this.selection.select(...this.blocksData);
  }

  /** The label for the checkbox on the passed row */
  checkboxLabel(row?: BlockData): string {
    if (!row) {
      return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.blockNo}`;
  }

  getStatusLabel(status: number): string {
    const statusOption = this.statusOptions.find(option => option.value === status);
    return statusOption ? statusOption.label : 'Unknown';
  }

  getStatusClass(status: number): string {
    return `status-${status}`;
  }

  onUpdateStatus() {
    if (this.selection.isEmpty()) {
      console.warn('No blocks selected');
      return;
    }

    if (this.updateForm.invalid) {
      console.warn('Please select a status');
      return;
    }

    const selectedBlocks = this.selection.selected;
    const newStatus = this.updateForm.get('status')?.value;
    const selectedIds = selectedBlocks.map(block => block.id);

    console.log('Updating blocks:', {
      ids: selectedIds,
      status: newStatus,
      selectedBlocks: selectedBlocks
    });

    // Here you would make the API call to update the status
    // Example API call:
    const updateData = {
  ids: {
    id: selectedIds,
    status: newStatus
  }
};


    this.httpService.put('dolphin/updateblockstatus', updateData).subscribe({
      next: (response) => {
        console.log('Status updated successfully:', response);
        // Update local data
        selectedBlocks.forEach(block => {
          const index = this.blocksData.findIndex(b => b.id === block.id);
          if (index !== -1) {
            this.blocksData[index].status = newStatus;
          }
        });
        // Clear selection after successful update
        this.selection.clear();
        this.updateForm.reset();
      },
      error: (error) => {
        console.error('Error updating status:', error);
      }
    });
  }

  onSubmit() {
    this.onUpdateStatus();
  }

  onCancel() {
    this.dialogRef.close();
  }

  onReset() {
    this.selection.clear();
    this.updateForm.reset();
    this.blockNumber = '';
    this.blocksData = [];
  }

  getDialogTitle(): string {
    return 'Update Block Status';
  }
}