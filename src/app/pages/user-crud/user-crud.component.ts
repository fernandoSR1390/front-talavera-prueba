import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { AfterViewInit, Component, ElementRef, inject, OnInit, signal, ViewChild } from '@angular/core';
import { FormsModule, NgForm, ReactiveFormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { CalendarModule } from 'primeng/calendar';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import * as nationalities from 'i18n-nationality';
import es from 'i18n-nationality/langs/es.json';
import Swal from 'sweetalert2';
import { phoneCodeMap } from '../../data/telefono-codigos';
import { profesiones } from '../../data/profesiones';

declare const intlTelInput: any;
@Component({
  selector: 'app-user-crud',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    TableModule,
    InputTextModule,
    ButtonModule,
    DialogModule,
    CalendarModule,
    InputNumberModule,
    DropdownModule,
    ReactiveFormsModule
  ],
  templateUrl: './user-crud.component.html',
  styleUrl: './user-crud.component.css',
})
export class UserCrudComponent implements OnInit, AfterViewInit  {
  private http = inject(HttpClient);
  private urlBackend = 'http://localhost:3000/api/users';

  @ViewChild('phoneInput', { static: true }) phoneInputRef!: ElementRef;
  itiInstance: any;
  internationalNumber = signal<string>('');

  users: any[] = [];
  user: any = {};
  displayModal = false;
  nationalityOptions: any[] = [];
  professionOptions: any[] = [];
  phoneOptions: any[] = [];

  ngOnInit() {
    // Registrar el idioma español
    nationalities.registerLocale(es);

    // Obtener y mapear las nacionalidades al formato para PrimeNG
    const nacionalidades = nationalities.getNames('es');

    this.nationalityOptions = Object.entries(nacionalidades).map(
      ([key, value]) => ({
        label: value,
        value: value,
      })
    );

    // Mapear país -> código
    this.phoneOptions = phoneCodeMap.map((p) => ({
      label: `${p.name} (${p.callingCode})`,
      value: p.callingCode,
    }));

    this.professionOptions = profesiones.map((p) => ({ label: p, value: p }));

    this.loadUsers();
  }

  ngAfterViewInit(): void {
    this.itiInstance = intlTelInput(this.phoneInputRef.nativeElement, {
      initialCountry: 'bo',
      preferredCountries: ['bo', 'us', 'mx'],
      utilsScript: 'https://cdn.jsdelivr.net/npm/intl-tel-input@17.0.19/build/js/utils.js',
    });

    this.phoneInputRef.nativeElement.addEventListener('change', () => {
      if (this.itiInstance.isValidNumber()) {
        console.log("Número: ", this.itiInstance.getNumber());

        this.internationalNumber.set(this.itiInstance.getNumber());
      } else {
        this.internationalNumber.set('');
      }
    });
  }

  loadUsers() {
    this.http.get<any[]>(this.urlBackend).subscribe((data) => {
      this.users = data;
    });
  }

  saveUser(form: NgForm) {
    if (form.invalid && !this.itiInstance.isValidNumber()) {
      return; // No envía si el formulario es inválido
    }

    // Combinar código y número en el formato final
    this.user.phone = `+${this.itiInstance.s.dialCode} ${this.user.phone}`;

    if (this.user.id) {
      this.http
        .put(`${this.urlBackend}/${this.user.id}`, this.user)
        .subscribe(() => {
          this.loadUsers();
          this.displayModal = false;
          Swal.fire(
            'Actualizado',
            'El usuario ha sido actualizado correctamente.',
            'success'
          );
        });
    } else {
      this.http.post(this.urlBackend, this.user).subscribe(() => {
        this.loadUsers();
        this.displayModal = false;
        Swal.fire(
          'Creado',
          'El usuario ha sido creado correctamente.',
          'success'
        );
      });
    }
  }

  editUser(u: any) {
    const [code, number] = u.phone ? u.phone.split(' ') : ['', ''];

    this.user = {
      ...u,
      phoneCode: code || '', // para mostrar en el dropdown
      phone: number || '',   // solo el número
      birth_date: new Date(u.birth_date), // 👈 conversión aquí
    };

    const matched = phoneCodeMap.find(p => p.callingCode === code);
    if (matched && this.itiInstance) {
      this.itiInstance.setCountry(matched.code.toLowerCase());
    }

    this.displayModal = true;
  }

  deleteUser(id: number) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: '¡No podrás revertir esto!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.http.delete(`${this.urlBackend}/${id}`).subscribe(() => {
          this.loadUsers();
          Swal.fire('Eliminado', 'El usuario ha sido eliminado.', 'success');
        });
      }
    });
  }

  openNew() {
    this.user = {};
    this.displayModal = true;
  }

  onNationalityChange(nationality: string) {
    const matched = phoneCodeMap.find(
      (p) => p.nationality.toLowerCase() === nationality.toLowerCase()
    );
    if (matched) {
      this.user.phoneCode = matched.callingCode;
      if (this.itiInstance) {
        this.itiInstance.setCountry(matched.code.toLowerCase());
      }
    } else {
      this.user.phoneCode = '';
    }
  }
}
