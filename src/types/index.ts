export interface Ingredient {
    id: string;
    name: string;
    expiryDate: Date;
    imageUri?: string;
    notes?: string;
    quantity?: string;
    owner?: string;
    addedDate: Date;
  }
  
  export interface FridgeState {
    ingredients: Ingredient[];
    isOpen: boolean;
  }