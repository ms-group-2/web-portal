import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-home-layout',
  imports: [CommonModule, RouterOutlet],
  templateUrl: './home-layout.html',
  styleUrl: './home-layout.scss',
})
export class HomeLayout {

}
