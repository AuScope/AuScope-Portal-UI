import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MSCLComponent } from './mscl.component';

describe('MsclComponent', () => {
  let component: MSCLComponent;
  let fixture: ComponentFixture<MSCLComponent>;

  beforeEach(async(() => {
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
