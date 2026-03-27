import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MenadzerKalendarComponent } from './menadzer-kalendar.component';

describe('MenadzerKalendarComponent', () => {
  let component: MenadzerKalendarComponent;
  let fixture: ComponentFixture<MenadzerKalendarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenadzerKalendarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MenadzerKalendarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
