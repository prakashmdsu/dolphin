import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Client } from '../shared/Client';
import { HttpService } from '../shared/http-serve.service';

@Component({
  selector: 'app-addclient',
  standalone: false,
  templateUrl: './addclient.component.html',
  styleUrl: './addclient.component.scss',
})
export class AddclientComponent implements OnInit {
  clientForm!: FormGroup;

  constructor(private fb: FormBuilder, private httpService: HttpService) {}

  ngOnInit(): void {
    this.clientForm = this.fb.group({
      clientName: ['', Validators.required],
      gstin: ['', Validators.required],
      phone: ['', Validators.required],
      country: ['', Validators.required],
      address: ['', Validators.required],
    });
  }

  onSubmit() {
    if (this.clientForm.valid) {
      const client: Client = this.clientForm.value;
      this.httpService.post('Dolphin/addclient', client).subscribe((res) => {});
    }
  }
}
