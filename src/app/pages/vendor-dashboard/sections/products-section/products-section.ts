import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { TranslatePipe } from 'lib/pipes/translate.pipe';

@Component({
  selector: 'app-products-section',
  imports: [TranslatePipe],
  templateUrl: './products-section.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsSection {
  products = input<any[]>([]);
  loading = input<boolean>(false);
  onAddProduct = output<void>();
  onEditProduct = output<string | number>();
  onDeleteProduct = output<string | number>();

  draftProducts = computed(() => this.products().filter(p => p.isDraft));
  publishedProducts = computed(() => this.products().filter(p => !p.isDraft));
}
