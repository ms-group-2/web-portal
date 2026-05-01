export interface AllowedValueResponse {
  value: string;
  label?: string;
}

export interface CategoryAttributeResponse {
  id: number;
  name: string;
  type: string;
  is_required: boolean;
  allowed_values: AllowedValueResponse[];
}

export interface CategoryAttributesListResponse {
  category_id: number;
  attributes: CategoryAttributeResponse[];
}
