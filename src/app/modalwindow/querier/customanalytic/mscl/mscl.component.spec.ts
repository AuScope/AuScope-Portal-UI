import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { MSCLComponent } from './mscl.component';

describe('MsclComponent', () => {
  let component: MSCLComponent;
  let fixture: ComponentFixture<MSCLComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ MSCLComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MSCLComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
