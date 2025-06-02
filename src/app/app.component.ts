import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UserCrudComponent } from "./pages/user-crud/user-crud.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, UserCrudComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'frontend';
}
