import React, {useState, useEffect} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {format, differenceInDays, addDays} from 'date-fns';

// Types
interface Ingredient {
  id: string;
  name: string;
  expiryDate: Date;
  imageUri?: string;
  notes?: string;
  quantity?: string;
  owner?: string;
  addedDate: Date;
}

// Get screen dimensions
const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

const App: React.FC = () => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [newIngredient, setNewIngredient] = useState({
    name: '',
    expiryDays: '7',
    notes: '',
    imageUri: '',
  });

  // Load ingredients on mount
  useEffect(() => {
    loadIngredients();
  }, []);

  const loadIngredients = async () => {
    try {
      const stored = await AsyncStorage.getItem('VIRTUAL_FRIDGE_INGREDIENTS');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        const ingredientsWithDates = parsed.map((item: any) => ({
          ...item,
          expiryDate: new Date(item.expiryDate),
          addedDate: new Date(item.addedDate),
        }));
        setIngredients(ingredientsWithDates);
      }
    } catch (error) {
      console.error('Error loading ingredients:', error);
    }
  };

  const saveIngredients = async (updatedIngredients: Ingredient[]) => {
    try {
      await AsyncStorage.setItem(
        'VIRTUAL_FRIDGE_INGREDIENTS',
        JSON.stringify(updatedIngredients),
      );
      setIngredients(updatedIngredients);
    } catch (error) {
      console.error('Error saving ingredients:', error);
    }
  };

  // Get ingredients expiring in next 3 days
  const getExpiringIngredients = () => {
    const today = new Date();
    return ingredients.filter(item => {
      const daysUntilExpiry = differenceInDays(item.expiryDate, today);
      return daysUntilExpiry <= 3 && daysUntilExpiry >= 0;
    });
  };

  const selectImage = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        maxWidth: 300,
        maxHeight: 300,
      },
      response => {
        if (response.assets && response.assets[0]) {
          setNewIngredient({...newIngredient, imageUri: response.assets[0].uri || ''});
        }
      },
    );
  };

  const addIngredient = () => {
    if (!newIngredient.name.trim()) {
      Alert.alert('Error', 'Please enter an ingredient name');
      return;
    }

    const ingredient: Ingredient = {
      id: Date.now().toString(),
      name: newIngredient.name,
      expiryDate: addDays(new Date(), parseInt(newIngredient.expiryDays, 10)),
      imageUri: newIngredient.imageUri,
      notes: newIngredient.notes,
      addedDate: new Date(),
    };

    saveIngredients([...ingredients, ingredient]);
    setIsAddModalVisible(false);
    setNewIngredient({name: '', expiryDays: '', notes: '', imageUri: ''});
  };

  const removeIngredient = (id: string) => {
    Alert.alert(
      'Remove Ingredient',
      'Are you sure you want to remove this item?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const filtered = ingredients.filter(item => item.id !== id);
            saveIngredients(filtered);
          },
        },
      ],
    );
  };

  const expiringItems = getExpiringIngredients();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>fridge</Text>
        </View>

        {/* Fridge Container */}
        <View style={styles.fridgeContainer}>
          {/* Fridge Background - Placeholder */}
          <View style={styles.fridge}>
            <View style={styles.fridgeTop}>
              <View style={styles.freezerDoor}>
                <View style={styles.handle} />
              </View>
            </View>
            <View style={styles.fridgeBottom}>
              <View style={styles.fridgeDoor}>
                <View style={styles.handle} />
                
                {/* Sticky Note */}
                {expiringItems.length > 0 && (
                  <View style={styles.stickyNote}>
                    <View style={styles.stickyNoteHeader}>
                      <Text style={styles.stickyNoteTitle}>⚠️ Expiring Soon!</Text>
                    </View>
                    <View style={styles.stickyNoteContent}> 
                      {expiringItems.slice(0, 4).map((item, _index) => {
                        const daysLeft = differenceInDays(item.expiryDate, new Date());
                        return (
                          <Text key={item.id} style={styles.stickyNoteItem}>
                            • {item.name} ({daysLeft === 0 ? 'Today!' : `${daysLeft} day${daysLeft === 1 ? '' : 's'}`})
                          </Text>
                        );
                      })}
                      {expiringItems.length > 4 && (
                        <Text style={styles.stickyNoteMore}>
                          +{expiringItems.length - 4} more...
                        </Text>
                      )}
                    </View>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Ingredients List (Temporary - will be inside fridge later) */}
        <View style={styles.ingredientsList}>
          <Text style={styles.sectionTitle}>Current Ingredients ({ingredients.length})</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {ingredients.map(item => (
              <TouchableOpacity
                key={item.id}
                style={styles.ingredientCard}
                onLongPress={() => removeIngredient(item.id)}>
                {item.imageUri ? (
                  <Image source={{uri: item.imageUri}} style={styles.ingredientImage} />
                ) : (
                  <View style={styles.ingredientImagePlaceholder}>
                    <Text style={styles.placeholderEmoji}>🥘</Text>
                  </View>
                )}
                <Text style={styles.ingredientName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.ingredientExpiry}>
                  {format(item.expiryDate, 'MMM d')}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Add Ingredient Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setIsAddModalVisible(true)}
          activeOpacity={0.8}>
          <Text style={styles.addButtonText}>+ Add Ingredient</Text>
        </TouchableOpacity>

        {/* Add Ingredient Modal */}
        <Modal
          visible={isAddModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsAddModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add New Ingredient</Text>
              
              <TouchableOpacity style={styles.imagePickerButton} onPress={selectImage}>
                {newIngredient.imageUri ? (
                  <Image source={{uri: newIngredient.imageUri}} style={styles.selectedImage} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Text style={styles.imagePlaceholderText}>📷 Add Photo</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TextInput
                style={styles.input}
                placeholder="Ingredient name"
                value={newIngredient.name}
                onChangeText={text => setNewIngredient({...newIngredient, name: text})}
                placeholderTextColor="#999"
              />

              <View style={styles.expiryContainer}>
                <Text style={styles.inputLabel}>Expires in:</Text>
                <TextInput
                  style={[styles.input, styles.expiryInput]}
                  placeholder="7"
                  value={newIngredient.expiryDays}
                  onChangeText={text => setNewIngredient({...newIngredient, expiryDays: text})}
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />
                <Text style={styles.inputLabel}>days</Text>
              </View>

              <TextInput
                style={[styles.input, styles.notesInput]}
                placeholder="Notes (optional)"
                value={newIngredient.notes}
                onChangeText={text => setNewIngredient({...newIngredient, notes: text})}
                multiline
                numberOfLines={3}
                placeholderTextColor="#999"
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setIsAddModalVisible(false);
                    setNewIngredient({name: '', expiryDays: '7', notes: '', imageUri: ''});
                  }}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={addIngredient}>
                  <Text style={styles.saveButtonText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  fridgeContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  fridge: {
    width: SCREEN_WIDTH * 0.8,
    height: SCREEN_HEIGHT * 0.5,
    backgroundColor: '#e0e0e0',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  fridgeTop: {
    flex: 1,
    backgroundColor: '#d0d0d0',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#b0b0b0',
  },
  freezerDoor: {
    flex: 1,
    margin: 10,
    backgroundColor: '#c5c5c5',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 20,
  },
  fridgeBottom: {
    flex: 2,
    backgroundColor: '#e8e8e8',
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  fridgeDoor: {
    flex: 1,
    margin: 10,
    backgroundColor: '#dcdcdc',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 20,
  },
  handle: {
    position: 'absolute',
    right: 15,
    width: 8,
    height: 60,
    backgroundColor: '#999',
    borderRadius: 4,
  },
  stickyNote: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 140,
    backgroundColor: '#ffeb3b',
    borderRadius: 2,
    shadowColor: '#000',
    shadowOffset: {width: 2, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    transform: [{rotate: '-2deg'}],
  },
  stickyNoteHeader: {
    backgroundColor: '#fdd835',
    padding: 8,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  stickyNoteTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  stickyNoteContent: {
    padding: 8,
  },
  stickyNoteItem: {
    fontSize: 10,
    color: '#333',
    marginBottom: 3,
  },
  stickyNoteMore: {
    fontSize: 10,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 2,
  },
  ingredientsList: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  ingredientCard: {
    width: 100,
    marginRight: 10,
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ingredientImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 5,
  },
  ingredientImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  placeholderEmoji: {
    fontSize: 30,
  },
  ingredientName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  ingredientExpiry: {
    fontSize: 10,
    color: '#666',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignSelf: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  addButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  imagePickerButton: {
    alignSelf: 'center',
    marginBottom: 20,
  },
  selectedImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  imagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: 14,
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
    color: '#333',
  },
  expiryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  expiryInput: {
    flex: 1,
    marginBottom: 0,
    marginHorizontal: 10,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 16,
    color: '#333',
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    marginLeft: 10,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default App;  
