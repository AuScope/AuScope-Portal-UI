import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataExplorerRecordComponent } from './data-explorer-record.component';

describe('DataExplorerRecordComponent', () => {
  let component: DataExplorerRecordComponent;
  let fixture: ComponentFixture<DataExplorerRecordComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DataExplorerRecordComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DataExplorerRecordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
