import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { TranslatePipe } from 'lib/pipes/translate.pipe';

@Component({
  selector: 'app-products-section',
  imports: [CurrencyPipe, TranslatePipe],
  templateUrl: './products-section.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsSection {
  products = input<any[]>([]);
  loading = input<boolean>(false);
  onAddProduct = output<void>();
  onEditProduct = output<string | number>();
  onDeleteProduct = output<string | number>();
}
