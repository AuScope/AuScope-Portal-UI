import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { MSCLAnalyticComponent } from './mscl.analytic.component';

describe('MsclAnalyticComponent', () => {
  let component: MSCLAnalyticComponent;
  let fixture: ComponentFixture<MSCLAnalyticComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ MSCLAnalyticComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MSCLAnalyticComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
