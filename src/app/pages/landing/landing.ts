import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from "@angular/router";

@Component({
  standalone: true,
  selector: 'app-landing',
  imports: [MatButtonModule, RouterLink],
  templateUrl: './landing.html',
})
export class Landing {

}
