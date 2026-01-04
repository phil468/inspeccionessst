import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { Personal } from '../../../../models/catalogo.model';

@Component({
  selector: 'app-inspector-selection-modal',
  templateUrl: './inspector-selection-modal.component.html',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class InspectorSelectionModalComponent implements OnInit {
  personalList: Personal[] = [];
  inspectoresSeleccionados: Personal[] = [];
  filtrarSoloInspectores: boolean = true; // Por defecto filtra solo inspectores

  searchTerm = '';
  personalFiltrado: Personal[] = [];
  personalMostrado: Personal[] = [];
  itemsPorPagina = 20;

  constructor(private modalController: ModalController) {}

  ngOnInit() {
    // Filtrar solo personal que sea inspector si está habilitado
    if (this.filtrarSoloInspectores) {
      this.personalList = this.personalList.filter((p) => p.inspector === true);
    }
    this.personalFiltrado = [...this.personalList];
    this.ordenarPorSeleccionados();
    this.cargarMasPersonal();
  }

  filterPersonal() {
    const term = this.searchTerm.toLowerCase().trim();

    if (!term) {
      this.personalFiltrado = [...this.personalList];
    } else {
      this.personalFiltrado = this.personalList.filter(
        (p) =>
          p.nombres.toLowerCase().includes(term) ||
          p.apellido_paterno?.toLowerCase().includes(term) ||
          p.apellido_materno?.toLowerCase().includes(term) ||
          p.dni?.toLowerCase().includes(term)
      );
    }

    // Ordenar para mostrar seleccionados primero
    this.ordenarPorSeleccionados();

    // Reiniciar la lista mostrada
    this.personalMostrado = [];
    this.cargarMasPersonal();
  }

  ordenarPorSeleccionados() {
    this.personalFiltrado.sort((a, b) => {
      const aSeleccionado = this.isInspectorSeleccionado(a.id);
      const bSeleccionado = this.isInspectorSeleccionado(b.id);

      // Primero ordenar por selección
      if (aSeleccionado && !bSeleccionado) return -1;
      if (!aSeleccionado && bSeleccionado) return 1;

      // Si ambos tienen el mismo estado de selección, ordenar alfabéticamente
      const nombreA = this.getNombreCompleto(a).toLowerCase();
      const nombreB = this.getNombreCompleto(b).toLowerCase();
      return nombreA.localeCompare(nombreB);
    });
  }

  cargarMasPersonal() {
    const inicio = this.personalMostrado.length;
    const fin = inicio + this.itemsPorPagina;
    const nuevoPersonal = this.personalFiltrado.slice(inicio, fin);
    this.personalMostrado.push(...nuevoPersonal);
  }

  onIonInfinite(event: any) {
    this.cargarMasPersonal();
    setTimeout(() => {
      event.target.complete();
    }, 300);
  }

  isInspectorSeleccionado(personalId: number | undefined): boolean {
    if (!personalId) return false;
    return this.inspectoresSeleccionados.some((p) => p.id === personalId);
  }

  toggleInspector(personal: Personal) {
    if (!personal.id) return;

    const index = this.inspectoresSeleccionados.findIndex(
      (p) => p.id === personal.id
    );
    if (index > -1) {
      this.inspectoresSeleccionados.splice(index, 1);
    } else {
      this.inspectoresSeleccionados.push(personal);
    }

    // Reordenar para mantener seleccionados al inicio
    this.ordenarPorSeleccionados();
    this.personalMostrado = [];
    this.cargarMasPersonal();
  }

  getNombreCompleto(personal: Personal): string {
    const partes = [
      personal.nombres,
      personal.apellido_paterno,
      personal.apellido_materno,
    ].filter((p) => p);
    return partes.join(' ');
  }

  confirmar() {
    this.modalController.dismiss({
      inspectoresSeleccionados: this.inspectoresSeleccionados,
    });
  }

  dismiss() {
    this.modalController.dismiss();
  }
}
