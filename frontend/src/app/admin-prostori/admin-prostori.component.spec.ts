import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminProstoriComponent } from './admin-prostori.component';

describe('AdminProstoriComponent', () => {
  let component: AdminProstoriComponent;
  let fixture: ComponentFixture<AdminProstoriComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminProstoriComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminProstoriComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
