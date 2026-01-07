import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { searchOutline, closeOutline } from 'ionicons/icons';
import { Personal } from '../../../models/catalogo.model';

@Component({
  selector: 'app-supervisor-modal',
  templateUrl: './supervisor-modal.component.html',
  styleUrls: ['./supervisor-modal.component.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, FormsModule, IonicModule],
})
export class SupervisorModalComponent implements OnInit {
  personalList: Personal[] = [];
  personalFiltrado: Personal[] = [];
  personalMostrado: Personal[] = [];
  searchTerm = '';
  pageSize = 50;

  constructor(private modalController: ModalController) {
    addIcons({
      searchOutline,
      closeOutline,
    });
  }

  ngOnInit() {
    this.personalFiltrado = [...this.personalList];
    this.loadNextPage();
  }

  filterPersonal() {
    const term = this.searchTerm.toLowerCase().trim();

    if (!term) {
      this.personalFiltrado = [...this.personalList];
    } else {
      this.personalFiltrado = this.personalList.filter(
        (p) =>
          p.name.toLowerCase().includes(term) || (p.dni && p.dni.includes(term))
      );
    }

    // Resetear la lista mostrada
    this.personalMostrado = [];
    this.loadNextPage();
  }

  loadNextPage() {
    const currentLength = this.personalMostrado.length;
    const nextItems = this.personalFiltrado.slice(
      currentLength,
      currentLength + this.pageSize
    );
    this.personalMostrado = [...this.personalMostrado, ...nextItems];
  }

  onIonInfinite(event: any) {
    this.loadNextPage();
    setTimeout(() => {
      event.target.complete();
    }, 100);
  }

  selectPersonal(personal: Personal) {
    this.modalController.dismiss({
      selected: personal,
    });
  }

  dismiss() {
    this.modalController.dismiss();
  }
}
