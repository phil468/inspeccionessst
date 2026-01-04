import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MisInspeccionesPage } from './mis-inspecciones.page';

describe('MisInspeccionesPage', () => {
  let component: MisInspeccionesPage;
  let fixture: ComponentFixture<MisInspeccionesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MisInspeccionesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
