import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MenadzerRezervacijeComponent } from './menadzer-rezervacije.component';

describe('MenadzerRezervacijeComponent', () => {
  let component: MenadzerRezervacijeComponent;
  let fixture: ComponentFixture<MenadzerRezervacijeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenadzerRezervacijeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MenadzerRezervacijeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
