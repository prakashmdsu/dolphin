import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdategraniteBlockStatusComponent } from './updategranite-block-status.component';

describe('UpdategraniteBlockStatusComponent', () => {
  let component: UpdategraniteBlockStatusComponent;
  let fixture: ComponentFixture<UpdategraniteBlockStatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdategraniteBlockStatusComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UpdategraniteBlockStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
