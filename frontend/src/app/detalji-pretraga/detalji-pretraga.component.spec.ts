import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetaljiPretragaComponent } from './detalji-pretraga.component';

describe('DetaljiPretragaComponent', () => {
  let component: DetaljiPretragaComponent;
  let fixture: ComponentFixture<DetaljiPretragaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetaljiPretragaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetaljiPretragaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
