import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-mis-inspecciones',
  templateUrl: './mis-inspecciones.page.html',
  styleUrls: ['./mis-inspecciones.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class MisInspeccionesPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
