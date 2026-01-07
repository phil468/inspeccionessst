import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { Area } from '../../../../models/catalogo.model';

@Component({
  selector: 'app-area-selection-modal',
  templateUrl: './area-selection-modal.component.html',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [IonicModule, CommonModule, FormsModule],
})
export class AreaSelectionModalComponent implements OnInit {
  areas: Area[] = [];
  areasSeleccionadas: Area[] = [];

  searchTerm = '';
  areasFiltradas: Area[] = [];
  areasMostradas: Area[] = [];
  itemsPorPagina = 20;

  constructor(private modalController: ModalController) {}

  ngOnInit() {
    this.areasFiltradas = [...this.areas];
    this.ordenarPorSeleccionadas();
    this.cargarMasAreas();
  }

  filterAreas() {
    const term = this.searchTerm.toLowerCase().trim();

    if (!term) {
      this.areasFiltradas = [...this.areas];
    } else {
      this.areasFiltradas = this.areas.filter((area) =>
        area.name.toLowerCase().includes(term)
      );
    }

    // Ordenar para mostrar seleccionadas primero
    this.ordenarPorSeleccionadas();

    // Reiniciar la lista mostrada
    this.areasMostradas = [];
    this.cargarMasAreas();
  }

  ordenarPorSeleccionadas() {
    this.areasFiltradas.sort((a, b) => {
      const aSeleccionada = this.isAreaSeleccionada(a.id);
      const bSeleccionada = this.isAreaSeleccionada(b.id);

      // Primero ordenar por selección
      if (aSeleccionada && !bSeleccionada) return -1;
      if (!aSeleccionada && bSeleccionada) return 1;

      // Si ambas tienen el mismo estado de selección, ordenar alfabéticamente
      return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });
  }

  cargarMasAreas() {
    const inicio = this.areasMostradas.length;
    const fin = inicio + this.itemsPorPagina;
    const nuevasAreas = this.areasFiltradas.slice(inicio, fin);
    this.areasMostradas.push(...nuevasAreas);
  }

  onIonInfinite(event: any) {
    this.cargarMasAreas();
    setTimeout(() => {
      event.target.complete();
    }, 300);
  }

  isAreaSeleccionada(areaId: number | undefined): boolean {
    if (!areaId) return false;
    return this.areasSeleccionadas.some((a) => a.id === areaId);
  }

  toggleArea(area: Area) {
    if (!area.id) return;

    const index = this.areasSeleccionadas.findIndex((a) => a.id === area.id);
    if (index > -1) {
      this.areasSeleccionadas.splice(index, 1);
    } else {
      this.areasSeleccionadas.push(area);
    }

    // Reordenar para mantener seleccionadas al inicio
    this.ordenarPorSeleccionadas();
    this.areasMostradas = [];
    this.cargarMasAreas();
  }

  confirmar() {
    this.modalController.dismiss({
      areas: this.areasSeleccionadas,
    });
  }

  dismiss() {
    this.modalController.dismiss();
  }
}
