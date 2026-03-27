import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PretragaIRezervacijaComponent } from './pretraga-i-rezervacija.component';

describe('PretragaIRezervacijaComponent', () => {
  let component: PretragaIRezervacijaComponent;
  let fixture: ComponentFixture<PretragaIRezervacijaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PretragaIRezervacijaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PretragaIRezervacijaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
