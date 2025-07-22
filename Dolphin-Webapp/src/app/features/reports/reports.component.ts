import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpService } from '../shared/http-serve.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { Invoice } from '../shared/Invoice';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
})
export class ReportsComponent implements OnInit {
  displayedColumns: string[] = [
    'dispatchDate',
    'billTo',
    'gatePassNo',
    'gpType',
    // 'categoryGrade',
    'phone',
    'notes',
    'actions',
  ];

  dataSource = new MatTableDataSource<Invoice>([]);
  isLoading = false;

  @ViewChild(MatSort) sort!: MatSort;

  constructor(private httpService: HttpService) {}

  ngOnInit() {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;

    this.httpService.get<Invoice[]>('Dolphin/getallinvoice').subscribe({
      next: (response) => {
        this.dataSource = new MatTableDataSource(response);
        this.dataSource.sort = this.sort;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading invoice data:', error);
        this.isLoading = false;
      },
    });
  }
}
