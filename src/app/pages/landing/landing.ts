import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from "@angular/router";
import { CommonModule } from '@angular/common';
import { Header } from 'lib/components/header/header';
import { Footer } from 'lib/components/footer/footer';

@Component({
  selector: 'app-landing',
  imports: [MatButtonModule,  CommonModule, Header, Footer],
  templateUrl: './landing.html',
  styleUrls: ['./landing.scss']
})
export class Landing implements OnInit {
  fullText = 'VIPO მალე გაეშვება';
  displayedText: Array<{ char: string; isVipo: boolean; index: number }> = [];

  ngOnInit() {
    this.animateText();
  }

  animateText() {
    const chars = this.fullText.split('');
    
    chars.forEach((char, index) => {
      const isVipo = index < 4; 
      setTimeout(() => {
        this.displayedText.push({ 
          char: char === ' ' ? '\u00A0' : char, 
          isVipo,
          index: index
        });
      }, index * 50); 
    });
  }
}
