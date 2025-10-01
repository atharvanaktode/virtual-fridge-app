import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ingredient } from '@/types';

const STORAGE_KEY = 'VIRTUAL_FRIDGE_INGREDIENTS';

export const StorageService = {
  async getIngredients(): Promise<Ingredient[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading ingredients:', error);
      return [];
    }
  },

  async saveIngredients(ingredients: Ingredient[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ingredients));
    } catch (error) {
      console.error('Error saving ingredients:', error);
    }
  },

  async addIngredient(ingredient: Ingredient): Promise<void> {
    const ingredients = await this.getIngredients();
    ingredients.push(ingredient);
    await this.saveIngredients(ingredients);
  },

  async removeIngredient(id: string): Promise<void> {
    const ingredients = await this.getIngredients();
    const filtered = ingredients.filter(item => item.id !== id);
    await this.saveIngredients(filtered);
  },

  async updateIngredient(id: string, updates: Partial<Ingredient>): Promise<void> {
    const ingredients = await this.getIngredients();
    const index = ingredients.findIndex(item => item.id === id);
    if (index !== -1) {
      ingredients[index] = { ...ingredients[index], ...updates };
      await this.saveIngredients(ingredients);
    }
  },
};