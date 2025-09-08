import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
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
  styleUrl: './addclient.component.scss',
})
export class AddclientComponent implements OnInit {
  clientForm!: FormGroup;
  isIndianClient = false; // Default to International
  
  // Indian states with numeric GST codes
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
    { name: 'Ladakh', code: 38 }
  ];

  constructor(private fb: FormBuilder, private httpService: HttpService) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.clientForm = this.fb.group({
      clientName: ['', Validators.required],
      clientType: ['INTERNATIONAL'], // Default value
      gstin: [''],
      panNumber: [''],
      phone: ['', Validators.required],
      country: ['', Validators.required],
      address: ['', Validators.required],
      state: [null]
    });
  }

  toggleClientType(): void {
    this.isIndianClient = !this.isIndianClient;
    
    // Update form control value
    this.clientForm.patchValue({
      clientType: this.isIndianClient ? 'INDIAN' : 'INTERNATIONAL',
      country: this.isIndianClient ? 'India' : '' // Auto-fill India for Indian clients
    });
    
    // Update validators
    this.updateValidators();
    
    console.log('Client type changed to:', this.isIndianClient ? 'Indian' : 'International');
  }

  private updateValidators(): void {
    const gstinControl = this.clientForm.get('gstin');
    const panNumberControl = this.clientForm.get('panNumber');
    const stateControl = this.clientForm.get('state');

    if (this.isIndianClient) {
      // Make fields required for Indian clients
      gstinControl?.setValidators([Validators.required]);
      panNumberControl?.setValidators([Validators.required]);
      stateControl?.setValidators([Validators.required]);
    } else {
      // Clear validators and values for international clients
      gstinControl?.clearValidators();
      panNumberControl?.clearValidators();
      stateControl?.clearValidators();
      
      // Clear the values when switching to international
      gstinControl?.setValue('');
      panNumberControl?.setValue('');
      stateControl?.setValue(null);
    }

    // Update validation status
    gstinControl?.updateValueAndValidity();
    panNumberControl?.updateValueAndValidity();
    stateControl?.updateValueAndValidity();
  }

  onSubmit(): void {
    if (this.clientForm.valid) {
      const formValue = this.clientForm.value;
      
      const client: Client = {
        ...formValue,
        // Store both state name and code if state is selected
        stateName: formValue.state?.name || null,
        stateCode: formValue.state?.code || null,
        state: formValue.state
      };

      console.log('Submitting client:', client);
      
      this.httpService.post('Dolphin/addclient', client).subscribe({
        next: (res) => {
          console.log('Client added successfully:', res);
          // Handle success (show toast, navigate, etc.)
        },
        error: (error) => {
          console.error('Error adding client:', error);
          // Handle error
        }
      });
    } else {
      console.log('Form is invalid');
      this.markAllFieldsAsTouched();
    }
  }

  resetForm(): void {
    this.isIndianClient = false;
    this.clientForm.reset();
    this.initializeForm();
  }

  private markAllFieldsAsTouched(): void {
    Object.keys(this.clientForm.controls).forEach(key => {
      this.clientForm.get(key)?.markAsTouched();
    });
  }
}